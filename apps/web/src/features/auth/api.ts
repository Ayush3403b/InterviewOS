import { apiClient } from "../../lib/apiClient";

import type {
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  ResendVerificationPayload,
  ResetPasswordPayload,
  SessionInfo,
  VerifyEmailPayload,
} from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await apiClient.post<ApiEnvelope<LoginResponse>>(
    "/auth/login",
    payload
  );
  return res.data.data;
}

export async function register(
  payload: RegisterPayload
): Promise<RegisterResponse> {
  const res = await apiClient.post<ApiEnvelope<RegisterResponse>>(
    "/auth/register",
    payload
  );
  return res.data.data;
}

export async function verifyEmail(
  payload: VerifyEmailPayload
): Promise<void> {
  await apiClient.post("/auth/verify-email", payload);
}

export async function resendVerification(
  payload: ResendVerificationPayload
): Promise<void> {
  await apiClient.post("/auth/resend-verification", payload);
}

export async function forgotPassword(
  payload: ForgotPasswordPayload
): Promise<void> {
  await apiClient.post("/auth/forgot-password", payload);
}

export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<void> {
  await apiClient.post("/auth/reset-password", payload);
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post("/auth/logout", { refreshToken });
}

export async function logoutAll(): Promise<void> {
  await apiClient.post("/auth/logout-all");
}

export async function getSessions(): Promise<SessionInfo[]> {
  const res = await apiClient.get<ApiEnvelope<SessionInfo[]>>(
    "/auth/sessions"
  );
  return res.data.data;
}
