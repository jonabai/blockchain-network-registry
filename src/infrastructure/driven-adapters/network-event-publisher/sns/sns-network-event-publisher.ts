import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { NetworkEventPublisher, EventPublisherOptions } from '@domain/gateways/network-event-publisher.gateway';
import { NetworkEvent } from '@domain/models/network-event.model';
import { IAppConfig } from '../../config/app-config.interface';
import { ILogger } from '@domain/gateways/network-repository.gateway';

@Injectable()
export class SnsNetworkEventPublisher extends NetworkEventPublisher implements OnModuleInit, OnModuleDestroy {
  private snsClient!: SNSClient;
  private topicArn: string;
  private isEnabled: boolean;

  constructor(
    @Inject('IAppConfig') private readonly configService: IAppConfig,
    @Inject('ILogger') private readonly logger: ILogger,
  ) {
    super();
    this.topicArn = this.configService.snsConfig.networkEventsTopicArn;
    this.isEnabled = !!this.topicArn;
  }

  async onModuleInit(): Promise<void> {
    if (!this.isEnabled) {
      this.logger.warn('SNS Network Event Publisher is disabled - no topic ARN configured');
      return;
    }

    this.logger.info('Initializing SNS Network Event Publisher...', {
      region: this.configService.snsConfig.region,
      topicArn: this.topicArn,
    });

    this.snsClient = new SNSClient({
      region: this.configService.snsConfig.region,
    });

    this.logger.info('SNS Network Event Publisher initialized successfully');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.snsClient) {
      this.logger.info('Destroying SNS client...');
      this.snsClient.destroy();
      this.logger.info('SNS client destroyed');
    }
  }

  async publish(event: NetworkEvent, options: EventPublisherOptions): Promise<void> {
    const { logger } = options;

    if (!this.isEnabled) {
      logger.debug('SNS publishing skipped - not configured', { eventType: event.eventType });
      return;
    }

    const message = JSON.stringify(event);

    logger.info('Publishing network event to SNS', {
      eventType: event.eventType,
      networkId: event.data.id,
      correlationId: event.correlationId,
    });

    try {
      const command = new PublishCommand({
        TopicArn: this.topicArn,
        Message: message,
        MessageAttributes: {
          eventType: {
            DataType: 'String',
            StringValue: event.eventType,
          },
          correlationId: {
            DataType: 'String',
            StringValue: event.correlationId,
          },
          chainId: {
            DataType: 'Number',
            StringValue: String(event.data.chainId),
          },
        },
      });

      const result = await this.snsClient.send(command);

      logger.info('Network event published successfully', {
        eventType: event.eventType,
        networkId: event.data.id,
        messageId: result.MessageId,
      });
    } catch (error) {
      logger.error('Failed to publish network event to SNS', {
        eventType: event.eventType,
        networkId: event.data.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
