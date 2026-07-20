export interface CreateInstituteDto {
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
}