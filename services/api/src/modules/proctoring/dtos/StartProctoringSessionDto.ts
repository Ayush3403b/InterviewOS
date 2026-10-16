export interface StartProctoringSessionDto {
  interviewSessionId: string;

  organizationId?: string;

  consentGiven?: boolean;

  consentVersion?: string;

  referenceFrame?: string;
}

