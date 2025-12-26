import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import { ILogger } from '@domain/gateways/network-repository.gateway';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService, ILogger {
  private context?: string;
  private correlationId?: string;

  setContext(context: string): void {
    this.context = context;
  }

  setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId;
  }

  private formatMessage(message: string, additionalContext?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const contextPart = this.context ? `[${this.context}]` : '';
    const correlationPart = this.correlationId ? `[${this.correlationId}]` : '';
    const additionalPart = additionalContext ? ` ${JSON.stringify(additionalContext)}` : '';

    return `${timestamp} ${contextPart}${correlationPart} ${message}${additionalPart}`;
  }

  log(message: string, context?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.log(this.formatMessage(message, context));
  }

  info(message: string, context?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.info(this.formatMessage(`INFO: ${message}`, context));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(this.formatMessage(`WARN: ${message}`, context));
  }

  error(message: string, context?: Record<string, unknown>): void {
    console.error(this.formatMessage(`ERROR: ${message}`, context));
  }

  debug(message: string, context?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.debug(this.formatMessage(`DEBUG: ${message}`, context));
  }

  verbose(message: string, context?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.log(this.formatMessage(`VERBOSE: ${message}`, context));
  }

  child(context: { correlationId?: string; context?: string }): ILogger {
    const childLogger = new LoggerService();
    if (context.correlationId) {
      childLogger.setCorrelationId(context.correlationId);
    }
    if (context.context) {
      childLogger.setContext(context.context);
    }
    return childLogger;
  }
}
