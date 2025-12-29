import { Injectable } from '@nestjs/common';
import { NetworkRepository } from '@domain/gateways/network-repository.gateway';
import { NetworkEventPublisher } from '@domain/gateways/network-event-publisher.gateway';
import { NetworkEventType, networkToEventData } from '@domain/models/network-event.model';
import { AuthenticatedRequestContext } from '../../../../request-context.interface';
import { NotFoundError } from '@shared/errors/domain.errors';

export interface DeleteNetworkContext extends AuthenticatedRequestContext {
  networkId: string;
}

@Injectable()
export class DeleteNetworkUseCase {
  constructor(
    private readonly networkRepository: NetworkRepository,
    private readonly networkEventPublisher: NetworkEventPublisher,
  ) {}

  async execute(context: DeleteNetworkContext): Promise<void> {
    const { networkId, logger, correlationId } = context;

    logger.info('Executing DeleteNetworkUseCase (soft delete)', { networkId });

    const network = await this.networkRepository.findById(networkId, { logger });

    if (!network) {
      logger.warn('Network not found for deletion', { networkId });
      throw new NotFoundError('Network', networkId);
    }

    const deleted = await this.networkRepository.softDelete(networkId, { logger });

    if (!deleted) {
      logger.warn('Network not found for deletion', { networkId });
      throw new NotFoundError('Network', networkId);
    }

    logger.info('Network soft deleted successfully', { networkId });

    try {
      await this.networkEventPublisher.publish(
        {
          eventType: NetworkEventType.NETWORK_DELETED,
          timestamp: new Date().toISOString(),
          correlationId,
          data: networkToEventData({ ...network, active: false }),
        },
        { logger },
      );
    } catch (error) {
      logger.error('Failed to publish network deleted event', {
        networkId: network.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
