import { describe, it, expect, vi, beforeEach } from "vitest";
import ResumeWriterService from "../../../modules/resume-writer/services/ResumeWriterService";
import { MockResumeWriterAgent } from "../../../agents/resume-writer/MockResumeWriterAgent";
import { ResumeRepository } from "../../../modules/resume/repositories/ResumeRepository";

describe("ResumeWriterService - AI Generation and Optimization", () => {
  let service: ResumeWriterService;
  let mockAgent: MockResumeWriterAgent;
  let mockRepo: any;

  beforeEach(() => {
    mockAgent = new MockResumeWriterAgent();
    mockRepo = {
      findById: vi.fn(),
      findLatestByUser: vi.fn(),
      updateFields: vi.fn(),
    };
    service = new ResumeWriterService(
      mockAgent,
      mockRepo as unknown as ResumeRepository
    );
  });

  describe("generateResume", () => {
    it("generates a complete structured ATS resume from user options", async () => {
      const result = await service.generateResume({
        targetRole: "Senior Backend Engineer",
        experienceLevel: "senior",
        yearsOfExperience: 5,
        skills: ["Go", "Kubernetes", "gRPC", "PostgreSQL"],
        candidateName: "Jordan Vance",
      });

      expect(result.fullName).toBe("Jordan Vance");
      expect(result.targetRole).toBe("Senior Backend Engineer");
      expect(result.atsScore).toBeGreaterThanOrEqual(85);
      expect(result.skills).toContain("Go");
      expect(result.experience.length).toBeGreaterThan(0);
      expect(result.experience[0].highlights.length).toBeGreaterThan(0);
      expect(result.education.length).toBeGreaterThan(0);
      expect(result.atsOptimizationNotes.length).toBeGreaterThan(0);
    });

    it("analyzes and preserves real experience and educational details from uploaded resume without inventing fake data", async () => {
      mockRepo.findById.mockResolvedValue({
        id: "res-uploaded-1",
        experience: [
          {
            company: "Acme Real Corp",
            title: "Lead Systems Architect",
            duration: "2019 - Present",
            highlights: ["Engineered real microservices backend."],
          },
        ],
        education: [
          {
            institution: "Stanford University",
            degree: "B.S. in Computer Science",
            year: "2019",
          },
        ],
        rawText: "Lead Systems Architect at Acme Real Corp. B.S. in Computer Science from Stanford University.",
      });

      const result = await service.generateResume({
        resumeId: "res-uploaded-1",
        targetRole: "Principal Infrastructure Architect",
        experienceLevel: "senior",
        yearsOfExperience: 6,
        skills: ["Kubernetes", "Terraform", "Go"],
        candidateName: "Alex Mercer",
      });

      expect(mockRepo.findById).toHaveBeenCalledWith("res-uploaded-1");
      expect(result.experience.length).toBe(1);
      expect(result.experience[0].company).toBe("Acme Real Corp");
      expect(result.experience[0].title).toBe("Lead Systems Architect");
      expect(result.experience[0].duration).toBe("2019 - Present");
      // Verify highlights are enhanced with STAR metrics rather than garbage
      expect(result.experience[0].highlights[0]).toContain("Acme Real Corp");

      expect(result.education.length).toBe(1);
      expect(result.education[0].institution).toBe("Stanford University");
      expect(result.education[0].degree).toBe("B.S. in Computer Science");
      expect(result.education[0].year).toBe("2019");
    });

    it("integrates optional GitHub username, LinkedIn URL, and selected projects into generated resume", async () => {
      const result = await service.generateResume({
        targetRole: "Full Stack Engineer",
        experienceLevel: "mid",
        yearsOfExperience: 3,
        skills: ["TypeScript", "React", "Node.js"],
        candidateName: "Taylor Swift",
        githubUsername: "taylorswift",
        linkedinUrl: "https://linkedin.com/in/taylorswift",
        selectedProjects: [
          {
            name: "swift-audio-streamer",
            description: "High performance audio streaming platform",
            technologies: ["TypeScript", "WebAudio", "Node.js"],
            url: "https://github.com/taylorswift/swift-audio-streamer",
            stars: 42,
          },
        ],
      });

      expect(result.github).toContain("taylorswift");
      expect(result.linkedin).toBe("https://linkedin.com/in/taylorswift");
      expect(result.projects.length).toBeGreaterThan(0);
      expect(result.projects[0].name).toBe("swift-audio-streamer");
      expect(result.projects[0].url).toBe("https://github.com/taylorswift/swift-audio-streamer");
    });

    it("throws when target role is missing", async () => {
      await expect(
        service.generateResume({
          targetRole: "",
          experienceLevel: "mid",
          yearsOfExperience: 3,
          skills: ["React"],
        })
      ).rejects.toThrow("Target role is required.");
    });
  });

  describe("optimizeResume", () => {
    it("optimizes an uploaded resume with STAR bullet points and ATS keywords", async () => {
      const result = await service.optimizeResume("user-1", {
        resumeText: "Worked as a developer building features for clients.",
        jobDescription: "Looking for a Distributed Systems Engineer with Kubernetes, CI/CD, and Go.",
        targetRole: "Staff Distributed Systems Engineer",
      });

      expect(result.originalAtsScore).toBeLessThan(result.optimizedAtsScore);
      expect(result.scoreImprovement).toBeGreaterThan(0);
      expect(result.improvedSummary).toContain("Distributed Systems");
      expect(result.experience.length).toBeGreaterThan(0);
      expect(result.enhancementsSummary.length).toBeGreaterThan(0);
    });

    it("updates MongoDB document when resumeId and saveToMongo are provided", async () => {
      mockRepo.findById.mockResolvedValue({
        id: "res-123",
        userId: { toString: () => "user-123" },
        summary: "Old resume summary",
        extractedSkills: ["Python", "Django"],
        experience: [
          {
            title: "Software Engineer",
            company: "Tech Corp",
            duration: "2020 - 2022",
            highlights: ["Wrote Python code."],
          },
        ],
      });

      mockRepo.updateFields.mockResolvedValue({ id: "res-123" });

      const result = await service.optimizeResume("user-123", {
        resumeId: "res-123",
        jobDescription: "Senior Python & AWS Architect needed.",
        saveToMongo: true,
      });

      expect(mockRepo.findById).toHaveBeenCalledWith("res-123");
      expect(mockRepo.updateFields).toHaveBeenCalled();
      expect(result.mongoUpdated).toBe(true);
    });
  });
});
