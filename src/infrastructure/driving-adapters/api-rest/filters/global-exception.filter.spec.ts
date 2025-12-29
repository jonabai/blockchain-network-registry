import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import { NotFoundError, ConflictError, UnauthorizedError } from '@shared/errors/domain.errors';
import { ValidationError } from '@shared/errors/validation.error';
import { AppConfigService } from '@infrastructure/driven-adapters/config/app-config.service';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockLogger: {
    info: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
    debug: jest.Mock;
  };
  let mockConfigService: Partial<AppConfigService>;
  let mockResponse: {
    status: jest.Mock;
    json: jest.Mock;
  };
  let mockRequest: {
    headers: Record<string, string>;
    method: string;
    path: string;
  };

  const createMockArgumentsHost = (): ArgumentsHost => {
    return {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as ArgumentsHost;
  };

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    mockConfigService = {
      isProduction: false,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = {
      headers: { 'x-correlation-id': 'test-correlation-id' },
      method: 'GET',
      path: '/networks',
    };

    filter = new GlobalExceptionFilter(mockLogger, mockConfigService as AppConfigService);
  });

  describe('catch', () => {
    it('should handle NotFoundError', () => {
      const exception = new NotFoundError('Network', 'network-123');
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: {
            code: 'NOT_FOUND',
            message: "Network with identifier 'network-123' not found",
          },
          requestId: 'test-correlation-id',
        }),
      );
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle ConflictError', () => {
      const exception = new ConflictError('Network with chainId 1 already exists');
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: {
            code: 'CONFLICT',
            message: 'Network with chainId 1 already exists',
          },
        }),
      );
    });

    it('should handle UnauthorizedError', () => {
      const exception = new UnauthorizedError('Invalid token');
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid token',
          },
        }),
      );
    });

    it('should handle ValidationError with details', () => {
      const exception = new ValidationError('Validation failed', [
        { field: 'chainId', message: 'chainId must be positive' },
        { field: 'name', message: 'name is required' },
      ]);
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: [
              { field: 'chainId', message: 'chainId must be positive' },
              { field: 'name', message: 'name is required' },
            ],
          },
        }),
      );
    });

    it('should handle HttpException', () => {
      const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: {
            code: 'BAD_REQUEST',
            message: 'Bad Request',
          },
        }),
      );
    });

    it('should handle HttpException with object response', () => {
      const exception = new HttpException(
        { message: ['field1 is invalid', 'field2 is required'], error: 'Bad Request' },
        HttpStatus.BAD_REQUEST,
      );
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'BAD_REQUEST',
            message: 'Validation failed',
          }),
        }),
      );
    });

    it('should handle unknown errors as 500 Internal Server Error', () => {
      const exception = new Error('Something went wrong');
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
          },
        }),
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle non-Error exceptions', () => {
      const exception = 'string exception';
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
          },
        }),
      );
    });

    it('should use unknown as correlationId when header is missing', () => {
      mockRequest.headers = {};
      const exception = new NotFoundError('Network', 'network-123');
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'unknown',
        }),
      );
    });

    it('should include timestamp in response', () => {
      const exception = new NotFoundError('Network', 'network-123');
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String),
        }),
      );
    });

    it('should log warning for 4xx errors', () => {
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should log error for 5xx errors', () => {
      const exception = new Error('Database connection failed');
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should include stack trace in error log when not in production', () => {
      const devConfigService = { isProduction: false } as AppConfigService;
      const devFilter = new GlobalExceptionFilter(mockLogger, devConfigService);

      const exception = new Error('Database connection failed');
      const host = createMockArgumentsHost();

      devFilter.catch(exception, host);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unhandled exception',
        expect.objectContaining({
          error: expect.objectContaining({
            name: 'Error',
            message: 'Database connection failed',
            stack: expect.any(String),
          }),
        }),
      );
    });

    it('should NOT include stack trace in error log when in production', () => {
      const prodConfigService = { isProduction: true } as AppConfigService;
      const prodFilter = new GlobalExceptionFilter(mockLogger, prodConfigService);

      const exception = new Error('Database connection failed');
      const host = createMockArgumentsHost();

      prodFilter.catch(exception, host);

      const errorCall = mockLogger.error.mock.calls[0];
      const loggedError = errorCall[1].error;

      expect(loggedError).toEqual({
        name: 'Error',
        message: 'Database connection failed',
      });
      expect(loggedError.stack).toBeUndefined();
    });

    it('should handle non-Error exceptions in production', () => {
      const prodConfigService = { isProduction: true } as AppConfigService;
      const prodFilter = new GlobalExceptionFilter(mockLogger, prodConfigService);

      const exception = 'string exception';
      const host = createMockArgumentsHost();

      prodFilter.catch(exception, host);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unhandled exception',
        expect.objectContaining({
          error: { message: 'string exception' },
        }),
      );
    });
  });
});
