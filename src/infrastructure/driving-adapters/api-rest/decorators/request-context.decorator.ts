import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequestContext } from '../../../../request-context.interface';

export const RequestContext = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedRequestContext => {
  const request = ctx.switchToHttp().getRequest();
  return {
    correlationId: request.correlationId || request.headers['x-correlation-id'] || 'unknown',
    logger: request.logger,
    account: request.user,
  };
});
