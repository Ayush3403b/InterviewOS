import { z } from "zod";

import { ProctoredSubjectType } from "../types/proctoring.types";

/**
 * Generous for the checklist's 640x480 JPEG snapshot, while keeping a
 * client from parking megabytes in a session row.
 */
export const REFERENCE_FRAME_MAX_LENGTH = 1_000_000;

export const StartProctoringSessionSchema = z.object({
  subjectType: z.nativeEnum(ProctoredSubjectType, {
    error: "Invalid subject type.",
  }),

  subjectId: z.string().min(1),

  consentGiven: z.boolean().optional(),

  consentVersion: z.string().max(20).optional(),

  referenceFrame: z.string().max(REFERENCE_FRAME_MAX_LENGTH).optional(),
});
