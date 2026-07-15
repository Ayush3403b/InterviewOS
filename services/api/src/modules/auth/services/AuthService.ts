import bcrypt from "bcryptjs";
import crypto from "crypto";
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

import { ForgotPasswordTemplate } from "../../../shared/mail/templates/ForgotPasswordTemplate";

export class AuthService extends BaseService<UserService> {
  constructor(
      userService: UserService,
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

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await this.repository.createUser({
      ...data,
      password: hashedPassword,
      isEmailVerified: false,
      profileCompleted: false,
    });

   return RegisterResponseMapper.toResponse(user);
  }

  public async login(
    data: LoginUserDto
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
    const passwordMatches = await bcrypt.compare(
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

  return LoginResponseMapper.toResponse(
    updatedUser ?? user,
    accessToken
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
      crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

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
}