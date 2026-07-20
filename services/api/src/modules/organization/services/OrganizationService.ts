import { Types } from "mongoose";
import slugify from "slugify";

import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";
import { BaseService } from "../../../shared/services/BaseService";

import OrganizationRepository from "../repositories/OrganizationRepository";

import { CreateOrganizationDto } from "../dtos/CreateOrganization.dto";
import { UpdateOrganizationDto } from "../dtos/UpdateOrganization.dto";

import { OrganizationDocument } from "../types/organization.types";

export default class OrganizationService extends BaseService<OrganizationRepository> {
  constructor(repository: OrganizationRepository) {
    super(repository);
  }

  /**
   * Generate a unique organization slug.
   */
  private async generateSlug(name: string): Promise<string> {
    const baseSlug = slugify(name, {
      lower: true,
      strict: true,
      trim: true,
    });

    let slug = baseSlug;
    let counter = 1;

    while (await this.repository.existsBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Ensure the authenticated user owns the organization.
   */
  private async ensureOwner(
    organization: OrganizationDocument,
    userId: string
  ): Promise<void> {
    if (organization.ownerId.toString() !== userId) {
      throw new ApiError(
        403,
        "You are not allowed to modify this organization.",
        ErrorCode.FORBIDDEN
      );
    }
  }

  /**
   * Create organization.
   */
  public async createOrganization(
    data: CreateOrganizationDto,
    ownerId: string
  ): Promise<OrganizationDocument> {
    const existingOrganization = await this.repository.findByName(data.name);

    if (existingOrganization) {
      throw new ApiError(
        409,
        "Organization already exists.",
        ErrorCode.CONFLICT
      );
    }

    const slug = await this.generateSlug(data.name);

    if (!Types.ObjectId.isValid(ownerId)) {
      throw new ApiError(
        400,
        "Invalid owner ID.",
        ErrorCode.BAD_REQUEST
      );
    }

    const ownerObjectId = new Types.ObjectId(ownerId);

    return this.repository.create({
      ...data,
      slug,
      ownerId: ownerObjectId,
      createdBy: ownerObjectId,
      updatedBy: ownerObjectId,
    });
  }

  /**
   * Get organization by id.
   */
  public async getOrganizationById(
    id: string
  ): Promise<OrganizationDocument | null> {
    return this.repository.findById(id);
  }

  /**
   * Get organization by slug.
   */
  public async getOrganizationBySlug(
    slug: string
  ): Promise<OrganizationDocument | null> {
    return this.repository.findBySlug(slug);
  }

  /**
   * Get all organizations.
   */
  public async getOrganizations(): Promise<OrganizationDocument[]> {
    return this.repository.findAllActive();
  }

  /**
   * Update organization.
   */
  public async updateOrganization(
    id: string,
    data: UpdateOrganizationDto,
    userId: string
  ): Promise<OrganizationDocument | null> {
    const organization = await this.repository.findById(id);

    if (!organization) {
      throw new ApiError(
        404,
        "Organization not found",
        ErrorCode.NOT_FOUND
      );
    }

    await this.ensureOwner(organization, userId);

    if (data.name && data.name !== organization.name) {
      const existing = await this.repository.findByName(data.name);

      if (existing) {
        throw new ApiError(
          409,
          "Organization already exists",
          ErrorCode.CONFLICT
        );
      }

      const slug = await this.generateSlug(data.name);

      return this.repository.update(id, {
        ...data,
        slug,
      });
    }

    return this.repository.update(id, data);
  }

  /**
   * Soft delete organization.
   */
  public async deleteOrganization(
    id: string,
    userId: string
  ): Promise<void> {
    const organization = await this.repository.findById(id);

    if (!organization) {
      throw new ApiError(
        404,
        "Organization not found",
        ErrorCode.NOT_FOUND
      );
    }

    await this.ensureOwner(organization, userId);

    await this.repository.softDelete(id);
  }

  /**
   * Restore organization.
   */
  public async restoreOrganization(
    id: string,
    userId: string
  ): Promise<void> {
    const organization = await this.repository.findById(id);

    if (!organization) {
      throw new ApiError(
        404,
        "Organization not found",
        ErrorCode.NOT_FOUND
      );
    }

    await this.ensureOwner(organization, userId);

    await this.repository.restore(id);
  }
}