import jwt, { Secret, SignOptions } from "jsonwebtoken";

import { env } from "../../config/env";

import { TokenPayload } from "./TokenPayload";

export class JwtService {
  /**
   * Generate JWT Access Token
   */
  public static generateAccessToken(
    payload: Omit<TokenPayload, "iat" | "exp">
  ): string {
    return jwt.sign(
      payload,
      env.JWT_SECRET as Secret,
      {
        expiresIn: env.JWT_EXPIRES_IN,
      } as SignOptions
    );
  }

  /**
   * Verify JWT Access Token
   */
  public static verifyAccessToken(
    token: string
  ): TokenPayload {
    return jwt.verify(
      token,
      env.JWT_SECRET as Secret
    ) as TokenPayload;
  }
}