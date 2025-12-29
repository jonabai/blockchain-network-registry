import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfigService } from '@infrastructure/driven-adapters/config/app-config.service';

function parseCorsOrigin(origin: string | string[]): string | string[] | boolean {
  if (Array.isArray(origin)) {
    return origin;
  }

  if (origin === 'true') {
    return true;
  }

  if (origin === 'false') {
    return false;
  }

  // Support comma-separated origins from environment variable
  if (origin.includes(',')) {
    return origin.split(',').map((o) => o.trim());
  }

  return origin;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(AppConfigService);

  const corsOrigin = parseCorsOrigin(configService.serverCorsOrigin);

  // Security: Prevent wildcard origin with credentials (allows CSRF attacks)
  if (corsOrigin === '*') {
    throw new Error('CORS origin "*" is not allowed with credentials. Set CORS_ORIGIN to specific origins.');
  }

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Network Registry API')
    .setDescription('Blockchain Network Registry API - Manage blockchain network configurations')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  const port = configService.serverPort;
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`Application is running on: http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`Swagger documentation: http://localhost:${port}/api-docs`);
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start application:', error);
  process.exit(1);
});
