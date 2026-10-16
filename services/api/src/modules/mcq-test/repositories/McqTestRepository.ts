import { Types } from "mongoose";

import { BaseRepository } from "../../../database/BaseRepository";

import { McqTestModel } from "../models/McqTestModel";

import {
  McqQuestion,
  McqTestDocument,
  McqTestStatus,
} from "../types/mcq-test.types";

export type NewMcqQuestion = Omit<McqQuestion, "_id"> & { _id?: Types.ObjectId };

export class McqTestRepository extends BaseRepository<McqTestDocument> {
  constructor() {
    super(McqTestModel);
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Queries                                   */
  /* -------------------------------------------------------------------------- */

  async findByCreator(createdBy: string | Types.ObjectId) {
    return this.model.find({ createdBy }).sort({ createdAt: -1 });
  }

  async findByAccessCode(accessCode: string) {
    return this.model.findOne({ accessCode });
  }

  async accessCodeExists(accessCode: string): Promise<boolean> {
    return (await this.model.exists({ accessCode })) !== null;
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Mutations                                  */
  /* -------------------------------------------------------------------------- */

  /**
   * Draft-only writes are conditioned on status so a publish racing an
   * edit can't slip unreviewed changes into a live test.
   */
  async updateDraft(
    id: string | Types.ObjectId,
    fields: Partial<McqTestDocument>
  ) {
    return this.model.findOneAndUpdate(
      { _id: id, status: McqTestStatus.DRAFT },
      { $set: fields },
      { new: true, runValidators: true }
    );
  }

  async replaceQuestions(
    id: string | Types.ObjectId,
    questions: NewMcqQuestion[]
  ) {
    return this.model.findOneAndUpdate(
      { _id: id, status: McqTestStatus.DRAFT },
      { $set: { questions } },
      { new: true, runValidators: true }
    );
  }

  async appendQuestions(
    id: string | Types.ObjectId,
    questions: NewMcqQuestion[]
  ) {
    return this.model.findOneAndUpdate(
      { _id: id, status: McqTestStatus.DRAFT },
      { $push: { questions: { $each: questions } } },
      { new: true, runValidators: true }
    );
  }

  /** Moves a test between statuses only if it's still in `from`. */
  async transition(
    id: string | Types.ObjectId,
    from: McqTestStatus[],
    to: McqTestStatus,
    extra: Partial<McqTestDocument> = {}
  ) {
    return this.model.findOneAndUpdate(
      { _id: id, status: { $in: from } },
      { $set: { status: to, ...extra } },
      { new: true }
    );
  }
}
