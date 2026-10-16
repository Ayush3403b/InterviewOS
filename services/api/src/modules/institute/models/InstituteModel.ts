import { Schema, model } from "mongoose";

import {
  InstituteDocument,
} from "../types/institute.types";

const InstituteSchema =
  new Schema<InstituteDocument>(
    {
      organizationId: {
        type: Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true,
      },

      name: {
        type: String,
        required: true,
        trim: true,
      },

      code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
      },

      email: {
        type: String,
        trim: true,
      },

      phone: {
        type: String,
        trim: true,
      },

      website: {
        type: String,
        trim: true,
      },

      logo: {
        type: String,
      },

      description: {
        type: String,
      },

      address: {
        type: String,
      },

      city: {
        type: String,
      },

      state: {
        type: String,
      },

      country: {
        type: String,
      },

      postalCode: {
        type: String,
      },

      isActive: {
        type: Boolean,
        default: true,
      },

      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      updatedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      deletedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      deletedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );

InstituteSchema.index({
  organizationId: 1,
  code: 1,
});

InstituteSchema.index({
  organizationId: 1,
  name: 1,
});

export default model<InstituteDocument>(
  "Institute",
  InstituteSchema
);