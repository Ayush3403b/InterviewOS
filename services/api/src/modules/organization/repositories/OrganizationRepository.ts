import { FilterQuery } from "mongoose";

import { BaseRepository } from "../../../database/BaseRepository";

import OrganizationModel from "../models/OrganizationModel";

import {
  OrganizationDocument,
} from "../types/organization.types";

export default class OrganizationRepository extends BaseRepository<OrganizationDocument> {
  constructor() {
    super(OrganizationModel);
  }

  /**
   * Find organization by slug.
   */
  public async findBySlug(
    slug: string
  ): Promise<OrganizationDocument | null> {
    return this.findOne({
      slug,
      deletedAt: null,
    } as FilterQuery<OrganizationDocument>);
  }

  /**
   * Find organization by name.
   */
  public async findByName(
    name: string
  ): Promise<OrganizationDocument | null> {
    return this.findOne({
      name,
      deletedAt: null,
    } as FilterQuery<OrganizationDocument>);
  }

  /**
   * Find organization by email.
   */
  public async findByEmail(
    email: string
  ): Promise<OrganizationDocument | null> {
    return this.findOne({
      email,
      deletedAt: null,
    } as FilterQuery<OrganizationDocument>);
  }

  /**
   * Check whether slug already exists.
   */
  public async existsBySlug(
    slug: string
  ): Promise<boolean> {
    const organization = await this.findBySlug(slug);

    return organization !== null;
  }

  /**
   * Check whether organization name already exists.
   */
  public async existsByName(
    name: string
  ): Promise<boolean> {
    const organization = await this.findByName(name);

    return organization !== null;
  }

  /**
   * Get all active organizations.
   */
  public async findAllActive(): Promise<
    OrganizationDocument[]
  > {
    return this.findAll({
      deletedAt: null,
    } as FilterQuery<OrganizationDocument>);
  }

  /**
   * Soft delete organization.
   */
  public async softDelete(
    id: string
  ): Promise<OrganizationDocument | null> {
    return this.update(id, {
      deletedAt: new Date(),
    } as Partial<OrganizationDocument>);
  }

  /**
   * Restore organization.
   */
  public async restore(
    id: string
  ): Promise<OrganizationDocument | null> {
    return this.update(id, {
      deletedAt: undefined,
    } as Partial<OrganizationDocument>);
  }
}