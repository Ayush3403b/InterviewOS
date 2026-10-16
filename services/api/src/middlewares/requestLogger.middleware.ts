import { NextFunction, Request, Response } from "express";

export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const started = Date.now();

  res.on("finish", () => {
    console.log(
      `[${req.requestId}] ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`
    );
  });

  next();
}
