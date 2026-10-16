import { ResumeDocument } from "../types/resume.types";

/**
 * ================================================================
 * Resume Comparator
 * ================================================================
 *
 * A pure diff between two versions of the same person's resume -
 * same "deterministic, not an LLM call" pattern as the proctoring
 * module's RiskEngine/ReportSummary. Every field here is computed
 * directly from what `deriveResumeInsights.ts` already produced for
 * each version; nothing here re-analyzes anything.
 */

function normalizeSkill(skill: string): string {
  return skill.trim().toLowerCase();
}

/** Case-insensitive set difference, returned in the original casing from `to`/`from`. */
function skillsDiff(from: string[], to: string[]): { added: string[]; removed: string[] } {
  const fromSet = new Set(from.map(normalizeSkill));
  const toSet = new Set(to.map(normalizeSkill));

  return {
    added: to.filter((skill) => !fromSet.has(normalizeSkill(skill))),
    removed: from.filter((skill) => !toSet.has(normalizeSkill(skill))),
  };
}

export interface ResumeComparison {
  from: { id: string; fileName: string; createdAt: Date };
  to: { id: string; fileName: string; createdAt: Date };

  atsScoreDelta: number | null;

  skillsAdded: string[];
  skillsRemoved: string[];

  experienceYearsDelta: number | null;
  seniorityChanged: boolean;
  seniorityFrom: string | null;
  seniorityTo: string | null;

  educationDegreeChanged: boolean;
  degreeFrom: string | null;
  degreeTo: string | null;

  projectsCountDelta: number | null;
  projectComplexityDelta: number | null;

  certificationsCountDelta: number | null;
  newRecognizedCertifications: string[];

  /** Fewer missing skills for the inferred role = the gap narrowed. */
  missingSkillsForRoleDelta: number | null;

  summary: string;
}

/**
 * Both resumes must belong to the same user and have finished
 * parsing (status PARSED) - the caller (ResumeService) enforces
 * that; this function just assumes it and reads whatever fields are
 * present, treating an unparsed/failed resume's missing analysis
 * fields as `null` deltas rather than throwing.
 */
export function compareResumes(
  from: ResumeDocument,
  to: ResumeDocument
): ResumeComparison {
  const { added: skillsAdded, removed: skillsRemoved } = skillsDiff(
    from.extractedSkills,
    to.extractedSkills
  );

  const atsScoreDelta =
    typeof from.atsScore === "number" && typeof to.atsScore === "number"
      ? to.atsScore - from.atsScore
      : null;

  const experienceYearsDelta =
    from.experienceAnalysis && to.experienceAnalysis
      ? round1(
          to.experienceAnalysis.totalYearsExperience -
            from.experienceAnalysis.totalYearsExperience
        )
      : null;

  const seniorityFrom = from.experienceAnalysis?.seniorityLevel ?? null;
  const seniorityTo = to.experienceAnalysis?.seniorityLevel ?? null;

  const degreeFrom = from.educationAnalysis?.highestDegreeLevel ?? null;
  const degreeTo = to.educationAnalysis?.highestDegreeLevel ?? null;

  const projectsCountDelta =
    from.projectAnalysis && to.projectAnalysis
      ? to.projectAnalysis.totalProjects - from.projectAnalysis.totalProjects
      : null;

  const projectComplexityDelta =
    from.projectAnalysis && to.projectAnalysis
      ? to.projectAnalysis.complexityScore - from.projectAnalysis.complexityScore
      : null;

  const certificationsCountDelta =
    from.certificationAnalysis && to.certificationAnalysis
      ? to.certificationAnalysis.totalCertifications -
        from.certificationAnalysis.totalCertifications
      : null;

  const newRecognizedCertifications =
    from.certificationAnalysis && to.certificationAnalysis
      ? to.certificationAnalysis.recognizedCertifications.filter(
          (cert) =>
            !from.certificationAnalysis!.recognizedCertifications.some(
              (existing) => normalizeSkill(existing) === normalizeSkill(cert)
            )
        )
      : [];

  const missingSkillsForRoleDelta =
    from.skillsGapAnalysis && to.skillsGapAnalysis
      ? to.skillsGapAnalysis.missingSkillsForRole.length -
        from.skillsGapAnalysis.missingSkillsForRole.length
      : null;

  const summary = buildSummary({
    atsScoreDelta,
    skillsAddedCount: skillsAdded.length,
    skillsRemovedCount: skillsRemoved.length,
    experienceYearsDelta,
    missingSkillsForRoleDelta,
  });

  return {
    from: { id: from.id, fileName: from.fileName, createdAt: from.createdAt },
    to: { id: to.id, fileName: to.fileName, createdAt: to.createdAt },
    atsScoreDelta,
    skillsAdded,
    skillsRemoved,
    experienceYearsDelta,
    seniorityChanged: seniorityFrom !== seniorityTo,
    seniorityFrom,
    seniorityTo,
    educationDegreeChanged: degreeFrom !== degreeTo,
    degreeFrom,
    degreeTo,
    projectsCountDelta,
    projectComplexityDelta,
    certificationsCountDelta,
    newRecognizedCertifications,
    missingSkillsForRoleDelta,
    summary,
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function buildSummary(params: {
  atsScoreDelta: number | null;
  skillsAddedCount: number;
  skillsRemovedCount: number;
  experienceYearsDelta: number | null;
  missingSkillsForRoleDelta: number | null;
}): string {
  const parts: string[] = [];

  if (params.atsScoreDelta !== null) {
    if (params.atsScoreDelta > 0) {
      parts.push(`ATS score improved by ${params.atsScoreDelta} points.`);
    } else if (params.atsScoreDelta < 0) {
      parts.push(`ATS score dropped by ${Math.abs(params.atsScoreDelta)} points.`);
    } else {
      parts.push("ATS score is unchanged.");
    }
  }

  if (params.skillsAddedCount > 0 || params.skillsRemovedCount > 0) {
    parts.push(
      `${params.skillsAddedCount} skill(s) added, ${params.skillsRemovedCount} removed.`
    );
  }

  if (params.missingSkillsForRoleDelta !== null && params.missingSkillsForRoleDelta !== 0) {
    parts.push(
      params.missingSkillsForRoleDelta < 0
        ? `Closed ${Math.abs(params.missingSkillsForRoleDelta)} skill gap(s) for the inferred role.`
        : `${params.missingSkillsForRoleDelta} more skill gap(s) for the inferred role than before.`
    );
  }

  if (parts.length === 0) {
    return "No significant changes detected between these two versions.";
  }

  return parts.join(" ");
}
