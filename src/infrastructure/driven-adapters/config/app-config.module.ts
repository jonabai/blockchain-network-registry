import { Global, Module } from '@nestjs/common';
import { AppConfigService } from './app-config.service';

@Global()
@Module({
  providers: [
    AppConfigService,
    {
      provide: 'IAppConfig',
      useExisting: AppConfigService,
    },
  ],
  exports: [AppConfigService, 'IAppConfig'],
})
export class AppConfigModule {}
