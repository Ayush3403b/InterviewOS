import {
  GrammarCheckResult,
  IResumeWriterAgent,
  JDMatchOptions,
  JDMatchResult,
  RewriteOptions,
  RewriteResult,
} from "./IResumeWriterAgent";
import { runGrammarRules, scoreFromIssues } from "./rules/grammarRules";

const LEADING_PRONOUN_PATTERN = /^(I've|I'm|I|My|Me)\s+/i;

/**
 * No AI call, no API key required - same "keep the flow working
 * end-to-end when AI_EVALUATION_PROVIDER is unavailable" role as
 * every other MockXAgent in this codebase.
 */
export class MockResumeWriterAgent implements IResumeWriterAgent {
  async checkGrammar(text: string): Promise<GrammarCheckResult> {
    const issues = runGrammarRules(text);

    return {
      score: scoreFromIssues(issues),
      issues,
    };
  }

  async rewrite(text: string, _options?: RewriteOptions): Promise<RewriteResult> {
    const trimmed = text.trim();
    const withoutPronoun = trimmed.replace(LEADING_PRONOUN_PATTERN, "");
    const rewritten =
      withoutPronoun.length > 0
        ? withoutPronoun[0].toUpperCase() + withoutPronoun.slice(1)
        : trimmed;

    const changedPronoun = rewritten !== trimmed;

    return {
      original: text,
      rewritten,
      explanation: changedPronoun
        ? "Mock mode: removed the leading personal pronoun, which is the one safe mechanical fix available without a real AI provider. Connect one (see .env.example) for full rewrites with stronger verbs and quantified impact suggestions."
        : "Mock mode: no safe mechanical fix applied - this needs a real AI provider (see .env.example) for a genuine rewrite.",
    };
  }

  async matchJobDescription(
    resumeText: string,
    jobDescription: string,
    options?: JDMatchOptions
  ): Promise<JDMatchResult> {
    const jdLower = jobDescription.toLowerCase();
    const resumeLower = resumeText.toLowerCase();

    // Standard high-value keywords to look for
    const candidateKeywords = [
      "TypeScript",
      "JavaScript",
      "React",
      "Node.js",
      "Express",
      "MongoDB",
      "PostgreSQL",
      "Python",
      "Docker",
      "Kubernetes",
      "AWS",
      "GCP",
      "GraphQL",
      "REST",
      "CI/CD",
      "Microservices",
      "Tailwind",
      "Next.js",
      "Redis",
      "Agile",
      "Git",
    ];

    const jdKeywords = candidateKeywords.filter((kw) =>
      jdLower.includes(kw.toLowerCase())
    );

    const matchingKeywords = jdKeywords.filter((kw) =>
      resumeLower.includes(kw.toLowerCase())
    );

    const missingKeywords = jdKeywords.filter(
      (kw) => !resumeLower.includes(kw.toLowerCase())
    );

    const matchScore =
      jdKeywords.length > 0
        ? Math.round((matchingKeywords.length / jdKeywords.length) * 100)
        : 75;

    const targetRole = options?.targetRole || "Software Engineer";

    return {
      matchScore,
      targetRole,
      matchingKeywords: matchingKeywords.length > 0 ? matchingKeywords : ["Communication", "Problem Solving"],
      missingKeywords: missingKeywords.length > 0 ? missingKeywords : ["System Design", "Cloud Architecture"],
      tailoredSummary: `Proven ${targetRole} with hands-on experience in ${
        matchingKeywords.slice(0, 3).join(", ") || "software development"
      }, dedicated to building scalable, robust, and user-centric solutions.`,
      tailoredBulletPoints: [
        {
          originalBullet: "Built features and collaborated with the team",
          tailoredBullet: `Engineered mission-critical web applications utilizing ${
            matchingKeywords[0] || "modern frameworks"
          }, boosting user engagement and application performance by 35%.`,
          highlightedKeywords: matchingKeywords.slice(0, 2),
          rationale: "Quantified performance metrics and highlighted direct relevance to core job requirements.",
        },
      ],
      recommendations: [
        missingKeywords.length > 0
          ? `Incorporate experience or project highlights involving ${missingKeywords.slice(0, 2).join(" and ")}.`
          : "Add metrics to quantify business impact across prior roles.",
        "Align key section headings with standard ATS conventions (Summary, Experience, Education, Skills).",
        "Mirror language from the job description in your top skills and recent achievements.",
      ],
    };
  }

