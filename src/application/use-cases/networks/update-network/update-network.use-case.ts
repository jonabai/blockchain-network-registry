import { Injectable } from '@nestjs/common';
import { NetworkRepository } from '@domain/gateways/network-repository.gateway';
import { Network, UpdateNetworkData } from '@domain/models/network.model';
import { AuthenticatedRequestContext } from '../../../../request-context.interface';
import { NotFoundError, ConflictError } from '@shared/errors/domain.errors';

export interface UpdateNetworkContext extends AuthenticatedRequestContext {
  networkId: string;
  data: Required<Omit<UpdateNetworkData, 'active'>>;
}

@Injectable()
export class UpdateNetworkUseCase {
  constructor(private readonly networkRepository: NetworkRepository) {}

  async execute(context: UpdateNetworkContext): Promise<Network> {
    const { networkId, data, logger } = context;

    logger.info('Executing UpdateNetworkUseCase', { networkId });

    const existingNetwork = await this.networkRepository.findById(networkId, { logger });

    if (!existingNetwork) {
      logger.warn('Network not found for update', { networkId });
      throw new NotFoundError('Network', networkId);
    }

    if (data.chainId !== existingNetwork.chainId) {
      const chainIdExists = await this.networkRepository.existsByChainId(data.chainId, networkId, { logger });

      if (chainIdExists) {
        logger.warn('Cannot update: chainId already in use by another network', { chainId: data.chainId });
        throw new ConflictError(`Network with chainId ${data.chainId} already exists`);
      }
    }

    const updatedNetwork = await this.networkRepository.update(networkId, data, { logger });

    if (!updatedNetwork) {
      throw new NotFoundError('Network', networkId);
    }

    logger.info('Network updated successfully', { networkId });

    return updatedNetwork;
  }
}
