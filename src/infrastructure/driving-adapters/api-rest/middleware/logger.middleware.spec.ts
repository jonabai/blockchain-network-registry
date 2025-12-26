import { LoggerMiddleware } from './logger.middleware';
import { LoggerService } from '@infrastructure/driven-adapters/logger/logger.service';
import { Request, Response, NextFunction } from 'express';

describe('LoggerMiddleware', () => {
  let middleware: LoggerMiddleware;
  let mockLoggerService: jest.Mocked<LoggerService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let finishCallback: (() => void) | undefined;

  beforeEach(() => {
    mockLoggerService = {
      setCorrelationId: jest.fn(),
      setContext: jest.fn(),
      info: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    mockRequest = {
      headers: {},
      method: 'GET',
      originalUrl: '/networks',
    };

    finishCallback = undefined;
    mockResponse = {
      setHeader: jest.fn(),
      statusCode: 200,
      on: jest.fn((event: string, callback: () => void) => {
        if (event === 'finish') {
          finishCallback = callback;
        }
        return mockResponse as Response;
      }),
    };

    mockNext = jest.fn();

    middleware = new LoggerMiddleware(mockLoggerService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('use', () => {
    it('should set correlationId from header when provided', () => {
      mockRequest.headers = { 'x-correlation-id': 'provided-correlation-id' };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest['correlationId']).toBe('provided-correlation-id');
    });

    it('should generate correlationId when not in header', () => {
      mockRequest.headers = {};

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest['correlationId']).toBeDefined();
      expect(mockRequest['correlationId']).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should set logger on request', () => {
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest['logger']).toBeDefined();
    });

    it('should set x-correlation-id response header', () => {
      mockRequest.headers = { 'x-correlation-id': 'test-correlation-id' };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-correlation-id', 'test-correlation-id');
    });

    it('should call next function', () => {
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should log request on response finish', () => {
      const infoSpy = jest.spyOn(LoggerService.prototype, 'info').mockImplementation();

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.on).toHaveBeenCalledWith('finish', expect.any(Function));

      if (finishCallback) {
        finishCallback();
      }

      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('GET /networks 200'),
        expect.objectContaining({
          method: 'GET',
          url: '/networks',
          statusCode: 200,
        }),
      );

      infoSpy.mockRestore();
    });

    it('should include duration in log', () => {
      const infoSpy = jest.spyOn(LoggerService.prototype, 'info').mockImplementation();

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      if (finishCallback) {
        finishCallback();
      }

      expect(infoSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          duration: expect.stringMatching(/^\d+ms$/),
        }),
      );

      infoSpy.mockRestore();
    });

    it('should handle different HTTP methods', () => {
      const infoSpy = jest.spyOn(LoggerService.prototype, 'info').mockImplementation();
      mockRequest.method = 'POST';
      mockRequest.originalUrl = '/networks/create';

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      if (finishCallback) {
        finishCallback();
      }

      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('POST /networks/create'),
        expect.objectContaining({
          method: 'POST',
          url: '/networks/create',
        }),
      );

      infoSpy.mockRestore();
    });

    it('should handle different status codes', () => {
      const infoSpy = jest.spyOn(LoggerService.prototype, 'info').mockImplementation();
      mockResponse.statusCode = 404;

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      if (finishCallback) {
        finishCallback();
      }

      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('404'),
        expect.objectContaining({
          statusCode: 404,
        }),
      );

      infoSpy.mockRestore();
    });
  });
});
