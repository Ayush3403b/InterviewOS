import { InstituteDocument } from "../types/institute.types";

export interface InstituteResponse {
  id: string;

  organizationId: string;

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

  createdAt: Date;

  updatedAt: Date;
}

export class InstituteResponseMapper {
  public static toResponse(
    institute: InstituteDocument
  ): InstituteResponse {
    return {
      id: institute._id.toString(),

      organizationId:
        institute.organizationId.toString(),

      name: institute.name,

      code: institute.code,

      email: institute.email,

      phone: institute.phone,

      website: institute.website,

      logo: institute.logo,

      description: institute.description,

      address: institute.address,

      city: institute.city,

      state: institute.state,

      country: institute.country,

      postalCode: institute.postalCode,

      isActive: institute.isActive,

      createdAt: institute.createdAt,

      updatedAt: institute.updatedAt,
    };
  }

  public static toResponseList(
    institutes: InstituteDocument[]
  ): InstituteResponse[] {
    return institutes.map(this.toResponse);
  }
}