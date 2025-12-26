import { JwtService } from '@nestjs/jwt';

export function generateTestToken(jwtService: JwtService, payload?: Record<string, unknown>): string {
  return jwtService.sign({
    sub: 'test-user-id',
    email: 'test@example.com',
    role: 'admin',
    ...payload,
  });
}

interface MockLogger {
  info: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
  debug: jest.Mock;
}

export function createMockLogger(): MockLogger {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
}
