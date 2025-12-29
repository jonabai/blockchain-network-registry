import { Test, TestingModule } from '@nestjs/testing';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SnsNetworkEventPublisher } from './sns-network-event-publisher';
import { NetworkEvent, NetworkEventType } from '@domain/models/network-event.model';
import { IAppConfig } from '../../config/app-config.interface';
import { ILogger } from '@domain/gateways/network-repository.gateway';

jest.mock('@aws-sdk/client-sns', () => {
  return {
    SNSClient: jest.fn(),
    PublishCommand: jest.fn().mockImplementation((input) => ({ input })),
  };
});

describe('SnsNetworkEventPublisher', () => {
  let publisher: SnsNetworkEventPublisher;
  let mockSend: jest.Mock;
  let mockDestroy: jest.Mock;
  let mockLogger: jest.Mocked<ILogger>;
  let mockConfig: IAppConfig;

  const createMockEvent = (): NetworkEvent => ({
    eventType: NetworkEventType.NETWORK_CREATED,
    timestamp: new Date().toISOString(),
    correlationId: 'test-correlation-id',
    data: {
      id: 'network-id-123',
      chainId: 1,
      name: 'Ethereum Mainnet',
      rpcUrl: 'https://mainnet.infura.io',
      otherRpcUrls: [],
      testNet: false,
      blockExplorerUrl: 'https://etherscan.io',
      feeMultiplier: 1.0,
      gasLimitMultiplier: 1.0,
      active: true,
      defaultSignerAddress: '0x1234567890123456789012345678901234567890',
    },
  });

  beforeEach(async () => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    mockConfig = {
      serverPort: 3000,
      serverCorsOrigin: '*',
      databaseConfig: {} as IAppConfig['databaseConfig'],
      authConfig: { apiKey: 'test-api-key' },
      snsConfig: {
        region: 'us-east-1',
        networkEventsTopicArn: 'arn:aws:sns:us-east-1:123456789012:network-events',
      },
      isProduction: false,
    };

    mockSend = jest.fn().mockResolvedValue({ MessageId: 'msg-123' });
    mockDestroy = jest.fn();

    (SNSClient as jest.Mock).mockImplementation(() => ({
      send: mockSend,
      destroy: mockDestroy,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnsNetworkEventPublisher,
        { provide: 'IAppConfig', useValue: mockConfig },
        { provide: 'ILogger', useValue: mockLogger },
      ],
    }).compile();

    publisher = module.get<SnsNetworkEventPublisher>(SnsNetworkEventPublisher);
    await publisher.onModuleInit();
  });

  afterEach(async () => {
    await publisher.onModuleDestroy();
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should initialize SNS client when topic ARN is configured', async () => {
      expect(SNSClient).toHaveBeenCalledWith({
        region: 'us-east-1',
      });
      expect(mockLogger.info).toHaveBeenCalledWith('SNS Network Event Publisher initialized successfully');
    });

    it('should log warning when topic ARN is not configured', async () => {
      const disabledConfig = {
        ...mockConfig,
        snsConfig: { region: 'us-east-1', networkEventsTopicArn: '' },
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SnsNetworkEventPublisher,
          { provide: 'IAppConfig', useValue: disabledConfig },
          { provide: 'ILogger', useValue: mockLogger },
        ],
      }).compile();

      const disabledPublisher = module.get<SnsNetworkEventPublisher>(SnsNetworkEventPublisher);
      await disabledPublisher.onModuleInit();

      expect(mockLogger.warn).toHaveBeenCalledWith('SNS Network Event Publisher is disabled - no topic ARN configured');
    });
  });

  describe('publish', () => {
    it('should publish event to SNS with correct parameters', async () => {
      const event = createMockEvent();

      await publisher.publish(event, { logger: mockLogger });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(PublishCommand).toHaveBeenCalledWith({
        TopicArn: 'arn:aws:sns:us-east-1:123456789012:network-events',
        Message: JSON.stringify(event),
        MessageAttributes: {
          eventType: { DataType: 'String', StringValue: 'NETWORK_CREATED' },
          correlationId: { DataType: 'String', StringValue: 'test-correlation-id' },
          chainId: { DataType: 'Number', StringValue: '1' },
        },
      });
    });

    it('should log success message with messageId', async () => {
      const event = createMockEvent();

      await publisher.publish(event, { logger: mockLogger });

      expect(mockLogger.info).toHaveBeenCalledWith('Network event published successfully', {
        eventType: 'NETWORK_CREATED',
        networkId: 'network-id-123',
        messageId: 'msg-123',
      });
    });

    it('should log error but not throw when publish fails', async () => {
      const event = createMockEvent();
      const error = new Error('SNS publish failed');
      mockSend.mockRejectedValueOnce(error);

      await expect(publisher.publish(event, { logger: mockLogger })).resolves.not.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to publish network event to SNS', {
        eventType: 'NETWORK_CREATED',
        networkId: 'network-id-123',
        error: 'SNS publish failed',
      });
    });

    it('should skip publishing when SNS is not configured', async () => {
      const disabledConfig = {
        ...mockConfig,
        snsConfig: { region: 'us-east-1', networkEventsTopicArn: '' },
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SnsNetworkEventPublisher,
          { provide: 'IAppConfig', useValue: disabledConfig },
          { provide: 'ILogger', useValue: mockLogger },
        ],
      }).compile();

      const disabledPublisher = module.get<SnsNetworkEventPublisher>(SnsNetworkEventPublisher);
      await disabledPublisher.onModuleInit();

      const event = createMockEvent();
      await disabledPublisher.publish(event, { logger: mockLogger });

      expect(mockLogger.debug).toHaveBeenCalledWith('SNS publishing skipped - not configured', {
        eventType: 'NETWORK_CREATED',
      });
    });

    it('should publish NETWORK_UPDATED events', async () => {
      const event: NetworkEvent = {
        ...createMockEvent(),
        eventType: NetworkEventType.NETWORK_UPDATED,
      };

      await publisher.publish(event, { logger: mockLogger });

      expect(PublishCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          MessageAttributes: expect.objectContaining({
            eventType: { DataType: 'String', StringValue: 'NETWORK_UPDATED' },
          }),
        }),
      );
    });

    it('should publish NETWORK_DELETED events', async () => {
      const event: NetworkEvent = {
        ...createMockEvent(),
        eventType: NetworkEventType.NETWORK_DELETED,
      };

      await publisher.publish(event, { logger: mockLogger });

      expect(PublishCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          MessageAttributes: expect.objectContaining({
            eventType: { DataType: 'String', StringValue: 'NETWORK_DELETED' },
          }),
        }),
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('should destroy SNS client', async () => {
      await publisher.onModuleDestroy();

      expect(mockDestroy).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('SNS client destroyed');
    });
  });
});
