import { Types } from "mongoose";

export interface CreateEvaluationDto {
  interviewSessionId: Types.ObjectId;

  organizationId: Types.ObjectId;

  candidateId: Types.ObjectId;
}