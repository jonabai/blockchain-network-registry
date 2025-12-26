import { Injectable } from '@nestjs/common';
import { NetworkRepository } from '@domain/gateways/network-repository.gateway';
import { Network } from '@domain/models/network.model';
import { AuthenticatedRequestContext } from '../../../../request-context.interface';
import { NotFoundError } from '@shared/errors/domain.errors';

export interface GetNetworkByIdContext extends AuthenticatedRequestContext {
  networkId: string;
}

@Injectable()
export class GetNetworkByIdUseCase {
  constructor(private readonly networkRepository: NetworkRepository) {}

  async execute(context: GetNetworkByIdContext): Promise<Network> {
    const { networkId, logger } = context;

    logger.info('Executing GetNetworkByIdUseCase', { networkId });

    const network = await this.networkRepository.findById(networkId, { logger });

    if (!network) {
      logger.warn('Network not found', { networkId });
      throw new NotFoundError('Network', networkId);
    }

    logger.info('Network retrieved successfully', { networkId });

    return network;
  }
}
