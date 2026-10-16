import { z } from "zod";

/** Mirrors CreateMcqTestBody / the settings part of UpdateMcqTestBody. */
export const testSettingsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must contain at least 3 characters.")
    .max(150, "Title cannot exceed 150 characters."),

  description: z.string().trim().max(2000, "Keep the description under 2000 characters."),

  instructions: z
    .string()
    .trim()
    .max(4000, "Keep the instructions under 4000 characters."),

  durationMinutes: z
    .number({ error: "Enter a duration in minutes." })
    .int("Use whole minutes.")
    .min(1, "At least 1 minute.")
    .max(300, "At most 300 minutes."),

  passPercentage: z
    .number({ error: "Enter a pass mark." })
    .min(0, "0-100.")
    .max(100, "0-100."),

  shuffleQuestions: z.boolean(),

  shuffleOptions: z.boolean(),

  showScoreToCandidate: z.boolean(),
});

export type TestSettingsFormValues = z.infer<typeof testSettingsSchema>;

export const TEST_SETTINGS_DEFAULTS: TestSettingsFormValues = {
  title: "",
  description: "",
  instructions: "",
  durationMinutes: 30,
  passPercentage: 50,
  shuffleQuestions: true,
  shuffleOptions: true,
  showScoreToCandidate: true,
};
