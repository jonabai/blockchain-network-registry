import { ILogger } from './domain/gateways/network-repository.gateway';

export interface BaseRequestContext {
  correlationId: string;
  logger: ILogger;
}

export interface Account {
  id: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequestContext extends BaseRequestContext {
  account?: Account;
}
