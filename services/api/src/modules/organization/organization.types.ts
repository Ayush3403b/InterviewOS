export enum OrganizationType {
  PERSONAL = "personal",

  INSTITUTE = "institute",

  COMPANY = "company",
}

export interface IOrganization {
  id: string;

  name: string;

  type: OrganizationType;

  ownerId: string;

  createdAt: Date;

  updatedAt: Date;
}
