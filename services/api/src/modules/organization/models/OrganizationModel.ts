import mongoose, { Schema } from "mongoose";

import {
  InstituteCategory,
  OrganizationDocument,
  OrganizationStatus,
  OrganizationType,
  OrganizationVisibility,
} from "../types/organization.types";



const OrganizationSchema = new Schema<OrganizationDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    type: {
      type: String,
      enum: Object.values(OrganizationType),
      required: true,
    },

    category: {
      type: String,
      enum: Object.values(InstituteCategory),
    },

    status: {
      type: String,
      enum: Object.values(OrganizationStatus),
      default: OrganizationStatus.ACTIVE,
    },

    visibility: {
      type: String,
      enum: Object.values(OrganizationVisibility),
      default: OrganizationVisibility.PUBLIC,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        sparse: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    website: {
      type: String,
      match: /^https?:\/\/.+/,
      trim: true,
    },

    logo: {
      type: String,
      trim: true,
    },

    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,

    versionKey: false,

    toJSON: {
      virtuals: true,

        transform(_, ret: any) {
            ret.id = ret._id.toString();

            delete ret._id;

            return ret;
        }
    },
  }
  
);

OrganizationSchema.index({ slug: 1 }, { unique: true, background: true });

OrganizationSchema.index({ ownerId: 1 });

OrganizationSchema.index({ type: 1 });

OrganizationSchema.index({ status: 1 });

OrganizationSchema.index({ visibility: 1 });

const OrganizationModel =
    mongoose.model<OrganizationDocument>(
        "Organization",
        OrganizationSchema
    );

export default OrganizationModel;    

