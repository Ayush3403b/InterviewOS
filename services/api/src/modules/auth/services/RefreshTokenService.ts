import { BaseService } from "../../../shared/services/BaseService";
import { RefreshTokenRepository } from "../repositories/RefreshTokenRepository";

import { TokenService } from "../../../shared/security/TokenService";
import { RefreshTokenPolicy } from "../../../shared/security/RefreshTokenPolicy";

export class RefreshTokenService
  extends BaseService<RefreshTokenRepository> {

  constructor(
    repository: RefreshTokenRepository
  ) {
    super(repository);
  }

  /**
   * Generate a raw refresh token
   */
  public generateToken(): string {
    return TokenService.generate(64);
  }

  /**
   * Hash refresh token
   */
  public hashToken(
    token: string
  ): string {
    return TokenService.hash(token);
  }

  /**
   * Calculate expiry
   */
  public getExpiryDate(): Date {

    return new Date(
      Date.now() +
      RefreshTokenPolicy.EXPIRY_DAYS *
      24 *
      60 *
      60 *
      1000
    );
  }

  /**
   * Create a refresh token session
   */
  public async createSession(data: {
    userId: string;
    token: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<string> {

    const tokenHash =
      this.hashToken(data.token);

    const expiresAt =
      this.getExpiryDate();

    await this.repository.createSession({
      userId: data.userId,
      tokenHash,
      expiresAt,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });

    return data.token;
  }

  public async findActiveSession(
    token: string
  ) {

    return this.repository.findActiveToken(
      this.hashToken(token)
    );

  }

  public async revokeSession(
    token: string
  ) {

    return this.repository.revokeSession(
      this.hashToken(token)
    );

  }

  public async revokeAllUserSessions(
    userId: string
  ) {

    return this.repository.revokeAllUserTokens(
      userId
    );

  }

  public async getUserSessions(
    userId: string
  ) {
    return this.repository.findUserSessions(
      userId
    );
  }

}