import { Types } from "mongoose";

import { BaseRepository } from "../../../database/BaseRepository";
import { ReportModel } from "../models/ReportModel";
import { ReportDocument } from "../types/report.types";

export type ReportSnapshot = Omit<
  ReportDocument,
  | keyof import("mongoose").Document
  | "interviewSessionId"
  | "userId"
  | "createdAt"
  | "updatedAt"
>;

export class ReportRepository extends BaseRepository<ReportDocument> {
  constructor() {
    super(ReportModel);
  }

  async findByInterviewSession(interviewSessionId: string | Types.ObjectId) {
    return this.model.findOne({ interviewSessionId });
  }

  async findByShareToken(shareToken: string) {
    return this.model.findOne({
      shareToken,
      isPublic: true,
      $or: [
        { shareExpiresAt: { $exists: false } },
        { shareExpiresAt: null },
        { shareExpiresAt: { $gt: new Date() } },
      ],
    });
  }

  async setShareToken(
    interviewSessionId: string | Types.ObjectId,
    shareToken: string,
    shareExpiresAt?: Date
  ) {
    return this.model.findOneAndUpdate(
      { interviewSessionId },
      {
        $set: {
          shareToken,
          isPublic: true,
          shareExpiresAt: shareExpiresAt ?? null,
        },
      },
      { new: true }
    );
  }

  async revokeShareToken(interviewSessionId: string | Types.ObjectId) {
    return this.model.findOneAndUpdate(
      { interviewSessionId },
      {
        $set: {
          isPublic: false,
        },
        $unset: {
          shareToken: "",
          shareExpiresAt: "",
        },
      },
      { new: true }
    );
  }

  async upsertForInterview(
    interviewSessionId: Types.ObjectId,
    userId: Types.ObjectId,
    snapshot: ReportSnapshot
  ) {
    return this.model.findOneAndUpdate(
      { interviewSessionId },
      { interviewSessionId, userId, ...snapshot },
      { new: true, upsert: true }
    );
  }
}
