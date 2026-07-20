import { Response } from "express";

import { BaseController } from "../../../shared/http/BaseController";
import { AuthenticatedRequest } from "../../../shared/security/AuthenticatedRequest";

import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import OrganizationService from "../services/OrganizationService";

import { OrganizationResponseMapper } from "../responses/OrganizationResponse";

import { CreateOrganizationDto } from "../dtos/CreateOrganization.dto";
import { UpdateOrganizationDto } from "../dtos/UpdateOrganization.dto";

class OrganizationController extends BaseController {
  constructor(
    private readonly organizationService: OrganizationService
  ) {
    super();
  }

  /**
   * Returns the authenticated user's id.
   */
  private getAuthenticatedUserId(
    req: AuthenticatedRequest
  ): string {
    const userId = req.user?.sub;

    if (!userId) {
      throw new ApiError(
        401,
        "Authentication required",
        ErrorCode.UNAUTHORIZED
      );
    }

    return userId;
  }

  /**
   * Create Organization
   */
  public createOrganization = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const ownerId = this.getAuthenticatedUserId(req);

    const organization =
      await this.organizationService.createOrganization(
        req.body as CreateOrganizationDto,
        ownerId
      );

    this.created(
      res,
      "Organization created successfully",
      OrganizationResponseMapper.toResponse(organization)
    );

    return;
  };

  /**
   * Get Organization By Id
   */
  public getOrganizationById = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const organization =
      await this.organizationService.getOrganizationById(id);

    if (!organization) {
      throw new ApiError(
        404,
        "Organization not found",
        ErrorCode.NOT_FOUND
      );
    }

    this.ok(
      res,
      "Organization fetched successfully",
      OrganizationResponseMapper.toResponse(organization)
    );

    return;
  };

  /**
   * Get Organization By Slug
   */
  public getOrganizationBySlug = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const slug = Array.isArray(req.params.slug)
      ? req.params.slug[0]
      : req.params.slug;

    const organization =
      await this.organizationService.getOrganizationBySlug(slug);

    if (!organization) {
      throw new ApiError(
        404,
        "Organization not found",
        ErrorCode.NOT_FOUND
      );
    }

    this.ok(
      res,
      "Organization fetched successfully",
      OrganizationResponseMapper.toResponse(organization)
    );

    return;
  };

  /**
   * Get All Organizations
   */
  public getOrganizations = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const organizations =
      await this.organizationService.getOrganizations();

    this.ok(
      res,
      "Organizations fetched successfully",
      OrganizationResponseMapper.toResponseList(organizations)
    );

    return;
  };

  /**
   * Update Organization
   */
  public updateOrganization = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const userId = this.getAuthenticatedUserId(req);

    const organization =
      await this.organizationService.updateOrganization(
        id,
        req.body as UpdateOrganizationDto,
        userId
      );

    if (!organization) {
      throw new ApiError(
        404,
        "Organization not found",
        ErrorCode.NOT_FOUND
      );
    }

    this.ok(
      res,
      "Organization updated successfully",
      OrganizationResponseMapper.toResponse(organization)
    );

    return;
  };

  /**
   * Delete Organization
   */
  public deleteOrganization = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const userId = this.getAuthenticatedUserId(req);

    await this.organizationService.deleteOrganization(
      id,
      userId
    );

    this.ok(
      res,
      "Organization deleted successfully"
    );

    return;
  };

  /**
   * Restore Organization
   */
  public restoreOrganization = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const userId = this.getAuthenticatedUserId(req);

    await this.organizationService.restoreOrganization(
      id,
      userId
    );

    this.ok(
      res,
      "Organization restored successfully"
    );

    return;
  };
}

export default OrganizationController;