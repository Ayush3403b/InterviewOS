import { Document, Types } from "mongoose";

/**
 * Broad organization classification.
 */
export enum OrganizationType {
  PERSONAL = "personal",
  INSTITUTE = "institute",
  COMPANY = "company",
}

/**
 * Applicable only when type === INSTITUTE.
 */
export enum InstituteCategory {
  COLLEGE = "college",
  UNIVERSITY = "university",
  TRAINING_INSTITUTE = "training_institute",
  SCHOOL = "school",
}

/**
 * Organization lifecycle.
 */
export enum OrganizationStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

/**
 * Organization discoverability.
 */
export enum OrganizationVisibility {
  PUBLIC = "public",
  PRIVATE = "private",
}

/**
 * Structured address.
 */
export interface OrganizationAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

/**
 * Organization document.
 */
export interface OrganizationDocument extends Document {
  name: string;

  slug: string;

  type: OrganizationType;

  category?: InstituteCategory;

  status: OrganizationStatus;

  visibility: OrganizationVisibility;

  description?: string;

  email?: string;

  phone?: string;

  website?: string;

  logo?: string;

  address?: OrganizationAddress;

  isVerified: boolean;

  ownerId: Types.ObjectId;

  createdBy: Types.ObjectId;

  updatedBy?: Types.ObjectId;

  createdAt: Date;

  updatedAt: Date;

  deletedAt?: Date;
}

/**
 * Create Organization DTO.
 */
export interface CreateOrganizationData {
  name: string;

  type: OrganizationType;

  category?: InstituteCategory;

  description?: string;

  email?: string;

  phone?: string;

  website?: string;

  logo?: string;

  address?: OrganizationAddress;

  ownerId: string;

  createdBy: string;
}

/**
 * Update Organization DTO.
 */
export interface UpdateOrganizationData {
  name?: string;

  type?: OrganizationType;

  category?: InstituteCategory;

  status?: OrganizationStatus;

  visibility?: OrganizationVisibility;

  description?: string;

  email?: string;

  phone?: string;

  website?: string;

  logoUrl?: string;

  address?: OrganizationAddress;

  updatedBy: string;

  deletedAt?: Date;
}