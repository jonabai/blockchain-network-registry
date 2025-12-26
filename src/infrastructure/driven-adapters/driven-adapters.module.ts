import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module';
import { LoggerModule } from './logger/logger.module';
import { DatabaseModule } from './database/database.module';
import { NetworkRepositoryModule } from './network-repository/network-repository.module';

@Module({
  imports: [AppConfigModule, LoggerModule, DatabaseModule, NetworkRepositoryModule],
  exports: [AppConfigModule, LoggerModule, DatabaseModule, NetworkRepositoryModule],
})
export class DrivenAdaptersModule {}
