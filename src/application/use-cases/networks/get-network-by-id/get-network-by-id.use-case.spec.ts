import { Test, TestingModule } from '@nestjs/testing';
import { GetNetworkByIdUseCase, GetNetworkByIdContext } from './get-network-by-id.use-case';
import { NetworkRepository } from '@domain/gateways/network-repository.gateway';
import { NotFoundError } from '@shared/errors/domain.errors';
import { Network } from '@domain/models/network.model';

describe('GetNetworkByIdUseCase', () => {
  let useCase: GetNetworkByIdUseCase;
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
        GetNetworkByIdUseCase,
        {
          provide: NetworkRepository,
          useValue: mockNetworkRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetNetworkByIdUseCase>(GetNetworkByIdUseCase);
  });

  describe('execute', () => {
    it('should return a network when found', async () => {
      mockNetworkRepository.findById.mockResolvedValue(mockNetwork);

      const context: GetNetworkByIdContext = {
        correlationId: 'test-correlation-id',
        logger: mockLogger,
        account: { id: 'user-1', email: 'test@example.com', role: 'admin' },
        networkId: mockNetwork.id,
      };

      const result = await useCase.execute(context);

      expect(result).toEqual(mockNetwork);
      expect(mockNetworkRepository.findById).toHaveBeenCalledWith(mockNetwork.id, { logger: mockLogger });
    });

    it('should throw NotFoundError when network does not exist', async () => {
      mockNetworkRepository.findById.mockResolvedValue(null);

      const context: GetNetworkByIdContext = {
        correlationId: 'test-correlation-id',
        logger: mockLogger,
        account: { id: 'user-1', email: 'test@example.com', role: 'admin' },
        networkId: 'non-existent-id',
      };

      await expect(useCase.execute(context)).rejects.toThrow(NotFoundError);
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });
});
