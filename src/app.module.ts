import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { DrivenAdaptersModule } from '@infrastructure/driven-adapters/driven-adapters.module';
import { DrivingAdaptersModule } from '@infrastructure/driving-adapters/driving-adapters.module';
import { UseCasesModule } from '@application/use-cases/use-cases.module';
import { GlobalExceptionFilter } from '@infrastructure/driving-adapters/api-rest/filters/global-exception.filter';

@Module({
  imports: [DrivenAdaptersModule, DrivingAdaptersModule, UseCasesModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
