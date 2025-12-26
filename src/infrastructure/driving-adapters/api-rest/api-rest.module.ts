import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UseCasesModule } from '@application/use-cases/use-cases.module';
import { NetworksController } from './controllers/networks/networks.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AppConfigService } from '@infrastructure/driven-adapters/config/app-config.service';

@Module({
  imports: [
    UseCasesModule,
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        secret: configService.jwtConfig.secret,
        signOptions: {
          expiresIn: configService.jwtConfig.expiresIn,
        },
      }),
    }),
  ],
  controllers: [NetworksController],
  providers: [JwtAuthGuard],
})
export class ApiRestModule {}
