import { Module } from '@nestjs/common';
import { NetworkEventPublisher } from '@domain/gateways/network-event-publisher.gateway';
import { SnsNetworkEventPublisher } from './sns/sns-network-event-publisher';

@Module({
  providers: [
    SnsNetworkEventPublisher,
    {
      provide: NetworkEventPublisher,
      useExisting: SnsNetworkEventPublisher,
    },
  ],
  exports: [NetworkEventPublisher, SnsNetworkEventPublisher],
})
export class NetworkEventPublisherModule {}
