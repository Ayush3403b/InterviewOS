import crypto from "crypto";

export class TokenService {

  /**
   * Generates a secure random token.
   */
  static generate(
    length = 32
  ): string {

    return crypto
      .randomBytes(length)
      .toString("hex");
  }

  static hash(
    token: string
  ): string {

    return crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
  }

}