import { z } from "zod";

import { ProctoringEventStatus } from "../types/proctoring.types";

export const UpdateEventStatusSchema = z.object({
  status: z.enum([
    ProctoringEventStatus.ACKNOWLEDGED,
    ProctoringEventStatus.DISMISSED,
  ]),
});
