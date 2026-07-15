import { Schema, model, Document, Types } from "mongoose";

import { UserRole, UserStatus } from "../types/user.types";

export interface UserDocument extends Document {
  firstName: string;

  lastName: string;

  email: string;

  password: string;

  avatar?: string;

  role: UserRole;

  status: UserStatus;

  organizationId?:  Types.ObjectId;

  isEmailVerified: boolean;

  profileCompleted: boolean;

  emailVerifiedAt?: Date;

  lastLoginAt?: Date;

  createdAt: Date;

  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
    },

    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STUDENT,
    },

    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
    },

    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    profileCompleted: {
      type: Boolean,
      default: false,
    },

    emailVerifiedAt: {
      type: Date,
    },

    lastLoginAt: {
      type: Date,
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

export const UserModel = model<UserDocument>(
  "User",
  UserSchema
);