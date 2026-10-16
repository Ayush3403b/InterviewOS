import {
  EducationEntry,
  ExperienceEntry,
  IResumeAgent,
  ProjectEntry,
  ResumeAnalysis,
} from "./IResumeAgent";

const KNOWN_SKILLS = [
  "JavaScript", "TypeScript", "React", "Vue", "Angular", "Node.js",
  "Python", "Java", "C++", "C#", "Go", "Rust",
  "SQL", "PostgreSQL", "MongoDB", "MySQL", "Redis",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform",
  "Git", "CI/CD", "REST", "GraphQL", "gRPC",
  "Agile", "Scrum", "Leadership", "Communication", "Mentoring",
];

/** Broadly expected regardless of role - used only for the missingSkills heuristic. */
const COMMONLY_EXPECTED_SKILLS = ["Git", "SQL", "CI/CD", "Testing", "Cloud"];

const HAS_METRICS = /\b\d+(\.\d+)?\s?(%|percent|x|million|thousand|k\b)/i;
const DEGREE_PATTERN = /\b(Bachelor|Master|B\.?\s?Tech|M\.?\s?Tech|B\.?\s?Sc|M\.?\s?Sc|B\.?\s?E|M\.?\s?E|BCA|MCA|MBA|Ph\.?\s?D)\b/i;
const CERTIFICATION_PATTERN = /\bcertifi(ed|cate|cation)\b/i;
const DATE_RANGE_PATTERN = /\b(19|20)\d{2}\s*(-|–|to)\s*((19|20)\d{2}|present|current)\b/i;
const YEAR_PATTERN = /\b(19|20)\d{2}\b/;
const PROJECT_LINE_PATTERN = /\bproject\b/i;

const MAX_ENTRIES_PER_SECTION = 5;
const MAX_LINE_LENGTH = 150;

function truncate(text: string, max = MAX_LINE_LENGTH): string {
  return text.length > max ? `${text.slice(0, max).trim()}...` : text;
}

function skillsMentionedIn(line: string): string[] {
  const lowerLine = line.toLowerCase();
  return KNOWN_SKILLS.filter((skill) => lowerLine.includes(skill.toLowerCase()));
}

/**
 * No AI call, no API key required. Deterministic enough to unit test
 * and good enough to keep the resume flow working end-to-end (and the
 * interview-context resumeSummary chain fed) when AI_EVALUATION_PROVIDER
 * is "mock" or every real provider is unavailable.
 *
 * These heuristics are intentionally simple line-based pattern matches,
 * not real NLP - they're a functional fallback, not a substitute for
 * the LLM-backed agent's actual understanding of the resume.
 */
export class MockResumeAgent implements IResumeAgent {
  async analyze(rawText: string): Promise<ResumeAnalysis> {
    const lowerText = rawText.toLowerCase();
    const lines = rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const extractedSkills = KNOWN_SKILLS.filter((skill) =>
      lowerText.includes(skill.toLowerCase())
    );

    const wordCount = rawText.split(/\s+/).filter(Boolean).length;
    const hasMetrics = HAS_METRICS.test(rawText);

    let atsScore = 40;
    atsScore += Math.min(extractedSkills.length * 4, 32);
    atsScore += hasMetrics ? 15 : 0;
    atsScore += wordCount > 150 ? 13 : 0;
    atsScore = Math.min(100, Math.max(0, atsScore));

    const suggestions: string[] = [];

    if (!hasMetrics) {
      suggestions.push(
        "Quantify your impact with concrete numbers (e.g. \"reduced load time by 30%\")."
      );
    }

    if (wordCount < 150) {
      suggestions.push(
        "Your resume looks short - add more detail about your responsibilities and outcomes."
      );
    }

    if (extractedSkills.length < 3) {
      suggestions.push(
        "List the specific tools and technologies you've used, not just job titles."
      );
    }

    if (suggestions.length === 0) {
      suggestions.push(
        "Solid resume - tailor the skills section per role for the best ATS match."
      );
    }

    const education: EducationEntry[] = lines
      .filter((line) => DEGREE_PATTERN.test(line))
      .slice(0, MAX_ENTRIES_PER_SECTION)
      .map((line) => ({
        degree: truncate(line),
        institution: "",
        year: line.match(YEAR_PATTERN)?.[0] ?? "",
      }));

    const certifications = lines
      .filter((line) => CERTIFICATION_PATTERN.test(line))
      .slice(0, MAX_ENTRIES_PER_SECTION)
      .map((line) => truncate(line));

    const experience: ExperienceEntry[] = lines
      .filter((line) => DATE_RANGE_PATTERN.test(line))
      .slice(0, MAX_ENTRIES_PER_SECTION)
      .map((line) => ({
        title: truncate(line),
        company: "",
        duration: line.match(DATE_RANGE_PATTERN)?.[0] ?? "",
        highlights: [],
      }));

    const projects: ProjectEntry[] = lines
      .filter((line) => PROJECT_LINE_PATTERN.test(line))
      .slice(0, MAX_ENTRIES_PER_SECTION)
      .map((line) => ({
        name: truncate(line),
        description: "",
        technologies: skillsMentionedIn(line),
      }));

    const missingSkills = COMMONLY_EXPECTED_SKILLS.filter(
      (skill) => !lowerText.includes(skill.toLowerCase())
    );

    const skillsList =
      extractedSkills.length > 0
        ? extractedSkills.slice(0, 8).join(", ")
        : "no specific technical skills detected";

    return {
      summary: `Candidate resume (${wordCount} words). Key skills: ${skillsList}.`,
      extractedSkills,
      atsScore,
      suggestions,
      experience,
      education,
      projects,
      certifications,
      missingSkills,
    };
  }
}
