import { Request } from "express";

import { TokenPayload } from "./TokenPayload";

export interface AuthenticatedRequest
  extends Request {

  user?: TokenPayload;
}