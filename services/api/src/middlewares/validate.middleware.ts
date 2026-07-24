import { Request, Response, NextFunction } from "express";
import { ZodTypeAny, ZodError } from "zod";

export const validate =
  (schema: ZodTypeAny) =>
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Standard payload used by most modules
      const payload = {
        body: req.body,
        params: req.params,
        query: req.query,
      };

      try {
        // First try the standard { body, params, query } structure
        await schema.parseAsync(payload);
      } catch (error) {
        // If the schema is written without a body wrapper
        // (like the current Organization schema), try parsing
        // the raw request body before failing.
        if (error instanceof ZodError) {
          await schema.parseAsync(req.body);
        } else {
          throw error;
        }
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation Failed",
          errors: error.flatten(),
        });
        return;
      }

      next(error);
    }
  };