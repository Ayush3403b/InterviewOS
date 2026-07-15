import bcrypt from "bcryptjs";

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


export class AuthService extends BaseService<UserService> {
  constructor(
      userService: UserService
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
    const accessToken = JwtService.generateAccessToken({
      sub: user.id,
      role: user.role,
    });

  return LoginResponseMapper.toResponse(
    updatedUser ?? user,
    accessToken
  );
  }
}