import { ProctoredSubjectType } from "../types/proctoring.types";

export interface RecordSignalDto {
  faceCount?: number;

  faceVisible?: boolean;

  gazeAwayDurationMs?: number;

  facePosition?:
    | "in_frame"
    | "too_far"
    | "too_close"
    | "out_of_frame"
    | "partially_visible"
    | "covered";

  headPose?: "center" | "left" | "right" | "up" | "down" | "behind";

  eyesClosedDurationMs?: number;

  initStatus?: "completed" | "failed";

  initFailureReason?: string;

  browserEvent?:
    | "fullscreen_exited"
    | "devtools_opened"
    | "right_click"
    | "copy_attempt"
    | "paste_attempt"
    | "print_screen_attempt";

  deviceEvent?:
    | "camera_disconnected"
    | "camera_reconnected"
    | "mic_disconnected"
    | "mic_reconnected"
    | "internet_lost"
    | "internet_restored"
    | "webcam_freeze"
    | "device_sleep";

  idleDurationMs?: number;

  rapidClickingDetected?: boolean;

  personCountEvent?: "stranger_entered" | "stranger_left";

  tabFocused?: boolean;

  screenShareRequired?: boolean;

  screenShareActive?: boolean;

  objectsDetected?: string[];

  multipleVoicesDetected?: boolean;

  audioAnomaly?: boolean;

  connectionUnstable?: boolean;

  cameraState?: "started" | "stopped";

  micState?: "started" | "stopped";

  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };

  voiceTranscriptSnippet?: string;

  frameBase64?: string;

  extra?: Record<string, unknown>;
}

/** REST fallback body: the signal plus the subject type (id is in the URL). */
export interface RecordSignalRequestDto extends RecordSignalDto {
  subjectType: ProctoredSubjectType;
}
