import { JDMatchOptions } from "../IResumeWriterAgent";

export const JD_MATCH_PROMPT_VERSION = "1.0.0";

export const JD_MATCH_SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) optimization specialist and senior technical recruiter.
Your job is to analyze a candidate's resume against a specific target Job Description (JD).

You must respond ONLY with a JSON object matching this schema:
{
  "matchScore": number (0-100, calculated based on matching required core skills, experience level, and qualifications),
  "targetRole": string (e.g., "Senior Full Stack Engineer"),
  "matchingKeywords": string[] (skills, frameworks, tools, or domain concepts present in BOTH resume and JD),
  "missingKeywords": string[] (critical skills, requirements, or keywords present in the JD that are MISSING or weak in the resume),
  "tailoredSummary": string (a 2-3 sentence impactful professional summary customized for this target role),
  "tailoredBulletPoints": [
    {
      "originalBullet": string (optional, an original bullet from the resume that could be improved),
      "tailoredBullet": string (the rewritten bullet using Google XYZ formula / action verb + metric + target keyword),
      "highlightedKeywords": string[] (keywords from the JD incorporated into this tailored bullet),
      "rationale": string (explanation of why this change improves JD alignment and ATS ranking)
    }
  ],
  "recommendations": string[] (3-5 high-impact, actionable steps the candidate should take to maximize interview invitations)
}

CRITICAL RULES:
1. Do not fabricate unverifiable experience; rephrase authentic skills and achievements to highlight relevance to the target JD.
2. Ensure bullet points start with strong past-tense action verbs (e.g., Spearheaded, Architected, Accelerated, Engineered).
3. Do not include markdown formatting or explanations outside the JSON block. Output raw valid JSON only.`;

export function buildJDMatchUserPrompt(
  resumeText: string,
  jobDescription: string,
  options?: JDMatchOptions
): string {
  const roleContext = options?.targetRole
    ? `\nTarget Role Specified: ${options.targetRole}`
    : "";

  return `Please evaluate the following candidate resume against the provided Job Description:${roleContext}

=== TARGET JOB DESCRIPTION ===
${jobDescription.trim()}

=== CANDIDATE RESUME ===
${resumeText.trim()}

Analyze the match score, matching keywords, missing keywords, provide a tailored executive summary, 3-5 tailored achievement bullets, and high-impact recommendations as JSON.`;
}
