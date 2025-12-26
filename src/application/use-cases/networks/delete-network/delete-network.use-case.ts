import { Injectable } from '@nestjs/common';
import { NetworkRepository } from '@domain/gateways/network-repository.gateway';
import { AuthenticatedRequestContext } from '../../../../request-context.interface';
import { NotFoundError } from '@shared/errors/domain.errors';

export interface DeleteNetworkContext extends AuthenticatedRequestContext {
  networkId: string;
}

@Injectable()
export class DeleteNetworkUseCase {
  constructor(private readonly networkRepository: NetworkRepository) {}

  async execute(context: DeleteNetworkContext): Promise<void> {
    const { networkId, logger } = context;

    logger.info('Executing DeleteNetworkUseCase (soft delete)', { networkId });

    const deleted = await this.networkRepository.softDelete(networkId, { logger });

    if (!deleted) {
      logger.warn('Network not found for deletion', { networkId });
      throw new NotFoundError('Network', networkId);
    }

    logger.info('Network soft deleted successfully', { networkId });
  }
}
