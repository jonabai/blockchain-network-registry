import { Injectable } from '@nestjs/common';
import { NetworkRepository } from '@domain/gateways/network-repository.gateway';
import { Network } from '@domain/models/network.model';
import { AuthenticatedRequestContext } from '../../../../request-context.interface';

export type GetActiveNetworksContext = AuthenticatedRequestContext;

@Injectable()
export class GetActiveNetworksUseCase {
  constructor(private readonly networkRepository: NetworkRepository) {}

  async execute(context: GetActiveNetworksContext): Promise<Network[]> {
    const { logger } = context;

    logger.info('Executing GetActiveNetworksUseCase');

    const networks = await this.networkRepository.findAllActive({ logger });

    logger.info('Active networks retrieved successfully', { count: networks.length });

    return networks;
  }
}
