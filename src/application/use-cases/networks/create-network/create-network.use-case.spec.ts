import { Test, TestingModule } from '@nestjs/testing';
import { CreateNetworkUseCase, CreateNetworkContext } from './create-network.use-case';
import { NetworkRepository } from '@domain/gateways/network-repository.gateway';
import { ConflictError } from '@shared/errors/domain.errors';
import { Network, CreateNetworkData } from '@domain/models/network.model';

describe('CreateNetworkUseCase', () => {
  let useCase: CreateNetworkUseCase;
  let mockNetworkRepository: jest.Mocked<NetworkRepository>;
  let mockLogger: jest.Mocked<{
    info: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
    debug: jest.Mock;
  }>;

  const mockNetworkData: CreateNetworkData = {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/your-key',
    otherRpcUrls: ['https://eth-mainnet.g.alchemy.com/v2/your-key'],
    testNet: false,
    blockExplorerUrl: 'https://etherscan.io',
    feeMultiplier: 1.0,
    gasLimitMultiplier: 1.0,
    active: true,
    defaultSignerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD45',
  };

  const mockNetwork: Network = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    ...mockNetworkData,
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
        CreateNetworkUseCase,
        {
          provide: NetworkRepository,
          useValue: mockNetworkRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateNetworkUseCase>(CreateNetworkUseCase);
  });

  describe('execute', () => {
    it('should create a network successfully when chainId does not exist', async () => {
      mockNetworkRepository.existsByChainId.mockResolvedValue(false);
      mockNetworkRepository.create.mockResolvedValue(mockNetwork);

      const context: CreateNetworkContext = {
        correlationId: 'test-correlation-id',
        logger: mockLogger,
        account: { id: 'user-1', email: 'test@example.com', role: 'admin' },
        data: mockNetworkData,
      };

      const result = await useCase.execute(context);

      expect(result).toEqual(mockNetwork);
      expect(mockNetworkRepository.existsByChainId).toHaveBeenCalledWith(mockNetworkData.chainId, undefined, {
        logger: mockLogger,
      });
      expect(mockNetworkRepository.create).toHaveBeenCalledWith(mockNetworkData, { logger: mockLogger });
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should throw ConflictError when chainId already exists', async () => {
      mockNetworkRepository.existsByChainId.mockResolvedValue(true);

      const context: CreateNetworkContext = {
        correlationId: 'test-correlation-id',
        logger: mockLogger,
        account: { id: 'user-1', email: 'test@example.com', role: 'admin' },
        data: mockNetworkData,
      };

      await expect(useCase.execute(context)).rejects.toThrow(ConflictError);
      await expect(useCase.execute(context)).rejects.toThrow(`Network with chainId ${mockNetworkData.chainId} already exists`);
      expect(mockNetworkRepository.create).not.toHaveBeenCalled();
    });
  });
});
