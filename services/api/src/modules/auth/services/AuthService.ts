import { PasswordService } from "../../../shared/security/PasswordService";

import { ErrorCode } from "../../../shared/errors/ErrorCode";

import { BaseService } from "../../../shared/services/BaseService";

import { UserService } from "../../users/services/UserService";

import { RegisterUserDto } from "../dtos/RegisterUser.dto";

import { RegisterResponse } from "../responses/RegisterResponse";

import { RegisterResponseMapper } from "../responses/RegisterResponseMapper";

import { ApiError } from "../../../shared/errors/ApiError";

import { LoginUserDto } from "../dtos/LoginUser.dto";

import { LoginResponse } from "../responses/LoginResponse";

import { LoginResponseMapper } from "../responses/LoginResponseMapper";

import { JwtService } from "../../../shared/security/JwtService";

import { EmailService } from "../../../shared/mail";

import { env } from "../../../config/env";

import { ForgotPasswordDto } from "../dtos/ForgotPassword.dto";

import { TokenService } from "../../../shared/security/TokenService";

import { TokenPolicy } from "../../../shared/security/TokenPolicy";

import { PasswordPolicy } from "../../users/domain/PasswordPolicy";

import { ResetPasswordDto } from "../dtos/ResetPassword.dto";

import { RefreshTokenService } from "./RefreshTokenService";

import { RefreshTokenDto } from "../dtos/RefreshToken.dto";

import { RefreshTokenResponse } from "../responses/RefreshTokenResponse";

import { RefreshTokenResponseMapper } from "../responses/RefreshTokenResponseMapper";

import { LogoutDto } from "../dtos/Logout.dto";

import { SessionResponse } from "../responses/SessionResponse";

import { SessionResponseMapper } from "../responses/SessionResponseMapper";

import { ForgotPasswordTemplate } from "../../../shared/mail/templates/ForgotPasswordTemplate";

import { VerifyEmailDto } from "../dtos/VerifyEmail.dto";

import { ResendVerificationDto } from "../dtos/ResendVerification.dto";

import { VerifyEmailTemplate } from "../../../shared/mail/templates/VerifyEmailTemplate";

import { EmailVerificationPolicy } from "../../../shared/security/EmailVerificationPolicy";

export class AuthService extends BaseService<UserService> {
  constructor(
    userService: UserService,

    private readonly refreshTokenService: RefreshTokenService,

    private readonly emailService: EmailService
  ) {
    super(userService);
  }

  public async register(
    data: RegisterUserDto
  ): Promise<RegisterResponse> {

  const exists = await this.repository.userExists(data.email);

  if (exists) {
    throw new ApiError(
      409,
      "Email already exists",
      ErrorCode.CONFLICT
    );
  }

    const hashedPassword =
      await PasswordService.hash(data.password);

    const user = await this.repository.createUser({
      ...data,
      password: hashedPassword,
      isEmailVerified: false,
      profileCompleted: false,
    });

    /**
     * Automatically send verification email
     */
    await this.sendVerificationEmail(
      user.id
    );

   return RegisterResponseMapper.toResponse(user);
  }

  public async sendVerificationEmail(
    userId: string
  ): Promise<void> {

    const user =
      await this.repository.getUserById(userId);

    if (!user) {
      throw new ApiError(
        404,
        "User not found",
        ErrorCode.NOT_FOUND
      );
    }

    if (user.isEmailVerified) {
      throw new ApiError(
        400,
        "Email already verified",
        ErrorCode.BAD_REQUEST
      );
    }

    const token =
      TokenService.generate();

    const hashedToken =
      TokenService.hash(token);

    const expiresAt = new Date(
      Date.now() +
      EmailVerificationPolicy.getExpiryMilliseconds()
    );

    await this.repository.saveEmailVerificationToken(
      user.id,
      hashedToken,
      expiresAt
    );

    const verificationLink =
      `${env.CLIENT_URL}/verify-email?token=${token}`;

    await this.emailService.sendMail({
      to: user.email,
      subject: "Verify your InterviewOS account",
      html: VerifyEmailTemplate(
        verificationLink
      ),
    });

  }

  public async verifyEmail(
    data: VerifyEmailDto
  ): Promise<void> {

    const hashedToken =
      TokenService.hash(data.token);

    const user =
      await this.repository
        .getUserByEmailVerificationToken(
          hashedToken
        );

    if (!user) {
      throw new ApiError(
        400,
        "Invalid verification token",
        ErrorCode.BAD_REQUEST
      );
    }

    if (
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt <
        new Date()
    ) {
      throw new ApiError(
        400,
        "Verification link expired",
        ErrorCode.BAD_REQUEST
      );
    }

    await this.repository.markEmailVerified(
      user.id
    );

    await this.repository.clearEmailVerificationToken(
      user.id
    );

  }

  public async resendVerificationEmail(
    data: ResendVerificationDto
  ): Promise<void> {

    const user =
      await this.repository.getUserByEmail(
        data.email
      );

    if (!user) {
      return;
    }

    if (user.isEmailVerified) {
      return;
    }

    await this.sendVerificationEmail(
      user.id
    );

  }

