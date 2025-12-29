import { Injectable } from '@nestjs/common';
import { NetworkRepository, RepositoryOptions } from '@domain/gateways/network-repository.gateway';
import { Network, CreateNetworkData, UpdateNetworkData } from '@domain/models/network.model';
import { DatabaseService } from '../../database/database.service';
import { ConflictError } from '@shared/errors/domain.errors';
import { v4 as uuidv4 } from 'uuid';

const POSTGRES_UNIQUE_VIOLATION = '23505';

interface NetworkRow {
  id: string;
  chain_id: number;
  name: string;
  rpc_url: string;
  other_rpc_urls: string | null;
  test_net: boolean;
  block_explorer_url: string;
  fee_multiplier: string;
  gas_limit_multiplier: string;
  active: boolean;
  default_signer_address: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class PostgresNetworkRepository extends NetworkRepository {
  private readonly tableName = 'networks';

  constructor(private readonly databaseService: DatabaseService) {
    super();
  }

  private getKnex(): ReturnType<DatabaseService['getKnex']> {
    return this.databaseService.getKnex();
  }

  private parseOtherRpcUrls(value: string | null): string[] {
    if (!value) {
      return [];
    }
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private mapToDomain(row: NetworkRow): Network {
    return {
      id: row.id,
      chainId: row.chain_id,
      name: row.name,
      rpcUrl: row.rpc_url,
      otherRpcUrls: this.parseOtherRpcUrls(row.other_rpc_urls),
      testNet: row.test_net,
      blockExplorerUrl: row.block_explorer_url,
      feeMultiplier: parseFloat(row.fee_multiplier),
      gasLimitMultiplier: parseFloat(row.gas_limit_multiplier),
      active: row.active,
      defaultSignerAddress: row.default_signer_address,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapToDatabase(data: CreateNetworkData | UpdateNetworkData): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if ('chainId' in data && data.chainId !== undefined) {
      row.chain_id = data.chainId;
    }
    if ('name' in data && data.name !== undefined) {
      row.name = data.name;
    }
    if ('rpcUrl' in data && data.rpcUrl !== undefined) {
      row.rpc_url = data.rpcUrl;
    }
    if ('otherRpcUrls' in data && data.otherRpcUrls !== undefined) {
      row.other_rpc_urls = JSON.stringify(data.otherRpcUrls);
    }
    if ('testNet' in data && data.testNet !== undefined) {
      row.test_net = data.testNet;
    }
    if ('blockExplorerUrl' in data && data.blockExplorerUrl !== undefined) {
      row.block_explorer_url = data.blockExplorerUrl;
    }
    if ('feeMultiplier' in data && data.feeMultiplier !== undefined) {
      row.fee_multiplier = data.feeMultiplier;
    }
    if ('gasLimitMultiplier' in data && data.gasLimitMultiplier !== undefined) {
      row.gas_limit_multiplier = data.gasLimitMultiplier;
    }
    if ('active' in data && data.active !== undefined) {
      row.active = data.active;
    }
    if ('defaultSignerAddress' in data && data.defaultSignerAddress !== undefined) {
      row.default_signer_address = data.defaultSignerAddress;
    }

    return row;
  }

  async findById(id: string, options: RepositoryOptions): Promise<Network | null> {
    const { logger } = options;
    logger.info('Finding network by id', { id });

    try {
      const row = await this.getKnex()<NetworkRow>(this.tableName).where({ id }).first();

      if (!row) {
        logger.info('Network not found', { id });
        return null;
      }

      logger.info('Network found', { id });
      return this.mapToDomain(row);
    } catch (error) {
      logger.error('Error finding network by id', { id, error: String(error) });
      throw error;
    }
  }

  async findByChainId(chainId: number, options: RepositoryOptions): Promise<Network | null> {
    const { logger } = options;
    logger.info('Finding network by chainId', { chainId });

    try {
      const row = await this.getKnex()<NetworkRow>(this.tableName).where({ chain_id: chainId }).first();

      if (!row) {
        logger.info('Network not found by chainId', { chainId });
        return null;
      }

      logger.info('Network found by chainId', { chainId });
      return this.mapToDomain(row);
    } catch (error) {
      logger.error('Error finding network by chainId', { chainId, error: String(error) });
      throw error;
    }
  }

  async findAllActive(options: RepositoryOptions): Promise<Network[]> {
    const { logger } = options;
    logger.info('Finding all active networks');

    try {
      const rows = await this.getKnex()<NetworkRow>(this.tableName).where({ active: true }).orderBy('name', 'asc');

      logger.info('Found active networks', { count: rows.length });
      return rows.map((row) => this.mapToDomain(row));
    } catch (error) {
      logger.error('Error finding active networks', { error: String(error) });
      throw error;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === POSTGRES_UNIQUE_VIOLATION;
  }

  async create(data: CreateNetworkData, options: RepositoryOptions): Promise<Network> {
    const { logger } = options;
    logger.info('Creating network', { chainId: data.chainId, name: data.name });

    try {
      const id = uuidv4();
      const now = new Date();
      const row = {
        id,
        ...this.mapToDatabase(data),
        created_at: now,
        updated_at: now,
      };

      await this.getKnex()(this.tableName).insert(row);

      const created = await this.findById(id, options);
      if (!created) {
        throw new Error('Failed to retrieve created network');
      }

      logger.info('Network created successfully', { id, chainId: data.chainId });
      return created;
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        logger.warn('Unique constraint violation during network creation', { chainId: data.chainId });
        throw new ConflictError(`Network with chainId ${data.chainId} already exists`);
      }
      logger.error('Error creating network', { chainId: data.chainId, error: String(error) });
      throw error;
    }
  }

  async update(id: string, data: UpdateNetworkData, options: RepositoryOptions): Promise<Network | null> {
    const { logger } = options;
    logger.info('Updating network', { id });

    try {
      const existing = await this.findById(id, options);
      if (!existing) {
        logger.info('Network not found for update', { id });
        return null;
      }

      const row = {
        ...this.mapToDatabase(data),
        updated_at: new Date(),
      };

      await this.getKnex()(this.tableName).where({ id }).update(row);

      const updated = await this.findById(id, options);
      logger.info('Network updated successfully', { id });
      return updated;
    } catch (error) {
      if (this.isUniqueViolation(error) && 'chainId' in data) {
        logger.warn('Unique constraint violation during network update', { id, chainId: data.chainId });
        throw new ConflictError(`Network with chainId ${data.chainId} already exists`);
      }
      logger.error('Error updating network', { id, error: String(error) });
      throw error;
    }
  }

  async softDelete(id: string, options: RepositoryOptions): Promise<boolean> {
    const { logger } = options;
    logger.info('Soft deleting network', { id });

    try {
      const existing = await this.findById(id, options);
      if (!existing) {
        logger.info('Network not found for soft delete', { id });
        return false;
      }

      await this.getKnex()(this.tableName).where({ id }).update({
        active: false,
        updated_at: new Date(),
      });

      logger.info('Network soft deleted successfully', { id });
      return true;
    } catch (error) {
      logger.error('Error soft deleting network', { id, error: String(error) });
      throw error;
    }
  }

  async existsByChainId(chainId: number, excludeId?: string, options?: RepositoryOptions): Promise<boolean> {
    options?.logger?.info('Checking if network exists by chainId', { chainId, excludeId });

    try {
      let query = this.getKnex()(this.tableName).where({ chain_id: chainId });

      if (excludeId) {
        query = query.whereNot({ id: excludeId });
      }

      const row = await query.first();
      const exists = !!row;

      options?.logger?.info('Network exists check result', { chainId, exists });
      return exists;
    } catch (error) {
      options?.logger?.error('Error checking network existence', { chainId, error: String(error) });
      throw error;
    }
  }
}
