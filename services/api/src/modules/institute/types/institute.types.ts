import { Document, Types } from "mongoose";

export interface Institute {
  organizationId: Types.ObjectId;

  name: string;

  code: string;

  email?: string;

  phone?: string;

  website?: string;

  logo?: string;

  description?: string;

  address?: string;

  city?: string;

  state?: string;

  country?: string;

  postalCode?: string;

  isActive: boolean;

  createdBy: Types.ObjectId;

  updatedBy: Types.ObjectId;

  deletedBy?: Types.ObjectId;

  deletedAt?: Date | null;

  createdAt: Date;

  updatedAt: Date;
}

export interface InstituteDocument
  extends Institute,
    Document<Types.ObjectId> {}