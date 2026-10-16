import { Types } from "mongoose";

import { BaseRepository } from "../../../database/BaseRepository";

import InstituteModel from "../models/InstituteModel";
import { InstituteDocument } from "../types/institute.types";

export default class InstituteRepository extends BaseRepository<InstituteDocument> {
  constructor() {
    super(InstituteModel);
  }

  public async findByName(
    organizationId: Types.ObjectId,
    name: string
  ): Promise<InstituteDocument | null> {
    return this.model.findOne({
      organizationId,
      name,
      deletedAt: null,
    });
  }

  public async findByCode(
    organizationId: Types.ObjectId,
    code: string
  ): Promise<InstituteDocument | null> {
    return this.model.findOne({
      organizationId,
      code,
      deletedAt: null,
    });
  }

  public async findAllByOrganization(
    organizationId: Types.ObjectId
  ): Promise<InstituteDocument[]> {
    return this.model
      .find({
        organizationId,
        deletedAt: null,
      })
      .sort({ createdAt: -1 });
  }

  public async softDelete(id: string): Promise<void> {
    await this.model.findByIdAndUpdate(id, {
      deletedAt: new Date(),
    });
  }

  public async restore(id: string): Promise<void> {
    await this.model.findByIdAndUpdate(id, {
      deletedAt: null,
    });
  }
}