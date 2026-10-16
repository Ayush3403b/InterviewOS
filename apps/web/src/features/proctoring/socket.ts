import { io, type Socket } from "socket.io-client";

const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:5000";

/**
 * Opens a connection to the backend's `/proctoring` namespace
 * (see services/api/src/socket/gateway.ts). Auth uses the same JWT
 * access token as the REST API - no separate login required.
 */
export function connectProctoringSocket(accessToken: string): Socket {
  return io(`${API_URL}/proctoring`, {
    auth: { token: accessToken },
    transports: ["websocket"],
    autoConnect: true,
  });
}
