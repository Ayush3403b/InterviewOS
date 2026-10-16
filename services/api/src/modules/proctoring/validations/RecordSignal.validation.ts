import { z } from "zod";

import { ProctoredSubjectType } from "../types/proctoring.types";

export const RecordSignalSchema = z.object({
  faceCount: z.number().min(0).max(20).optional(),

  faceVisible: z.boolean().optional(),

  gazeAwayDurationMs: z.number().min(0).optional(),

  facePosition: z
    .enum([
      "in_frame",
      "too_far",
      "too_close",
      "out_of_frame",
      "partially_visible",
      "covered",
    ])
    .optional(),

  headPose: z
    .enum(["center", "left", "right", "up", "down", "behind"])
    .optional(),

  eyesClosedDurationMs: z.number().min(0).optional(),

  initStatus: z.enum(["completed", "failed"]).optional(),

  initFailureReason: z.string().max(200).optional(),

  browserEvent: z
    .enum([
      "fullscreen_exited",
      "devtools_opened",
      "right_click",
      "copy_attempt",
      "paste_attempt",
      "print_screen_attempt",
    ])
    .optional(),

  deviceEvent: z
    .enum([
      "camera_disconnected",
      "camera_reconnected",
      "mic_disconnected",
      "mic_reconnected",
      "internet_lost",
      "internet_restored",
      "webcam_freeze",
      "device_sleep",
    ])
    .optional(),

  idleDurationMs: z.number().min(0).optional(),

  rapidClickingDetected: z.boolean().optional(),

  personCountEvent: z.enum(["stranger_entered", "stranger_left"]).optional(),

  tabFocused: z.boolean().optional(),

  screenShareRequired: z.boolean().optional(),

  screenShareActive: z.boolean().optional(),

  objectsDetected: z.array(z.string()).max(20).optional(),

  multipleVoicesDetected: z.boolean().optional(),

  audioAnomaly: z.boolean().optional(),

  connectionUnstable: z.boolean().optional(),

  cameraState: z.enum(["started", "stopped"]).optional(),

  micState: z.enum(["started", "stopped"]).optional(),

  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      accuracy: z.number().optional(),
    })
    .optional(),

  voiceTranscriptSnippet: z.string().max(2000).optional(),

  // ~500KB of base64 - generous for a compressed, low-res JPEG frame,
  // while bounding storage/DoS risk now that this gets persisted as
  // event evidence (see RuleBasedProctoringAgent's evidence attachment).
  frameBase64: z.string().max(500_000).optional(),

  extra: z.record(z.string(), z.unknown()).optional(),
});

/**
 * REST fallback body - the signal plus which kind of subject it's for
 * (the subject id comes from the URL).
 */
export const RecordSignalRequestSchema = RecordSignalSchema.extend({
  subjectType: z.nativeEnum(ProctoredSubjectType),
});

/** Socket payload - the signal plus the full subject reference. */
export const SocketSignalSchema = RecordSignalSchema.extend({
  subjectType: z.nativeEnum(ProctoredSubjectType),
  subjectId: z.string().min(1),
});
