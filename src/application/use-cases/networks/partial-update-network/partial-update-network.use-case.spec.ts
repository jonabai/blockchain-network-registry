import { Test, TestingModule } from '@nestjs/testing';
import { PartialUpdateNetworkUseCase, PartialUpdateNetworkContext } from './partial-update-network.use-case';
import { NetworkRepository } from '@domain/gateways/network-repository.gateway';
import { NotFoundError, ConflictError } from '@shared/errors/domain.errors';
import { Network } from '@domain/models/network.model';

describe('PartialUpdateNetworkUseCase', () => {
  let useCase: PartialUpdateNetworkUseCase;
  let mockNetworkRepository: jest.Mocked<NetworkRepository>;
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartialUpdateNetworkUseCase,
        {
          provide: NetworkRepository,
          useValue: mockNetworkRepository,
        },
      ],
    }).compile();

    useCase = module.get<PartialUpdateNetworkUseCase>(PartialUpdateNetworkUseCase);
  });

  describe('execute', () => {
    it('should partially update a network successfully', async () => {
      const updatedNetwork = { ...mockNetwork, name: 'Updated Name' };
      mockNetworkRepository.findById.mockResolvedValue(mockNetwork);
      mockNetworkRepository.update.mockResolvedValue(updatedNetwork);

      const context: PartialUpdateNetworkContext = {
        correlationId: 'test-correlation-id',
        logger: mockLogger,
        account: { id: 'user-1', email: 'test@example.com', role: 'admin' },
        networkId: mockNetwork.id,
        data: {
          name: 'Updated Name',
        },
      };

      const result = await useCase.execute(context);

      expect(result).toEqual(updatedNetwork);
      expect(mockNetworkRepository.update).toHaveBeenCalledWith(mockNetwork.id, { name: 'Updated Name' }, { logger: mockLogger });
    });

    it('should throw NotFoundError when network does not exist', async () => {
      mockNetworkRepository.findById.mockResolvedValue(null);

      const context: PartialUpdateNetworkContext = {
        correlationId: 'test-correlation-id',
        logger: mockLogger,
        account: { id: 'user-1', email: 'test@example.com', role: 'admin' },
        networkId: 'non-existent-id',
        data: {
          name: 'Updated Name',
        },
      };

      await expect(useCase.execute(context)).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when updating to an existing chainId', async () => {
      mockNetworkRepository.findById.mockResolvedValue(mockNetwork);
      mockNetworkRepository.existsByChainId.mockResolvedValue(true);

      const context: PartialUpdateNetworkContext = {
        correlationId: 'test-correlation-id',
        logger: mockLogger,
        account: { id: 'user-1', email: 'test@example.com', role: 'admin' },
        networkId: mockNetwork.id,
        data: {
          chainId: 137, // Different chainId that already exists
        },
      };

      await expect(useCase.execute(context)).rejects.toThrow(ConflictError);
    });

    it('should allow updating without changing chainId', async () => {
      const updatedNetwork = { ...mockNetwork, feeMultiplier: 1.5 };
      mockNetworkRepository.findById.mockResolvedValue(mockNetwork);
      mockNetworkRepository.update.mockResolvedValue(updatedNetwork);

      const context: PartialUpdateNetworkContext = {
        correlationId: 'test-correlation-id',
        logger: mockLogger,
        account: { id: 'user-1', email: 'test@example.com', role: 'admin' },
        networkId: mockNetwork.id,
        data: {
          feeMultiplier: 1.5,
        },
      };

      const result = await useCase.execute(context);

      expect(result.feeMultiplier).toBe(1.5);
      expect(mockNetworkRepository.existsByChainId).not.toHaveBeenCalled();
    });
  });
});
