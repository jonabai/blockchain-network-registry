import { Module } from '@nestjs/common';
import { NetworkRepository } from '@domain/gateways/network-repository.gateway';
import { PostgresNetworkRepository } from './postgres/postgres-network.repository';

@Module({
  providers: [
    PostgresNetworkRepository,
    {
      provide: NetworkRepository,
      useExisting: PostgresNetworkRepository,
    },
  ],
  exports: [NetworkRepository, PostgresNetworkRepository],
})
export class NetworkRepositoryModule {}
