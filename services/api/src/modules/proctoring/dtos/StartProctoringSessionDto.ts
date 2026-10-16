import { ProctoredSubjectType } from "../types/proctoring.types";

export interface StartProctoringSessionDto {
  subjectType: ProctoredSubjectType;

  subjectId: string;

  consentGiven?: boolean;

  consentVersion?: string;

  referenceFrame?: string;
}
