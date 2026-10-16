import { ProctoringEventStatus } from "../types/proctoring.types";

export interface UpdateEventStatusDto {
  status: ProctoringEventStatus.ACKNOWLEDGED | ProctoringEventStatus.DISMISSED;
}
