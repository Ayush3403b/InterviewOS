import { Types } from "mongoose";

import { BaseRepository } from "../../../database/BaseRepository";
import { CoachingPlanModel } from "../models/CoachingPlanModel";
import { CoachingPlanDocument } from "../types/coach.types";
import { CoachingPlan } from "../../../agents/coach/ICoachAgent";

export class CoachingPlanRepository extends BaseRepository<CoachingPlanDocument> {
  constructor() {
    super(CoachingPlanModel);
  }

  async findByInterviewSession(interviewSessionId: string | Types.ObjectId) {
    return this.model.findOne({ interviewSessionId });
  }

  async upsertForInterview(
    interviewSessionId: Types.ObjectId,
    userId: Types.ObjectId,
    evaluationId: Types.ObjectId,
    plan: CoachingPlan
  ) {
    return this.model.findOneAndUpdate(
      { interviewSessionId },
      { interviewSessionId, userId, evaluationId, ...plan },
      { new: true, upsert: true }
    );
  }
}
