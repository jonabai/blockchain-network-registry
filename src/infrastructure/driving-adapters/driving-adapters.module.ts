import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ApiRestModule } from './api-rest/api-rest.module';
import { LoggerMiddleware } from './api-rest/middleware/logger.middleware';

@Module({
  imports: [ApiRestModule],
  exports: [ApiRestModule],
})
export class DrivingAdaptersModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
