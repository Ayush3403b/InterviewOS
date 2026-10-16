export enum InterviewPurpose {
  PRACTICE = "practice",

  MOCK_DRIVE = "mock_drive",

  SCREENING = "screening",
}

export enum InterviewStatus {
  CREATED = "created",

  READY = "ready",

  STARTED = "started",

  FINISHED = "finished",

  ARCHIVED = "archived",
}

export interface IInterviewSession {
  id: string;

  organizationId: string;

  ownerId: string;

  resumeId: string;

  status: InterviewStatus;

  purpose: InterviewPurpose;

  createdAt: Date;

  updatedAt: Date;
}