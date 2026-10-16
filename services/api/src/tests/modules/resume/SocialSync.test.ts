import { describe, it, expect, vi } from "vitest";
import { SocialSyncService } from "../../../modules/resume/services/SocialSyncService";

describe("SocialSyncService", () => {
  const service = new SocialSyncService();

  describe("syncGitHubProfile", () => {
    it("parses simulated GitHub snapshot gracefully when offline or rate-limited", async () => {
      const result = await service.syncGitHubProfile("octocat");
      expect(result.source).toBe("github");
      expect(result.username).toBe("octocat");
      expect(result.extractedSkills.length).toBeGreaterThan(0);
      expect(result.repositories).toBeDefined();
      expect(result.repositories?.length).toBeGreaterThan(0);
    });

    it("throws when empty username is provided", async () => {
      await expect(service.syncGitHubProfile("")).rejects.toThrow("GitHub username is required");
    });
  });

  describe("fetchUserRepositories", () => {
    it("fetches list of repositories for a given user or falls back gracefully", async () => {
      const repos = await service.fetchUserRepositories("octocat");
      expect(Array.isArray(repos)).toBe(true);
      expect(repos.length).toBeGreaterThan(0);
      expect(repos[0]).toHaveProperty("name");
      expect(repos[0]).toHaveProperty("language");
      expect(repos[0]).toHaveProperty("stars");
    });

    it("throws when empty username is provided to fetchUserRepositories", async () => {
      await expect(service.fetchUserRepositories("")).rejects.toThrow("GitHub username is required");
    });
  });

  describe("syncLinkedInProfile", () => {
    it("parses structured JSON profile data", async () => {
      const json = JSON.stringify({
        name: "Jane Doe",
        headline: "Principal Distributed Systems Engineer",
        skills: ["Go", "Kubernetes", "gRPC", "PostgreSQL"],
        experience: [
          {
            title: "Staff Engineer",
            company: "Acme Corp",
            duration: "2020 - Present",
            description: "Built high-throughput consensus cluster.",
          },
        ],
        education: [
          {
            degree: "B.S. Computer Science",
            school: "Stanford University",
            year: "2019",
          },
        ],
      });

      const result = await service.syncLinkedInProfile({ profileData: json });
      expect(result.source).toBe("linkedin");
      expect(result.profileName).toBe("Jane Doe");
      expect(result.bio).toContain("Distributed Systems");
      expect(result.extractedSkills).toEqual(["Go", "Kubernetes", "gRPC", "PostgreSQL"]);
      expect(result.experience).toHaveLength(1);
      expect(result.education).toHaveLength(1);
    });

    it("parses plain text LinkedIn export heuristically", async () => {
      const rawText = `Alex Chen
Senior React & Node.js Developer with 6 years experience in TypeScript, AWS, and Docker.
Previous experience at Tech Innovations leading frontend micro-apps.`;

      const result = await service.syncLinkedInProfile({ rawText });
      expect(result.source).toBe("linkedin");
      expect(result.profileName).toBe("Alex Chen");
      expect(result.extractedSkills).toContain("TypeScript");
      expect(result.extractedSkills).toContain("React");
    });

    it("throws when input is empty", async () => {
      await expect(service.syncLinkedInProfile({})).rejects.toThrow(
        "LinkedIn profile data or text is required"
      );
    });
  });
});
