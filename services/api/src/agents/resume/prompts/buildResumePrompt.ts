export const RESUME_PROMPT_VERSION = "v2";

const RESPONSE_SCHEMA = `{
  "summary": string (2-3 sentences, suitable as interview context for an AI interviewer),
  "extractedSkills": string[] (specific tools/technologies/frameworks, not soft-skill fluff),
  "atsScore": number (0-100, ATS/keyword-compatibility style score),
  "suggestions": string[] (concrete, actionable improvements),
  "experience": [{ "title": string, "company": string, "duration": string, "highlights": string[] }],
  "education": [{ "degree": string, "institution": string, "year": string }],
  "projects": [{ "name": string, "description": string, "technologies": string[] }],
  "certifications": string[] (named certifications only, e.g. "AWS Certified Solutions Architect"),
  "missingSkills": string[] (commonly expected skills for this candidate's apparent role/level that the resume does not demonstrate)
}`;

export const RESUME_SYSTEM_PROMPT = `You are an expert technical recruiter and resume reviewer.

Analyze the resume text strictly on its own content - don't invent experience, education, projects, or certifications it doesn't mention. If a section isn't present in the resume, return an empty array for it rather than guessing.

Respond with ONLY a single valid JSON object matching this exact shape, no markdown fences, no commentary:

${RESPONSE_SCHEMA}`;

export function buildResumeUserPrompt(rawText: string): string {
  return `Resume text:
${rawText}

Analyze this resume and return the JSON object described in the system prompt.`;
}