  async generateResume(options: any) {
    const role = options.targetRole || "Full Stack Software Engineer";
    const name = options.candidateName || "Alex Morgan";
    const skills = options.skills && options.skills.length > 0 ? options.skills : ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker", "AWS"];

    const projects = Array.isArray(options.selectedProjects) && options.selectedProjects.length > 0
      ? options.selectedProjects.map((p: any) => ({
          name: p.name,
          description: `Architected and deployed ${p.name}, an ATS-tailored high-performance solution built with ${(Array.isArray(p.technologies) && p.technologies.length > 0 ? p.technologies : skills).slice(0, 3).join(", ")}. Engineered resilient microservices, optimized database query execution, and implemented automated CI/CD pipelines, boosting system throughput by 42% with sub-100ms API latency.`,
          technologies: Array.isArray(p.technologies) && p.technologies.length > 0 ? p.technologies : skills.slice(0, 4),
          url: p.url,
        }))
      : [
          {
            name: "Enterprise Workflow Automator",
            description: "Distributed task orchestrator with real-time telemetry streaming and automated failover capabilities.",
            technologies: skills.slice(0, 4),
          },
        ];

    const hasRealExperience = Array.isArray(options.realExperience) && options.realExperience.length > 0;
    const hasRealEducation = Array.isArray(options.realEducation) && options.realEducation.length > 0;

    const experience = hasRealExperience
      ? options.realExperience.map((exp: any) => ({
          title: exp.title || `Engineer`,
          company: exp.company,
          duration: exp.duration || "2023 - Present",
          highlights: (exp.highlights && exp.highlights.length > 0 ? exp.highlights : ["Developed software features"]).map((h: string) =>
            h.length > 30 && (h.includes("%") || h.includes("Architected") || h.includes("Spearheaded"))
              ? h
              : `Spearheaded key engineering initiatives at ${exp.company} with ${skills.slice(0, 2).join(" and ")}, accelerating release frequency by 35% and improving uptime.`
          ),
        }))
      : (options.yearsOfExperience && options.yearsOfExperience > 0)
      ? [
          {
            title: `Junior ${role}`,
            company: "Technology Solutions",
            duration: "2023 - Present",
            highlights: [
              `Developed core API services using ${skills[0] || "TypeScript"} and ${skills[1] || "Node.js"}, reducing endpoint p99 latency by 35%.`,
              `Architected CI/CD deployment pipelines that decreased deployment cycle time by 40%.`,
            ],
          },
        ]
      : [];

    const education = hasRealEducation
      ? options.realEducation.map((edu: any) => ({
          degree: edu.degree || "B.S. in Computer Science",
          institution: edu.institution,
          year: edu.year || "2023",
        }))
      : [
          {
            degree: "B.S. in Computer Science",
            institution: "State University",
            year: "2023",
          },
        ];

    return {
      fullName: name,
      targetRole: role,
      summary: `High-impact ${role} with ${options.yearsOfExperience || 4}+ years of experience building resilient distributed architectures and user-facing web applications using ${skills.slice(0, 3).join(", ")}. Proven track record of improving system uptime and accelerating sprint velocity.`,
      skills,
      atsScore: 92,
      github: options.githubUsername ? `https://github.com/${options.githubUsername}` : undefined,
      linkedin: options.linkedinUrl || undefined,
      experience,
      education,
      projects,
      certifications: ["AWS Certified Solutions Architect", "Certified Kubernetes Administrator"],
      atsOptimizationNotes: [
        "100% standard single-column layout for ATS parser readability.",
        "Strong action verbs (Spearheaded, Architected, Engineered) initiating every bullet point.",
        "Quantified business and engineering metrics throughout all work experiences.",
      ],
    };
  }

  async optimizeResume(
    resumeData: any,
    jobDescription?: string,
    targetRole?: string
  ) {
    const role = targetRole || "Software Engineer";
    const existingSkills = Array.isArray(resumeData.extractedSkills) ? resumeData.extractedSkills : ["TypeScript", "React", "Node.js"];
    const jdKeywords = jobDescription ? ["Cloud Infrastructure", "Kubernetes", "GraphQL", "CI/CD"] : ["System Design", "Microservices"];

    const addedKeywords = jdKeywords.filter((kw) => !existingSkills.map((s: string) => s.toLowerCase()).includes(kw.toLowerCase()));
    const allSkills = Array.from(new Set([...existingSkills, ...addedKeywords]));

    const existingExp = Array.isArray(resumeData.experience) && resumeData.experience.length > 0
      ? resumeData.experience
      : [
          {
            title: role,
            company: "Tech Enterprise",
            duration: "2021 - Present",
            highlights: ["Worked on web development and backend services."],
          },
        ];

    const improvedExperience = existingExp.map((exp: any) => ({
      title: exp.title || role,
      company: exp.company || "Enterprise Corp",
      duration: exp.duration || "2022 - Present",
      highlights: (exp.highlights && exp.highlights.length > 0 ? exp.highlights : ["Developed software features."]).map((bullet: string) => {
        if (bullet.includes("%") || bullet.includes("Engineered") || bullet.includes("Architected")) {
          return bullet;
        }
        return `Engineered high-performance modules using ${allSkills.slice(0, 2).join(" & ")}, elevating system reliability and reducing customer-reported defects by 35%.`;
      }),
    }));

    return {
      originalAtsScore: 68,
      optimizedAtsScore: 94,
      scoreImprovement: 26,
      matchedKeywords: existingSkills,
      addedKeywords,
      improvedSummary: `Results-driven ${role} with deep expertise in ${allSkills.slice(0, 4).join(", ")}. Proven history of architecting robust systems that scale seamlessly to millions of requests with optimal ATS keyword alignment.`,
      experience: improvedExperience,
      skills: allSkills,
      projects: Array.isArray(resumeData.projects) && resumeData.projects.length > 0
        ? resumeData.projects
        : [
            {
              name: "Scalable Microservices Platform",
              description: "High-throughput API gateway with distributed caching.",
              technologies: allSkills.slice(0, 3),
            },
          ],
      education: Array.isArray(resumeData.education) ? resumeData.education : [],
      certifications: Array.isArray(resumeData.certifications) ? resumeData.certifications : [],
      enhancementsSummary: [
        "Upgraded all bullet points to the STAR framework (Action Verb + Context + Quantified Metric).",
        `Integrated ${addedKeywords.length} target industry keywords: ${addedKeywords.join(", ")}.`,
        "Strengthened professional summary with high-impact keyword density.",
        "Formatted for 100% ATS parseability across standard applicant tracking systems.",
      ],
      mongoUpdated: false,
    };
  }
}

