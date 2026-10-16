import { z } from "zod";

export const createInstituteSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),

    code: z.string().trim().min(2).max(30),

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
  }),
});

export type CreateInstituteRequest = z.infer<
  typeof createInstituteSchema
>;