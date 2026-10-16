import { z } from "zod";

const INTERVIEW_TYPES = [
  "TECHNICAL",
  "CODING",
  "HR",
  "SYSTEM_DESIGN",
  "BEHAVIORAL",
  "MIXED",
] as const;

const INTERVIEW_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

export const createSessionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must contain at least 3 characters.")
    .max(150, "Title cannot exceed 150 characters."),

  type: z.enum(INTERVIEW_TYPES, { error: "Choose an interview type." }),

  level: z.enum(INTERVIEW_LEVELS, { error: "Choose a difficulty level." }),

  maxQuestions: z
    .number()
    .int()
    .min(1, "Minimum 1 question is required.")
    .max(50, "Maximum 50 questions are allowed.")
    .optional(),

  targetCompany: z
    .string()
    .trim()
    .max(100, "Company name cannot exceed 100 characters.")
    .optional()
    .or(z.literal("")),

  targetRole: z
    .string()
    .trim()
    .max(100, "Role cannot exceed 100 characters.")
    .optional()
    .or(z.literal("")),

  /**
   * UI-only toggle — when true the sectionPlan sliders are shown and
   * the sectionPlan array is submitted instead of maxQuestions.
   */
  sectionPlanEnabled: z.boolean().optional(),

  sectionPlan: z
    .object({
      intro: z.number().int().min(0).max(20),
      behavioral: z.number().int().min(0).max(20),
      technical: z.number().int().min(0).max(20),
      wrapUp: z.number().int().min(0).max(20),
    })
    .optional(),
});

export type CreateSessionFormValues = z.infer<typeof createSessionSchema>;


export const INTERVIEW_TYPE_LABELS: Record<
  (typeof INTERVIEW_TYPES)[number],
  string
> = {
  TECHNICAL: "Technical",
  CODING: "Live Coding",
  HR: "HR",
  SYSTEM_DESIGN: "System Design",
  BEHAVIORAL: "Behavioral",
  MIXED: "Mixed",
};

export const INTERVIEW_LEVEL_LABELS: Record<
  (typeof INTERVIEW_LEVELS)[number],
  string
> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export { INTERVIEW_TYPES, INTERVIEW_LEVELS };
