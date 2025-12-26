import { Module } from '@nestjs/common';
import { DrivenAdaptersModule } from '@infrastructure/driven-adapters/driven-adapters.module';
import { CreateNetworkUseCase } from './networks/create-network/create-network.use-case';
import { GetNetworkByIdUseCase } from './networks/get-network-by-id/get-network-by-id.use-case';
import { GetActiveNetworksUseCase } from './networks/get-active-networks/get-active-networks.use-case';
import { UpdateNetworkUseCase } from './networks/update-network/update-network.use-case';
import { PartialUpdateNetworkUseCase } from './networks/partial-update-network/partial-update-network.use-case';
import { DeleteNetworkUseCase } from './networks/delete-network/delete-network.use-case';

@Module({
  imports: [DrivenAdaptersModule],
  providers: [
    CreateNetworkUseCase,
    GetNetworkByIdUseCase,
    GetActiveNetworksUseCase,
    UpdateNetworkUseCase,
    PartialUpdateNetworkUseCase,
    DeleteNetworkUseCase,
  ],
  exports: [
    CreateNetworkUseCase,
    GetNetworkByIdUseCase,
    GetActiveNetworksUseCase,
    UpdateNetworkUseCase,
    PartialUpdateNetworkUseCase,
    DeleteNetworkUseCase,
  ],
})
export class UseCasesModule {}
