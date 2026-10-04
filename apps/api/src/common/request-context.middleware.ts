import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export class RequestContextMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    void request;
    const requestId = randomUUID();
    response.setHeader('x-request-id', requestId);
    response.locals.requestId = requestId;
    next();
  }
}
