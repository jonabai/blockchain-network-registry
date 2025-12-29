import { NetworkEvent } from '../models/network-event.model';
import { ILogger } from './network-repository.gateway';

export interface EventPublisherOptions {
  logger: ILogger;
}

export abstract class NetworkEventPublisher {
  abstract publish(event: NetworkEvent, options: EventPublisherOptions): Promise<void>;
}
