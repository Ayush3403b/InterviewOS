import { NextFunction, Request, Response } from "express";

import { verifyCaptcha } from "../shared/security/CaptchaVerifier";
import { ApiError } from "../shared/errors/ApiError";
import { ErrorCode } from "../shared/errors/ErrorCode";

/**
 * Verifies `req.body.captchaToken` before letting the request reach
 * route validation. Must run *before* `validate(schema)` - the zod
 * schemas for register/login don't (and shouldn't) know about
 * captchaToken, so validation would strip it out first otherwise.
 *
 * A no-op when CAPTCHA_PROVIDER=none (the default) - see
 * CaptchaVerifier.ts.
 */
export async function captchaMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as { captchaToken?: string } | undefined;

    const passed = await verifyCaptcha(body?.captchaToken, req.ip);

    if (!passed) {
      next(
        new ApiError(
          400,
          "CAPTCHA verification failed. Please try again.",
          ErrorCode.BAD_REQUEST
        )
      );
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
