import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module';
import { LoggerModule } from './logger/logger.module';
import { DatabaseModule } from './database/database.module';
import { NetworkRepositoryModule } from './network-repository/network-repository.module';
import { NetworkEventPublisherModule } from './network-event-publisher/network-event-publisher.module';

@Module({
  imports: [AppConfigModule, LoggerModule, DatabaseModule, NetworkRepositoryModule, NetworkEventPublisherModule],
  exports: [AppConfigModule, LoggerModule, DatabaseModule, NetworkRepositoryModule, NetworkEventPublisherModule],
})
export class DrivenAdaptersModule {}
