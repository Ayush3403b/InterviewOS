import { z } from "zod";

export const HealthSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({}),
});