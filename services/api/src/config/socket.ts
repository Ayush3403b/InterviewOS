import http from "http";

import { Server as SocketIOServer } from "socket.io";

import { env } from "./env";

/**
 * Creates the Socket.IO server bound to the same HTTP server as
 * Express. Kept separate from `app.ts` so socket wiring can grow
 * (namespaces, adapters, etc.) without touching the HTTP app.
 */
export function createSocketServer(
  server: http.Server
): SocketIOServer {
  return new SocketIOServer(server, {
    path: "/socket.io",
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });
}
