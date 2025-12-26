import { Injectable } from '@nestjs/common';
import { NetworkRepository } from '@domain/gateways/network-repository.gateway';
import { Network, CreateNetworkData } from '@domain/models/network.model';
import { AuthenticatedRequestContext } from '../../../../request-context.interface';
import { ConflictError } from '@shared/errors/domain.errors';

export interface CreateNetworkContext extends AuthenticatedRequestContext {
  data: CreateNetworkData;
}

@Injectable()
export class CreateNetworkUseCase {
  constructor(private readonly networkRepository: NetworkRepository) {}

  async execute(context: CreateNetworkContext): Promise<Network> {
    const { data, logger } = context;

    logger.info('Executing CreateNetworkUseCase', { chainId: data.chainId, name: data.name });

    const existingNetwork = await this.networkRepository.existsByChainId(data.chainId, undefined, { logger });

    if (existingNetwork) {
      logger.warn('Network with chainId already exists', { chainId: data.chainId });
      throw new ConflictError(`Network with chainId ${data.chainId} already exists`);
    }

    const network = await this.networkRepository.create(data, { logger });

    logger.info('Network created successfully', { id: network.id, chainId: network.chainId });

    return network;
  }
}
