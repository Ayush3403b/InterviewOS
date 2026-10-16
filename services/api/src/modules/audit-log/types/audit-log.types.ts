import { Document, Types } from "mongoose";

/**
 * Security-relevant actions worth an after-the-fact investigation
 * trail - distinct from the refresh-token "sessions" feature (which
 * tracks *active devices*, not a historical log of what happened).
 * Extend this list as more sensitive actions get built; nothing here
 * requires a schema migration since `metadata` is free-form.
 */
export enum AuditAction {
  REGISTER = "REGISTER",
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGOUT = "LOGOUT",
  LOGOUT_ALL = "LOGOUT_ALL",
  PASSWORD_RESET_REQUESTED = "PASSWORD_RESET_REQUESTED",
  PASSWORD_RESET_COMPLETED = "PASSWORD_RESET_COMPLETED",
  PROCTORING_SESSION_TERMINATED = "PROCTORING_SESSION_TERMINATED",
  PROCTORING_EVENT_STATUS_UPDATED = "PROCTORING_EVENT_STATUS_UPDATED",
}

export interface AuditLog {
  action: AuditAction;

  /** Who performed the action - undefined for e.g. a failed login
   *  attempt against an email that doesn't exist (no user to attach). */
  actorId?: Types.ObjectId;

  /** For actions taken *about* another user/resource (e.g. a
   *  recruiter dismissing a candidate's proctoring event). */
  targetId?: string;

  ipAddress?: string;
  userAgent?: string;

  /** Free-form - e.g. { email } for a failed login, { eventId,
   *  status } for a proctoring review action. Never put secrets
   *  (passwords, tokens) in here. */
  metadata?: Record<string, unknown>;

  createdAt: Date;
}

export interface AuditLogDocument extends AuditLog, Document<Types.ObjectId> {}
