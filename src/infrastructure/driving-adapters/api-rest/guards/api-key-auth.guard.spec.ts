import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyAuthGuard } from './api-key-auth.guard';
import { IAppConfig } from '@infrastructure/driven-adapters/config/app-config.interface';
import { ILogger } from '@domain/gateways/network-repository.gateway';

describe('ApiKeyAuthGuard', () => {
  let guard: ApiKeyAuthGuard;
  let mockConfig: IAppConfig;
  let mockLogger: jest.Mocked<ILogger>;
  let mockRequest: { headers: Record<string, string> };
  let context: ExecutionContext;

  beforeEach(async () => {
    mockConfig = {
      serverPort: 3000,
      serverCorsOrigin: '*',
      databaseConfig: {} as IAppConfig['databaseConfig'],
      authConfig: {
        apiKey: 'valid-api-key-12345',
      },
      snsConfig: {} as IAppConfig['snsConfig'],
      isProduction: false,
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    mockRequest = {
      headers: {},
    };

    context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyAuthGuard,
        { provide: 'IAppConfig', useValue: mockConfig },
        { provide: 'ILogger', useValue: mockLogger },
      ],
    }).compile();

    guard = module.get<ApiKeyAuthGuard>(ApiKeyAuthGuard);
  });

  describe('canActivate', () => {
    it('should return true when valid API key is provided', () => {
      mockRequest.headers['x-api-key'] = 'valid-api-key-12345';

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when no API key is provided', () => {
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('No API key provided');
    });

    it('should throw UnauthorizedException when API key header is empty string', () => {
      mockRequest.headers['x-api-key'] = '';

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('No API key provided');
    });

    it('should throw UnauthorizedException when invalid API key is provided', () => {
      mockRequest.headers['x-api-key'] = 'invalid-api-key';

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Invalid API key');
    });

    it('should log warning when invalid API key is attempted', () => {
      mockRequest.headers['x-api-key'] = 'invalid-api-key';

      try {
        guard.canActivate(context);
      } catch {
        // Expected to throw
      }

      expect(mockLogger.warn).toHaveBeenCalledWith('Invalid API key attempt', {
        keyPrefix: 'invalid-...',
      });
    });

    it('should handle case-sensitive API key comparison', () => {
      mockRequest.headers['x-api-key'] = 'VALID-API-KEY-12345';

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Invalid API key');
    });

    it('should handle API key with extra whitespace', () => {
      mockRequest.headers['x-api-key'] = ' valid-api-key-12345 ';

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });
  });
});
