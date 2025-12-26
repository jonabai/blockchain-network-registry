import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AppConfigService } from '@infrastructure/driven-adapters/config/app-config.service';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<AppConfigService>;

  const mockJwtConfig = {
    secret: 'test-secret',
    expiresIn: '1h',
  };

  const mockPayload = {
    sub: 'user-123',
    email: 'test@example.com',
    role: 'admin',
  };

  const createMockExecutionContext = (authHeader?: string): ExecutionContext => {
    const mockRequest = {
      headers: {
        authorization: authHeader,
      },
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            jwtConfig: mockJwtConfig,
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get(JwtService);
    configService = module.get(AppConfigService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true and set user on request when valid token is provided', async () => {
      const mockRequest: Record<string, unknown> = {
        headers: { authorization: 'Bearer valid-token' },
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
        secret: mockJwtConfig.secret,
      });
      expect(mockRequest['user']).toEqual({
        id: mockPayload.sub,
        email: mockPayload.email,
        role: mockPayload.role,
      });
    });

    it('should throw UnauthorizedException when no token is provided', async () => {
      const context = createMockExecutionContext(undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('No authentication token provided');
    });

    it('should throw UnauthorizedException when authorization header has wrong format', async () => {
      const context = createMockExecutionContext('Basic invalid-token');

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('No authentication token provided');
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      const context = createMockExecutionContext('Bearer invalid-token');
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Invalid or expired authentication token');
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      const context = createMockExecutionContext('Bearer expired-token');
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Invalid or expired authentication token');
    });

    it('should handle token without Bearer prefix', async () => {
      const context = createMockExecutionContext('just-a-token');

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle empty authorization header', async () => {
      const context = createMockExecutionContext('');

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });
  });
});
