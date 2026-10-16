import { TokenService } from "./TokenService";

export class RefreshTokenGenerator {

  /**
   * Generate a cryptographically secure
   * refresh token.
   */
  static generate(): string {
    return TokenService.generate(64);
  }

}