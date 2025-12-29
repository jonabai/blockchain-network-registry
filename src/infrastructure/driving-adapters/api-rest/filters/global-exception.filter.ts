import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError } from '@shared/errors/domain.errors';
import { ValidationError } from '@shared/errors/validation.error';
import { ILogger } from '@domain/gateways/network-repository.gateway';
import { AppConfigService } from '@infrastructure/driven-adapters/config/app-config.service';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
  timestamp: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject('ILogger') private readonly logger: ILogger,
    private readonly configService: AppConfigService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId = (request.headers['x-correlation-id'] as string) || 'unknown';
    const errorResponse = this.buildErrorResponse(exception, correlationId);

    this.logError(exception, request, errorResponse.statusCode);

    response.status(errorResponse.statusCode).json(errorResponse.body);
  }

  private buildErrorResponse(
    exception: unknown,
    correlationId: string,
  ): { statusCode: number; body: ErrorResponse } {
    const timestamp = new Date().toISOString();

    if (exception instanceof ValidationError) {
      return {
        statusCode: exception.httpStatus,
        body: {
          error: {
            code: exception.code,
            message: exception.message,
            details: exception.errors,
          },
          requestId: correlationId,
          timestamp,
        },
      };
    }

    if (exception instanceof DomainError) {
      return {
        statusCode: exception.httpStatus,
        body: {
          error: {
            code: exception.code,
            message: exception.message,
          },
          requestId: correlationId,
          timestamp,
        },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let message: string;
      let details: unknown;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string) || exception.message;
        details = resp.errors || resp.message;
        if (Array.isArray(details) && details.length > 0) {
          message = 'Validation failed';
        }
      } else {
        message = exception.message;
      }

      return {
        statusCode: status,
        body: {
          error: {
            code: this.getHttpErrorCode(status),
            message,
            details: details !== message ? details : undefined,
          },
          requestId: correlationId,
          timestamp,
        },
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        requestId: correlationId,
        timestamp,
      },
    };
  }

  private getHttpErrorCode(status: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      500: 'INTERNAL_ERROR',
    };
    return codes[status] || 'ERROR';
  }

  private formatErrorForLogging(exception: unknown): Record<string, unknown> {
    if (!(exception instanceof Error)) {
      return { message: String(exception) };
    }

    const errorInfo: Record<string, unknown> = {
      name: exception.name,
      message: exception.message,
    };

    // Only include stack traces in non-production environments
    if (!this.configService.isProduction) {
      errorInfo.stack = exception.stack;
    }

    return errorInfo;
  }

  private logError(exception: unknown, request: Request, statusCode: number): void {
    const logContext = {
      requestId: request.headers['x-correlation-id'],
      method: request.method,
      path: request.path,
      statusCode,
    };

    if (statusCode >= 500) {
      this.logger.error('Unhandled exception', {
        ...logContext,
        error: this.formatErrorForLogging(exception),
      });
    } else if (statusCode >= 400) {
      this.logger.warn('Client error', {
        ...logContext,
        error: exception instanceof Error ? exception.message : String(exception),
      });
    }
  }
}
