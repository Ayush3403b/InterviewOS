import { Types } from "mongoose";

import { BaseRepository } from "../../../database/BaseRepository";
import { ResumeModel } from "../models/ResumeModel";
import { ResumeDocument, ResumeStatus } from "../types/resume.types";
import { ResumeAnalysis } from "../../../agents/resume/IResumeAgent";
import { ResumeInsights } from "../../../agents/resume/analysis/resumeInsights.types";

export class ResumeRepository extends BaseRepository<ResumeDocument> {
  constructor() {
    super(ResumeModel);
  }

  async findLatestByUser(userId: Types.ObjectId) {
    return this.model.findOne({ userId }).sort({ createdAt: -1 });
  }

  /** Full version history, newest first - used for the version list/comparison UI. */
  async findAllByUser(userId: Types.ObjectId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [versions, total] = await Promise.all([
      this.model.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      this.model.countDocuments({ userId }),
    ]);

    return { versions, total, page, limit };
  }

  async markParsed(id: string, data: ResumeAnalysis & ResumeInsights) {
    return this.model.findByIdAndUpdate(
      id,
      { status: ResumeStatus.PARSED, ...data },
      { new: true }
    );
  }

  async markFailed(id: string, failureReason: string) {
    return this.model.findByIdAndUpdate(
      id,
      { status: ResumeStatus.FAILED, failureReason },
      { new: true }
    );
  }

  async updateFields(id: string, updates: Partial<ResumeDocument>) {
    return this.model.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );
  }
}
