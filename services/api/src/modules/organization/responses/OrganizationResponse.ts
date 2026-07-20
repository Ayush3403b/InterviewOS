import { OrganizationDocument } from "../types/organization.types";

export interface OrganizationResponse {
  id: string;

  name: string;

  slug: string;

  type: string;

  category?: string;

  status: string;

  visibility: string;

  description?: string;

  email?: string;

  phone?: string;

  website?: string;

  logo?: string;

  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };

  isVerified: boolean;

  ownerId: string;

  createdAt: Date;

  updatedAt: Date;
}

export class OrganizationResponseMapper {
  public static toResponse(
    organization: OrganizationDocument
  ): OrganizationResponse {
    return {
      id: organization.id,

      name: organization.name,

      slug: organization.slug,

      type: organization.type,

      category: organization.category,

      status: organization.status,

      visibility: organization.visibility,

      description: organization.description,

      email: organization.email,

      phone: organization.phone,

      website: organization.website,

      logo: organization.logo,

      address: organization.address,

      isVerified: organization.isVerified,

      ownerId: organization.ownerId.toString(),

      createdAt: organization.createdAt,

      updatedAt: organization.updatedAt,
    };
  }

  public static toResponseList(
    organizations: OrganizationDocument[]
  ): OrganizationResponse[] {
    return organizations.map((organization) =>
      this.toResponse(organization)
    );
  }
}