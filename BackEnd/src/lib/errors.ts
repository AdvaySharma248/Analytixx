import type { NextFunction, Request, Response } from "express";
import multer from "multer";

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, message: string, code = "APP_ERROR", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function asyncHandler<
  TRequest extends Request = Request,
  TResponse extends Response = Response,
>(
  handler: (request: TRequest, response: TResponse, next: NextFunction) => Promise<unknown>,
) {
  return (request: TRequest, response: TResponse, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
}

export function notFoundHandler(request: Request, _response: Response, next: NextFunction) {
  next(new AppError(404, `Route ${request.method} ${request.originalUrl} not found`, "ROUTE_NOT_FOUND"));
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      details: error.details,
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    response.status(400).json({
      error: error.message,
      code: "UPLOAD_ERROR",
    });
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({
      error: "Invalid JSON body.",
      code: "INVALID_JSON",
    });
    return;
  }

  console.error("Unhandled backend error:", error);
  response.status(500).json({
    error: "Internal server error.",
    code: "INTERNAL_SERVER_ERROR",
  });
}
