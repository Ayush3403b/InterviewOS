import {
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
} from "../IResumeAgent";

import {
  CertificationAnalysis,
  DegreeLevel,
  EducationAnalysis,
  EmploymentGap,
  ExperienceAnalysis,
  ProjectAnalysis,
  ResumeInsights,
  SeniorityLevel,
  SkillsGapAnalysis,
} from "./resumeInsights.types";

/* -------------------------------------------------------------------------- */
/*                              Experience Analysis                           */
/* -------------------------------------------------------------------------- */

const YEAR_RE = /\b(19|20)\d{2}\b/g;
const PRESENT_RE = /present|current/i;

interface ParsedRange {
  start: number;
  end: number;
}

/**
 * Best-effort parse of a free-form duration string (e.g. "2019-2022",
 * "Jan 2020 - Present", "2021"). Not full NLP - just pulls out 4-digit
 * years and checks for "present"/"current". Returns null when nothing
 * usable is found, so callers can exclude that entry rather than
 * guess.
 */
export function parseDurationYears(
  duration: string,
  currentYear: number = new Date().getFullYear()
): ParsedRange | null {
  const years = [...duration.matchAll(YEAR_RE)].map((match) => Number(match[0]));
  const isOngoing = PRESENT_RE.test(duration);

  if (years.length >= 2) {
    const [start, end] = years;
    return end >= start ? { start, end } : { start: end, end: start };
  }

  if (years.length === 1 && isOngoing) {
    return { start: years[0], end: currentYear };
  }

  if (years.length === 1) {
    // A single year with no range and no "present" - treat as a
    // same-year entry rather than discarding it outright.
    return { start: years[0], end: years[0] };
  }

  return null;
}

function seniorityFromYears(years: number): SeniorityLevel {
  if (years >= 9) return "lead";
  if (years >= 5) return "senior";
  if (years >= 2) return "mid";
  return "entry";
}

export function analyzeExperience(experience: ExperienceEntry[]): ExperienceAnalysis {
  const ranges = experience
    .map((entry) => parseDurationYears(entry.duration))
    .filter((range): range is ParsedRange => range !== null)
    .sort((a, b) => a.start - b.start);

  if (ranges.length === 0) {
    return {
      totalYearsExperience: 0,
      seniorityLevel: "entry",
      averageTenureYears: 0,
      employmentGaps: [],
      entriesWithParsedDates: 0,
    };
  }

  const earliestStart = Math.min(...ranges.map((r) => r.start));
  const latestEnd = Math.max(...ranges.map((r) => r.end));
  const totalYearsExperience = Math.max(0, latestEnd - earliestStart);

  const averageTenureYears =
    ranges.reduce((sum, r) => sum + Math.max(0, r.end - r.start), 0) / ranges.length;

  const employmentGaps: EmploymentGap[] = [];
  for (let i = 1; i < ranges.length; i++) {
    const gapYears = ranges[i].start - ranges[i - 1].end;
    if (gapYears >= 1) {
      employmentGaps.push({
        afterYear: ranges[i - 1].end,
        beforeYear: ranges[i].start,
        gapYears,
      });
    }
  }

  return {
    totalYearsExperience,
    seniorityLevel: seniorityFromYears(totalYearsExperience),
    averageTenureYears: Math.round(averageTenureYears * 10) / 10,
    employmentGaps,
    entriesWithParsedDates: ranges.length,
  };
}

/* -------------------------------------------------------------------------- */
/*                              Education Analysis                            */
/* -------------------------------------------------------------------------- */

const PHD_RE = /ph\.?\s?d/i;
const MASTER_RE = /master|m\.?\s?tech|m\.?\s?sc|\bm\.?\s?e\b|mca|mba/i;
const BACHELOR_RE = /bachelor|b\.?\s?tech|b\.?\s?sc|\bb\.?\s?e\b|bca/i;

const DEGREE_RANK: Record<DegreeLevel, number> = {
  unknown: 0,
  bachelor: 1,
  master: 2,
  phd: 3,
};

function degreeLevelOf(degree: string): DegreeLevel {
  if (PHD_RE.test(degree)) return "phd";
  if (MASTER_RE.test(degree)) return "master";
  if (BACHELOR_RE.test(degree)) return "bachelor";
  return "unknown";
}

export function analyzeEducation(education: EducationEntry[]): EducationAnalysis {
  const highestDegreeLevel = education.reduce<DegreeLevel>((highest, entry) => {
    const level = degreeLevelOf(entry.degree);
    return DEGREE_RANK[level] > DEGREE_RANK[highest] ? level : highest;
  }, "unknown");

  return {
    highestDegreeLevel,
    degreeCount: education.length,
  };
}

/* -------------------------------------------------------------------------- */
/*                               Project Analysis                             */
/* -------------------------------------------------------------------------- */

