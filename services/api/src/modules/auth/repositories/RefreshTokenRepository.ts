import { BaseRepository } from "../../../database/BaseRepository";

import {
  RefreshTokenDocument,
  RefreshTokenModel,
} from "../models/RefreshTokenModel";

export class RefreshTokenRepository
  extends BaseRepository<RefreshTokenDocument> {

  constructor() {
    super(RefreshTokenModel);
  }

  /**
   * Create a new refresh token session
   */
    public async createSession(data: {
      userId: string;
      tokenHash: string;
      expiresAt: Date;
      ipAddress?: string;
      userAgent?: string;
    }) {
      return this.model.create({
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });
    }

  /**
   * Find refresh token
   */
    public async findActiveToken(
    tokenHash: string
    ) {
    return this.model.findOne({
        tokenHash,
        revokedAt: null,
        expiresAt: {
        $gt: new Date(),
        },
    });
    }
  /**
   * Revoke a single refresh token
   */
    public async revokeSession(
      tokenHash: string
    ) {
      return this.model.findOneAndUpdate(
        {
          tokenHash,
        },
        {
          revokedAt: new Date(),
        },
        {
          new: true,
        }
      );
    }

  /**
   * Revoke all user sessions
   */
    public async revokeAllUserTokens(
      userId: string
    ) {
      return this.model.updateMany(
        {
          userId,
          revokedAt: null,
        },
        {
          revokedAt: new Date(),
        }
      );
    }

  /**
   * Delete expired refresh tokens
   */
    public async deleteExpiredTokens() {
      return this.model.deleteMany({
        expiresAt: {
          $lt: new Date(),
        },
      });
    }

    public async findUserSessions(
      userId: string
    ) {
      return this.model
        .find({
          userId,
          revokedAt: null,
          expiresAt: {
            $gt: new Date(),
          },
        })
        .sort({
          createdAt: -1,
        });
    }    
}