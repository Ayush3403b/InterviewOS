import {
  Schema,
  model,
  Document,
  Types,
} from "mongoose";

export interface RefreshTokenDocument
  extends Document {

  userId: Types.ObjectId;

  tokenHash: string;

  expiresAt: Date;

  revokedAt?: Date;

  ipAddress?: string;

  userAgent?: string;

  createdAt: Date;

  updatedAt: Date;
}

const RefreshTokenSchema =
  new Schema<RefreshTokenDocument>(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      tokenHash: {
        type: String,
        required: true,
        unique: true,
      },

      expiresAt: {
        type: Date,
        required: true,
        index: true,
      },

      revokedAt: {
        type: Date,
      },

      ipAddress: {
        type: String,
      },

      userAgent: {
        type: String,
      },
    },
    {
      timestamps: true,

      versionKey: false,

      toJSON: {
        virtuals: true,
      },

      toObject: {
        virtuals: true,
      },
    }
  );

export const RefreshTokenModel =
  model<RefreshTokenDocument>(
    "RefreshToken",
    RefreshTokenSchema
  );