const HAS_METRICS_RE = /\b\d+(\.\d+)?\s?(%|percent|x|million|thousand|k\b)/i;

export function analyzeProjects(projects: ProjectEntry[]): ProjectAnalysis {
  const totalProjects = projects.length;

  const hasQuantifiedImpact = projects.some((project) =>
    HAS_METRICS_RE.test(`${project.name} ${project.description}`)
  );

  const distinctTechnologiesUsed = new Set(
    projects.flatMap((project) => project.technologies.map((tech) => tech.toLowerCase()))
  ).size;

  const complexityScore = Math.max(
    0,
    Math.min(
      100,
      totalProjects * 10 + distinctTechnologiesUsed * 5 + (hasQuantifiedImpact ? 15 : 0)
    )
  );

  return {
    totalProjects,
    hasQuantifiedImpact,
    distinctTechnologiesUsed,
    complexityScore,
  };
}

/* -------------------------------------------------------------------------- */
/*                            Certification Analysis                          */
/* -------------------------------------------------------------------------- */

const KNOWN_CERTIFICATION_KEYWORDS = [
  "aws certified",
  "azure",
  "google cloud",
  "gcp certified",
  "pmp",
  "scrum",
  "cissp",
  "comptia",
  "ccna",
  "ckad",
  "cka",
  "oracle certified",
  "salesforce certified",
  "certified kubernetes",
];

export function analyzeCertifications(certifications: string[]): CertificationAnalysis {
  const recognizedCertifications = certifications.filter((cert) => {
    const lower = cert.toLowerCase();
    return KNOWN_CERTIFICATION_KEYWORDS.some((keyword) => lower.includes(keyword));
  });

  let recommendation: string;
  if (certifications.length === 0) {
    recommendation =
      "No certifications detected - consider adding ones relevant to your target role.";
  } else if (recognizedCertifications.length === 0) {
    recommendation =
      "The listed certifications don't match well-known industry credentials - double-check they're from accredited bodies and spelled out in full.";
  } else {
    recommendation = "Certifications look relevant and recognized.";
  }

  return {
    totalCertifications: certifications.length,
    recognizedCertifications,
    recommendation,
  };
}

/* -------------------------------------------------------------------------- */
/*                             Skills Gap Analysis                            */
/* -------------------------------------------------------------------------- */

/**
 * Small, illustrative starting set - extend as needed. Matching is
 * case-insensitive substring-free (exact skill-name match against
 * extractedSkills), so keep entries here spelled the same way
 * KNOWN_SKILLS in MockResumeAgent.ts spells them.
 */
const ROLE_SKILL_PROFILES: Record<string, string[]> = {
  "Frontend Engineer": ["JavaScript", "TypeScript", "React", "Vue", "Angular", "Git"],
  "Backend Engineer": ["Node.js", "Python", "Java", "SQL", "REST", "Docker", "Git"],
  "DevOps Engineer": ["Docker", "Kubernetes", "Terraform", "AWS", "Azure", "CI/CD"],
  "Data Engineer": ["SQL", "Python", "PostgreSQL", "MongoDB", "AWS"],
};

export function analyzeSkillsGap(extractedSkills: string[]): SkillsGapAnalysis {
  const skillSet = new Set(extractedSkills.map((skill) => skill.toLowerCase()));

  let bestMatch: { family: string; matched: string[]; missing: string[] } | null = null;

  for (const [family, profileSkills] of Object.entries(ROLE_SKILL_PROFILES)) {
    const matched = profileSkills.filter((skill) => skillSet.has(skill.toLowerCase()));
    const missing = profileSkills.filter((skill) => !skillSet.has(skill.toLowerCase()));

    if (matched.length > 0 && (!bestMatch || matched.length > bestMatch.matched.length)) {
      bestMatch = { family, matched, missing };
    }
  }

  if (!bestMatch) {
    return { inferredRoleFamily: null, matchedSkillsForRole: [], missingSkillsForRole: [] };
  }

  return {
    inferredRoleFamily: bestMatch.family,
    matchedSkillsForRole: bestMatch.matched,
    missingSkillsForRole: bestMatch.missing,
  };
}

/* -------------------------------------------------------------------------- */
/*                                   Entry point                              */
/* -------------------------------------------------------------------------- */

export function deriveResumeInsights(input: {
  experience?: ExperienceEntry[];
  education?: EducationEntry[];
  projects?: ProjectEntry[];
  certifications?: string[];
  extractedSkills?: string[];
}): ResumeInsights {
  return {
    experienceAnalysis: analyzeExperience(input.experience ?? []),
    educationAnalysis: analyzeEducation(input.education ?? []),
    projectAnalysis: analyzeProjects(input.projects ?? []),
    certificationAnalysis: analyzeCertifications(input.certifications ?? []),
    skillsGapAnalysis: analyzeSkillsGap(input.extractedSkills ?? []),
  };
}
