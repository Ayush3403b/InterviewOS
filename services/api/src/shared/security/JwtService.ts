import jwt, { Secret, SignOptions, JwtPayload } from "jsonwebtoken";

import { env } from "../../config/env";

export class JwtService {
  /**
   * Generate Access Token
   */
  public static generateAccessToken(
    payload: object
  ): string {
    return jwt.sign(payload, env.JWT_SECRET as Secret, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as SignOptions);
  }

  /**
   * Verify Access Token
   */
  public static verifyAccessToken(
    token: string
  ): JwtPayload | string {
    return jwt.verify(
      token,
      env.JWT_SECRET as Secret
    );
  }
}