  public async login(
    data: LoginUserDto,
    context?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<LoginResponse> {

    // Find user
    const user = await this.repository.getUserByEmail(
      data.email
    );

    if (!user) {
      throw new ApiError(
        401,
        "Invalid email or password",
        ErrorCode.UNAUTHORIZED
      );
    }

    // Compare password
    const passwordMatches =
      await PasswordService.compare(
        data.password,
        user.password
      );

    if (!passwordMatches) {
      throw new ApiError(
        401,
        "Invalid email or password",
        ErrorCode.UNAUTHORIZED
      );
    }

    // Update last login
    const updatedUser = await this.repository.updateLastLogin(
      user.id
    );

    // Generate JWT
    const accessToken =
      JwtService.generateAccessToken({
        sub: user.id,
        role: user.role,
      });

    const refreshToken =
      this.refreshTokenService.generateToken();

    await this.refreshTokenService.createSession({
      userId: user.id,
      token: refreshToken,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return LoginResponseMapper.toResponse(
      updatedUser ?? user,
      accessToken,
      refreshToken
    );
  }

  public async forgotPassword(
    data: ForgotPasswordDto
  ): Promise<void> {

    // Find user
    const user =
      await this.repository.getUserByEmail(
        data.email
      );

    // Prevent user enumeration
    if (!user) {
      return;
    }

    // Generate raw token
    const token =
      TokenService.generate();

    // Hash token before storing
    const hashedToken =
      TokenService.hash(token);

    // Expiry
    const expiresAt =
      new Date(
        Date.now() +
        TokenPolicy.PASSWORD_RESET_EXPIRY_MINUTES *
        60 *
        1000
      );

    // Save hash
    await this.repository.savePasswordResetToken(
      user.id,
      hashedToken,
      expiresAt
    );

    // Build reset URL
    const resetLink =
      `${env.CLIENT_URL}/reset-password?token=${token}`;

    // Generate HTML
    const html =
      ForgotPasswordTemplate(
        resetLink
      );

    // Send email
    await this.emailService.sendMail({
      to: user.email,
      subject: "Reset your InterviewOS password",
      html,
    });
  }

  public async resetPassword(
    data: ResetPasswordDto
  ): Promise<void> {

    const hashedToken =
      TokenService.hash(data.token);

    const user =
      await this.repository.getUserByPasswordResetToken(
        hashedToken
      );

    if (!user) {
      throw new ApiError(
        400,
        "Invalid or expired reset token",
        ErrorCode.BAD_REQUEST
      );
    }  

    if (
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    ) {
      throw new ApiError(
        400,
        "Invalid or expired reset token",
        ErrorCode.BAD_REQUEST
      );
    }

    if (
      !PasswordPolicy.validate(
        data.password
      )
    ) {
      throw new ApiError(
        400,
        "Password does not meet security requirements",
        ErrorCode.BAD_REQUEST
      );
    }

    const hashedPassword =
      await PasswordService.hash(
        data.password
      );

    await this.repository.resetPassword(
      user.id,
      hashedPassword
    ); 

  }

  public async refreshToken(
    data: RefreshTokenDto
  ): Promise<RefreshTokenResponse> {

    // Find active session
    const session =
      await this.refreshTokenService.findActiveSession(
        data.refreshToken
      );

    if (!session) {
      throw new ApiError(
        401,
        "Invalid refresh token",
        ErrorCode.UNAUTHORIZED
      );
    }

    // Load user
    const user =
      await this.repository.getUserById(
        session.userId.toString()
      );

    if (!user) {
      throw new ApiError(
        401,
        "Invalid refresh token",
        ErrorCode.UNAUTHORIZED
      );
    }

    // Generate new access token
    const accessToken =
      JwtService.generateAccessToken({
        sub: user.id,
        role: user.role,
      });

    // Generate new refresh token
    const refreshToken =
      this.refreshTokenService.generateToken();

    // Store new session
    await this.refreshTokenService.createSession({
      userId: user.id,
      token: refreshToken,
    });

    // Revoke old session
    await this.refreshTokenService.revokeSession(
      data.refreshToken
    );

    return RefreshTokenResponseMapper.toResponse(
      accessToken,
      refreshToken
    );
  }

  public async logout(
    data: LogoutDto
  ): Promise<void> {

    const session =
      await this.refreshTokenService.findActiveSession(
        data.refreshToken
      );

    if (!session) {
      return;
    }

    await this.refreshTokenService.revokeSession(
      data.refreshToken
    );
  }

  public async logoutAll(
    userId: string
  ): Promise<void> {

    await this.refreshTokenService
      .revokeAllUserSessions(userId);

  }

  public async getSessions(
    userId: string
  ): Promise<SessionResponse[]> {

    const sessions =
      await this.refreshTokenService.getUserSessions(
        userId
      );

    return sessions.map(
      SessionResponseMapper.toResponse
    );

  }
}