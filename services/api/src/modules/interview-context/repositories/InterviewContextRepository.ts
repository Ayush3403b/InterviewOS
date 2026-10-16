import { Types } from "mongoose";

import { BaseRepository } from "../../../database/BaseRepository";
import { InterviewContextModel } from "../models/InterviewContextModel";
import { InterviewContextDocument } from "../types/interview-context.types";

export class InterviewContextRepository extends BaseRepository<InterviewContextDocument> {
  constructor() {
    super(InterviewContextModel);
  }

  async findByInterviewSession(interviewSessionId: string | Types.ObjectId) {
    return this.model.findOne({ interviewSessionId });
  }

  async getOrCreate(interviewSessionId: Types.ObjectId) {
    const existing = await this.findByInterviewSession(interviewSessionId);

    if (existing) {
      return existing;
    }

    return this.model.create({
      interviewSessionId,
      transcriptSummary: "",
      topicsCovered: [],
      difficultyHistory: [],
      answerQualityHistory: [],
      notes: [],
    });
  }

  async setResumeSummary(
    interviewSessionId: Types.ObjectId,
    resumeSummary: string
  ) {
    return this.model.findOneAndUpdate(
      { interviewSessionId },
      { resumeSummary },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  async appendTurn(
    interviewSessionId: Types.ObjectId,
    data: {
      transcriptSummary: string;
      newTopics: string[];
      difficultyUsed: string;
      answerQuality: number;
      note?: string;
    }
  ) {
    return this.model.findOneAndUpdate(
      { interviewSessionId },
      {
        $set: { transcriptSummary: data.transcriptSummary },
        $addToSet: { topicsCovered: { $each: data.newTopics } },
        $push: {
          difficultyHistory: data.difficultyUsed,
          answerQualityHistory: data.answerQuality,
          ...(data.note ? { notes: data.note } : {}),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}
