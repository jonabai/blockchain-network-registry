import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

@Global()
@Module({
  providers: [
    LoggerService,
    {
      provide: 'ILogger',
      useClass: LoggerService,
    },
  ],
  exports: [LoggerService, 'ILogger'],
})
export class LoggerModule {}
