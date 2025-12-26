import { ILogger } from '@domain/gateways/network-repository.gateway';
import { Account } from '../request-context.interface';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      logger?: ILogger;
      user?: Account;
    }
  }
}
