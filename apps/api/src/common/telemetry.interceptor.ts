import { Injectable } from '@nestjs/common';
import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { finalize } from 'rxjs';
import type { Observable } from 'rxjs';
import { httpRequestCount, httpRequestDuration } from './telemetry';

@Injectable()
export class TelemetryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const start = performance.now();

    return next.handle().pipe(
      finalize(() => {
        const route = request.route?.path;
        const attributes = {
          'http.request.method': request.method,
          'http.route': typeof route === 'string' ? route : 'unmatched',
          'http.response.status_code': response.statusCode,
        };
        httpRequestCount.add(1, attributes);
        httpRequestDuration.record((performance.now() - start) / 1000, attributes);
      }),
    );
  }
}
