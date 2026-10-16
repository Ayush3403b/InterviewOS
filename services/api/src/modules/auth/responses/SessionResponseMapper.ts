import { RefreshTokenDocument } from "../models/RefreshTokenModel";
import { SessionResponse } from "./SessionResponse";

export class SessionResponseMapper {

  static toResponse(
    session: RefreshTokenDocument
  ): SessionResponse {

    return {

      id: session.id,

      ipAddress: session.ipAddress,

      userAgent: session.userAgent,

      createdAt: session.createdAt,

      expiresAt: session.expiresAt,

    };

  }

}