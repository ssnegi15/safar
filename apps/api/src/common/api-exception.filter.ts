import {
  Catch,
  HttpException,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const requestId = response.locals.requestId ?? 'unknown';
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(JSON.stringify({ event: 'request.failed', requestId, status }));
    }
    const message =
      status >= HttpStatus.INTERNAL_SERVER_ERROR
        ? 'An unexpected error occurred'
        : this.publicMessage(exception);

    response.status(status).json({
      code: this.errorCode(status),
      message,
      requestId,
    });
  }

  private publicMessage(exception: unknown): string {
    if (!(exception instanceof HttpException)) {
      return 'An unexpected error occurred';
    }

    const body = exception.getResponse();
    if (typeof body === 'string') {
      return body;
    }
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const { message } = body;
      return Array.isArray(message) ? message.join('; ') : String(message);
    }
    return exception.message;
  }

  private errorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'VALIDATION_ERROR';
      case HttpStatus.NOT_FOUND:
        return 'RESOURCE_NOT_FOUND';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      default:
        return status >= HttpStatus.INTERNAL_SERVER_ERROR ? 'INTERNAL_ERROR' : 'REQUEST_FAILED';
    }
  }
}
