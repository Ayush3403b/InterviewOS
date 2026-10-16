import { NextFunction, Request, Response } from "express";
import { v4 as uuid } from "uuid";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestIdMiddleware(
  req: Request,
  _: Response,
  next: NextFunction
) {
  req.requestId = uuid();

  next();
}