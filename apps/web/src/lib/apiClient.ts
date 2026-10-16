import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { useAuthStore } from "../features/auth/store";

export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:5000";

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return config;
});

/**
 * Backend's uniform error envelope (see error.middleware.ts):
 *   { success: false, message, error: { code, status } }
 */
export interface ApiErrorBody {
  success: false;
  message: string;
  error: { code: string; status: number };
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.message) {
      return body.message;
    }
    if (error.message) {
      return error.message;
    }
  }
  return fallback;
}

/* -------------------------------------------------------------------------- */
/*                     Single-flight refresh-token handling                   */
/* -------------------------------------------------------------------------- */

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await axios.post<{
      data: { accessToken: string; refreshToken: string };
    }>(`${API_URL}/api/v1/auth/refresh`, { refreshToken });

    const { accessToken, refreshToken: nextRefreshToken } =
      response.data.data;

    useAuthStore.getState().setTokens(accessToken, nextRefreshToken);

    return accessToken;
  } catch {
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;

    const status = error.response?.status;
    const code = (error.response?.data as ApiErrorBody | undefined)?.error
      ?.code;

    const isAuthEndpoint = originalRequest?.url?.includes("/auth/");

    if (
      status === 401 &&
      code === "UNAUTHORIZED" &&
      originalRequest &&
      !originalRequest._retried &&
      !isAuthEndpoint
    ) {
      originalRequest._retried = true;

      refreshPromise = refreshPromise ?? refreshAccessToken();
      const newAccessToken = await refreshPromise;
      refreshPromise = null;

      if (newAccessToken) {
        originalRequest.headers.set(
          "Authorization",
          `Bearer ${newAccessToken}`
        );
        return apiClient(originalRequest);
      }

      useAuthStore.getState().clearSession();
    }

    return Promise.reject(error);
  }
);
