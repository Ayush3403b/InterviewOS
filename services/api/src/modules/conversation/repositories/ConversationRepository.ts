import { FilterQuery, Types } from "mongoose";

import { BaseRepository } from "../../../database/BaseRepository";

import { ConversationModel } from "../models/ConversationModel";
import { ConversationDocument, ConversationStatus } from "../types/conversation.types";

export class ConversationRepository extends BaseRepository<ConversationDocument> {
  constructor() {
    super(ConversationModel);
  }

  async createTurn(data: Partial<ConversationDocument>) {
    return this.create(data);
  }

  async findById(id: string) {
    return super.findById(id);
  }

  async findBySession(sessionId: string) {
    return this.model
      .find({
        sessionId: new Types.ObjectId(sessionId),
      })
      .sort({ turnNumber: 1 });
  }

  async findTurn(sessionId: string, turnNumber: number) {
    return this.model.findOne({
      sessionId: new Types.ObjectId(sessionId),
      turnNumber,
    });
  }

  async findLatestTurn(sessionId: string) {
    return this.model
      .findOne({
        sessionId: new Types.ObjectId(sessionId),
      })
      .sort({ turnNumber: -1 });
  }

  async updateAnswer(
    id: string,
    answer: string,
    timeTaken?: number
  ) {
    return this.model.findByIdAndUpdate(
      id,
      {
        answer,

        ...(timeTaken !== undefined && {
          timeTaken,
        }),

        status: ConversationStatus.ANSWERED,
      },
      {
        new: true,
      }
    );
  }

  async updateTranscript(
    id: string,
    speechTranscript: string
  ) {
    return this.model.findByIdAndUpdate(
      id,
      {
        speechTranscript,
      },
      {
        new: true,
      }
    );
  }

  async updateTurn(
    id: string,
    data: Partial<ConversationDocument>
  ) {
    return this.update(id, data);
  }

  async deleteTurn(id: string) {
    return this.delete(id);
  }

  async countTurns(sessionId: string) {
    return this.model.countDocuments({
      sessionId: new Types.ObjectId(sessionId),
    });
  }

  async getConversationHistory(sessionId: string) {
    return this.model
      .find({
        sessionId: new Types.ObjectId(sessionId),
      })
      .sort({ turnNumber: 1 });
  }

  async findWithFilter(
    filter: FilterQuery<ConversationDocument>
  ) {
    return this.model.find(filter);
  }
}

export default ConversationRepository;