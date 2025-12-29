import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { BaseRequestContext } from '../../../../request-context.interface';

export const RequestContext = createParamDecorator((_data: unknown, ctx: ExecutionContext): BaseRequestContext => {
  const request = ctx.switchToHttp().getRequest();
  return {
    correlationId: request.correlationId || request.headers['x-correlation-id'] || 'unknown',
    logger: request.logger,
  };
});
