import {
  InstituteCategory,
  OrganizationType,
  OrganizationVisibility,
} from "../types/organization.types";

export interface CreateOrganizationDto {
  name: string;

  type: OrganizationType;

  category?: InstituteCategory;

  description?: string;

  email?: string;

  phone?: string;

  website?: string;

  logo?: string;

  visibility?: OrganizationVisibility;

  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}