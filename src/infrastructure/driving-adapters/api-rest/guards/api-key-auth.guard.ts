import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { Request } from 'express';
import { IAppConfig } from '@infrastructure/driven-adapters/config/app-config.interface';
import { ILogger } from '@domain/gateways/network-repository.gateway';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(
    @Inject('IAppConfig') private readonly configService: IAppConfig,
    @Inject('ILogger') private readonly logger: ILogger,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('No API key provided');
    }

    if (apiKey !== this.configService.authConfig.apiKey) {
      this.logger.warn('Invalid API key attempt', {
        keyPrefix: apiKey.substring(0, 8) + '...',
      });
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
