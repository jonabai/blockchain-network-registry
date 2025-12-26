import { Network, CreateNetworkData, UpdateNetworkData } from '../models/network.model';

export interface ILogger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
}

export interface RepositoryOptions {
  logger: ILogger;
}

export abstract class NetworkRepository {
  abstract findById(id: string, options: RepositoryOptions): Promise<Network | null>;

  abstract findByChainId(chainId: number, options: RepositoryOptions): Promise<Network | null>;

  abstract findAllActive(options: RepositoryOptions): Promise<Network[]>;

  abstract create(data: CreateNetworkData, options: RepositoryOptions): Promise<Network>;

  abstract update(id: string, data: UpdateNetworkData, options: RepositoryOptions): Promise<Network | null>;

  abstract softDelete(id: string, options: RepositoryOptions): Promise<boolean>;

  abstract existsByChainId(chainId: number, excludeId?: string, options?: RepositoryOptions): Promise<boolean>;
}
