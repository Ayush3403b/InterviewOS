import { z } from "zod";

export const updateInstituteSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120).optional(),

    code: z.string().trim().min(2).max(30).optional(),

    email: z.string().email().optional(),

    phone: z.string().optional(),

    website: z.string().url().optional(),

    logo: z.string().optional(),

    description: z.string().optional(),

    address: z.string().optional(),

    city: z.string().optional(),

    state: z.string().optional(),

    country: z.string().optional(),

    postalCode: z.string().optional(),

    isActive: z.boolean().optional(),
  }),
});

export type UpdateInstituteRequest = z.infer<
  typeof updateInstituteSchema
>;