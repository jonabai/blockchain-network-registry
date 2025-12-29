import { Test, TestingModule } from '@nestjs/testing';
import { DeleteNetworkUseCase, DeleteNetworkContext } from './delete-network.use-case';
import { NetworkRepository } from '@domain/gateways/network-repository.gateway';
import { NetworkEventPublisher } from '@domain/gateways/network-event-publisher.gateway';
import { NotFoundError } from '@shared/errors/domain.errors';
import { Network } from '@domain/models/network.model';
import { NetworkEventType } from '@domain/models/network-event.model';

describe('DeleteNetworkUseCase', () => {
  let useCase: DeleteNetworkUseCase;
  let mockNetworkRepository: jest.Mocked<NetworkRepository>;
  let mockNetworkEventPublisher: jest.Mocked<NetworkEventPublisher>;
  let mockLogger: jest.Mocked<{
    info: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
    debug: jest.Mock;
  }>;

  const mockNetwork: Network = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/your-key',
    otherRpcUrls: [],
    testNet: false,
    blockExplorerUrl: 'https://etherscan.io',
    feeMultiplier: 1.0,
    gasLimitMultiplier: 1.0,
    active: true,
    defaultSignerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD45',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    mockNetworkRepository = {
      findById: jest.fn(),
      findByChainId: jest.fn(),
      findAllActive: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      existsByChainId: jest.fn(),
    } as unknown as jest.Mocked<NetworkRepository>;

    mockNetworkEventPublisher = {
      publish: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<NetworkEventPublisher>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteNetworkUseCase,
        {
          provide: NetworkRepository,
          useValue: mockNetworkRepository,
        },
        {
          provide: NetworkEventPublisher,
          useValue: mockNetworkEventPublisher,
        },
      ],
    }).compile();

    useCase = module.get<DeleteNetworkUseCase>(DeleteNetworkUseCase);
  });

  describe('execute', () => {
    it('should soft delete a network successfully', async () => {
      mockNetworkRepository.findById.mockResolvedValue(mockNetwork);
      mockNetworkRepository.softDelete.mockResolvedValue(true);

      const context: DeleteNetworkContext = {
        correlationId: 'test-correlation-id',
        logger: mockLogger,
        account: { id: 'user-1', email: 'test@example.com', role: 'admin' },
        networkId: '550e8400-e29b-41d4-a716-446655440000',
      };

      await expect(useCase.execute(context)).resolves.toBeUndefined();
      expect(mockNetworkRepository.softDelete).toHaveBeenCalledWith(context.networkId, { logger: mockLogger });
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should throw NotFoundError when network does not exist', async () => {
      mockNetworkRepository.findById.mockResolvedValue(null);

      const context: DeleteNetworkContext = {
        correlationId: 'test-correlation-id',
        logger: mockLogger,
        account: { id: 'user-1', email: 'test@example.com', role: 'admin' },
        networkId: 'non-existent-id',
      };

      await expect(useCase.execute(context)).rejects.toThrow(NotFoundError);
      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockNetworkEventPublisher.publish).not.toHaveBeenCalled();
    });

    it('should publish NETWORK_DELETED event after successful deletion', async () => {
      mockNetworkRepository.findById.mockResolvedValue(mockNetwork);
      mockNetworkRepository.softDelete.mockResolvedValue(true);

      const context: DeleteNetworkContext = {
        correlationId: 'test-correlation-id',
        logger: mockLogger,
        account: { id: 'user-1', email: 'test@example.com', role: 'admin' },
        networkId: mockNetwork.id,
      };

      await useCase.execute(context);

      expect(mockNetworkEventPublisher.publish).toHaveBeenCalledTimes(1);
      expect(mockNetworkEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: NetworkEventType.NETWORK_DELETED,
          correlationId: 'test-correlation-id',
          data: expect.objectContaining({
            id: mockNetwork.id,
            chainId: mockNetwork.chainId,
            active: false,
          }),
        }),
        { logger: mockLogger },
      );
    });

    it('should still complete deletion even if event publishing fails', async () => {
      mockNetworkRepository.findById.mockResolvedValue(mockNetwork);
      mockNetworkRepository.softDelete.mockResolvedValue(true);
      mockNetworkEventPublisher.publish.mockRejectedValue(new Error('SNS error'));

      const context: DeleteNetworkContext = {
        correlationId: 'test-correlation-id',
        logger: mockLogger,
        account: { id: 'user-1', email: 'test@example.com', role: 'admin' },
        networkId: mockNetwork.id,
      };

      await expect(useCase.execute(context)).resolves.toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to publish network deleted event', expect.any(Object));
    });
  });
});
