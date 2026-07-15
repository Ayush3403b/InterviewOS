import { Response } from "express";
import { ApiResponse } from "./ApiResponse";

export abstract class BaseController {
  protected ok<T>(
    res: Response,
    message: string,
    data?: T
  ): Response {
    return res.status(200).json(
      ApiResponse.success(message, data)
    );
  }

  protected created<T>(
    res: Response,
    message: string,
    data?: T
  ): Response {
    return res.status(201).json(
      ApiResponse.success(message, data)
    );
  }
}