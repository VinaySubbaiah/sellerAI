import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { AppError } from "@sellerstudio/shared";
import type { Response } from "express";
import { logger } from "../lib/logger.js";

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = "INTERNAL";
    let message = "Something went wrong";
    if (exception instanceof AppError) {
      status = exception.status;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();
      message = typeof payload === "string" ? payload : (payload as { message?: string | string[] }).message?.toString() ?? exception.message;
      code = status === 401 ? "UNAUTHENTICATED" : status === 403 ? "FORBIDDEN" : "HTTP";
    } else {
      logger.error({ err: exception }, "unhandled");
    }
    res.status(status).json({ error: { code, message } });
  }
}
