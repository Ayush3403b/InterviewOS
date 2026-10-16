import { SectionName } from "../../modules/interview-session/types/interview-session.types";

/**
 * A static seed bank of role- and optionally company-specific questions.
 * These are passed as context to the Question Agent as prioritised starting
 * points — the LLM is free to rephrase, adapt, or skip them based on the
 * running transcript. Company-specific entries override role-only entries
 * when both match.
 *
 * Conventions:
 * - Keep lists short (4–6 items). Quality over quantity.
 * - Questions should be open-ended and require substantive answers.
 * - "intro" questions introduce the candidate; "wrap-up" closes the session.
 */
export interface QuestionTemplate {
  role: string;            // matched case-insensitively; substring OK
  company?: string;        // matched case-insensitively; undefined = any company
  section: SectionName;
  questions: string[];
}

export const QUESTION_TEMPLATES: QuestionTemplate[] = [
  // ─── Intro ────────────────────────────────────────────────────────────────
  {
    role: "software engineer",
    section: "intro",
    questions: [
      "Walk me through your background and what brought you to software engineering.",
      "What's the most impactful project you've shipped in the last year, and what was your specific role?",
      "How would you describe your primary technical focus area — and what's drawing you to this role?",
    ],
  },
  {
    role: "product manager",
    section: "intro",
    questions: [
      "Tell me about a product you led from concept to launch. What was your scope of ownership?",
      "How would you describe your approach to defining what to build next?",
    ],
  },
  {
    role: "data analyst",
    section: "intro",
    questions: [
      "Walk me through a recent analysis where your findings led to a concrete business decision.",
      "What does your typical data stack look like day-to-day?",
    ],
  },

  // ─── Behavioral ───────────────────────────────────────────────────────────
  {
    role: "software engineer",
    section: "behavioral",
    questions: [
      "Tell me about a time you disagreed with a technical decision your team made. How did you handle it?",
      "Describe a situation where you had to deliver work under significant time pressure. What did you cut, and why?",
      "Give an example of a bug or outage you were responsible for. Walk me through how you diagnosed and resolved it.",
      "Tell me about a time you had to learn something new quickly to unblock a project.",
    ],
  },
  {
    role: "software engineer",
    company: "google",
    section: "behavioral",
    questions: [
      "Describe a time you navigated ambiguity in a large, complex project. How did you drive clarity?",
      "Tell me about a situation where you influenced a technical direction beyond your immediate team.",
      "Give an example of how you balanced speed and correctness in a high-stakes decision.",
      "Describe a time you improved a process or system that was outside your direct scope of work.",
    ],
  },
  {
    role: "product manager",
    section: "behavioral",
    questions: [
      "Tell me about a time you had to make a difficult prioritisation call with incomplete data.",
      "Describe a situation where engineering pushed back hard on something you wanted to build. How did you resolve it?",
      "Give an example of a metric you own. How did you define it and how have you moved it?",
    ],
  },
  {
    role: "data analyst",
    section: "behavioral",
    questions: [
      "Describe a time your analysis surfaced a finding that contradicted a senior stakeholder's assumptions. What did you do?",
      "Tell me about a situation where you had to communicate a complex statistical finding to a non-technical audience.",
      "Give an example of an analysis that turned out to be wrong. How did you catch it and what did you change?",
    ],
  },

  // ─── Technical ────────────────────────────────────────────────────────────
  {
    role: "software engineer",
    section: "technical",
    questions: [
      "How do you approach designing a system that needs to handle a 10x increase in traffic?",
      "What's your mental model for deciding between a relational and a non-relational database for a new service?",
      "Walk me through how you'd debug a latency spike in a production microservice with no obvious error logs.",
      "How do you think about the trade-offs between building something in-house versus adopting an open-source library?",
    ],
  },
  {
    role: "software engineer",
    company: "google",
    section: "technical",
    questions: [
      "Design a distributed rate limiter that works across multiple data centres with eventual consistency.",
      "How would you design a notifications system that needs to send 100M personalised messages per day?",
      "Walk me through the data model and API design for a calendar application that handles recurring events.",
    ],
  },
  {
    role: "data analyst",
    section: "technical",
    questions: [
      "Walk me through how you'd detect seasonal trends in a noisy time series without over-fitting.",
      "How do you decide when an A/B test has collected enough data to call a result?",
      "Explain how you'd build a churn prediction model from scratch — data, features, validation, and deployment.",
    ],
  },

  // ─── Wrap-up ──────────────────────────────────────────────────────────────
  {
    role: "software engineer",
    section: "wrap-up",
    questions: [
      "What's something you wish you'd known at the start of your career that you know now?",
      "Where do you see yourself technically in three years?",
    ],
  },
  {
    role: "product manager",
    section: "wrap-up",
    questions: [
      "What's the biggest product failure you've been part of, and what did you take from it?",
      "Where do you want to grow most in your next role?",
    ],
  },
];

/**
 * Finds the best-matching template for a given role, company, and section.
 * Company-specific entries beat role-only entries when both match.
 * Returns an empty array if no template matches.
 */
export function findTemplateQuestions(
  role: string | undefined,
  company: string | undefined,
  section: SectionName
): string[] {
  if (!role) return [];

  const roleLower = role.toLowerCase();
  const companyLower = company?.toLowerCase();

  const roleMatches = QUESTION_TEMPLATES.filter(
    (t) =>
      roleLower.includes(t.role) &&
      t.section === section &&
      !t.company
  );

  const companyMatches = companyLower
    ? QUESTION_TEMPLATES.filter(
        (t) =>
          roleLower.includes(t.role) &&
          t.section === section &&
          t.company &&
          companyLower.includes(t.company)
      )
    : [];

  // Prefer company-specific match; fall back to role-only match.
  const best = companyMatches.length > 0 ? companyMatches[0] : roleMatches[0];
  return best?.questions ?? [];
}
