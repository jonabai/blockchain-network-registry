import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '@infrastructure/driven-adapters/logger/logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly loggerService: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
    req['correlationId'] = correlationId;

    const logger = new LoggerService();
    logger.setCorrelationId(correlationId);
    logger.setContext('HTTP');
    req['logger'] = logger;

    res.setHeader('x-correlation-id', correlationId);

    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode}`, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      });
    });

    next();
  }
}
