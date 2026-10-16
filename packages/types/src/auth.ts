import { z } from "zod";

export type UserRole = "CANDIDATE" | "RECRUITER" | "ADMIN" | "ORG_ADMIN" | "INSTITUTE_ADMIN";

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  organizationId?: string;
  instituteId?: string;
  createdAt: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthResponseDto {
  user: UserDto;
  tokens: AuthTokensDto;
}

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, "Must include at least one uppercase letter").regex(/[0-9]/, "Must include at least one number"),
  fullName: z.string().min(2).max(100),
  role: z.enum(["CANDIDATE", "RECRUITER"]).default("CANDIDATE"),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
