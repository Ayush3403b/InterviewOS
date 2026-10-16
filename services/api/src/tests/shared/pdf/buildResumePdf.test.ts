import { describe, expect, it } from "vitest";

import { buildResumePdf, ExportResumeDto } from "../../../shared/pdf/buildResumePdf";

describe("buildResumePdf", () => {
  it("renders a valid PDF buffer for a complete resume", async () => {
    const resumeData: ExportResumeDto = {
      fullName: "Alex Mercer",
      title: "Senior Full Stack Engineer",
      email: "alex.mercer@example.com",
      phone: "+1 (555) 019-2834",
      location: "San Francisco, CA",
      linkedin: "linkedin.com/in/alexmercer",
      github: "github.com/alexmercer",
      summary:
        "Full-stack engineer with 6+ years of experience architecting high-throughput distributed systems.",
      skills: [
        "TypeScript",
        "React",
        "Node.js",
        "GraphQL",
        "Docker",
        "AWS",
        "PostgreSQL",
      ],
      experience: [
        {
          title: "Staff Software Engineer",
          company: "CloudScale Systems",
          duration: "2022 - Present",
          location: "San Francisco, CA",
          bullets: [
            "Architected real-time analytics streaming engine processing 50k events/sec with under 20ms latency.",
            "Led migration from legacy monolith to serverless microservices on AWS Lambda.",
          ],
        },
      ],
      education: [
        {
          degree: "B.S. in Computer Science",
          institution: "University of California, Berkeley",
          year: "2018",
        },
      ],
      projects: [
        {
          name: "InterviewOS Open Source",
          description: "AI-driven interview simulation and proctoring engine.",
          technologies: ["React", "Express", "Vitest", "Docker"],
        },
      ],
      certifications: ["AWS Certified Solutions Architect - Professional"],
    };

    const buffer = await buildResumePdf(resumeData);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    // PDF Magic bytes check: %PDF-
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("renders a PDF buffer with minimal fields without error", async () => {
    const minimalResume: ExportResumeDto = {
      fullName: "Jane Doe",
      email: "jane@example.com",
    };

    const buffer = await buildResumePdf(minimalResume);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
  });
});
