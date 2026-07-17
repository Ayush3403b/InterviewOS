export interface SessionResponse {

  id: string;

  ipAddress?: string;

  userAgent?: string;

  createdAt: Date;

  expiresAt: Date;

}