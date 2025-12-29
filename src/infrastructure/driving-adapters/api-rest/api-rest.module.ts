import { Module } from '@nestjs/common';
import { UseCasesModule } from '@application/use-cases/use-cases.module';
import { NetworksController } from './controllers/networks/networks.controller';
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard';

@Module({
  imports: [UseCasesModule],
  controllers: [NetworksController],
  providers: [ApiKeyAuthGuard],
})
export class ApiRestModule {}
