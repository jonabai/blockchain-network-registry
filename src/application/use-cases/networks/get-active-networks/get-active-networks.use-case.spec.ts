import { Test, TestingModule } from '@nestjs/testing';
import { GetActiveNetworksUseCase, GetActiveNetworksContext } from './get-active-networks.use-case';
import { NetworkRepository } from '@domain/gateways/network-repository.gateway';
import { Network } from '@domain/models/network.model';

describe('GetActiveNetworksUseCase', () => {
  let useCase: GetActiveNetworksUseCase;
  let mockNetworkRepository: jest.Mocked<NetworkRepository>;
  let mockLogger: jest.Mocked<{
    info: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
    debug: jest.Mock;
  }>;

  const mockNetworks: Network[] = [
    {
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
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      chainId: 137,
      name: 'Polygon Mainnet',
      rpcUrl: 'https://polygon-rpc.com',
      otherRpcUrls: [],
      testNet: false,
      blockExplorerUrl: 'https://polygonscan.com',
      feeMultiplier: 1.0,
      gasLimitMultiplier: 1.0,
      active: true,
      defaultSignerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD45',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

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
        GetActiveNetworksUseCase,
        {
          provide: NetworkRepository,
          useValue: mockNetworkRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetActiveNetworksUseCase>(GetActiveNetworksUseCase);
  });

  describe('execute', () => {
    it('should return all active networks', async () => {
      mockNetworkRepository.findAllActive.mockResolvedValue(mockNetworks);

      const context: GetActiveNetworksContext = {
        correlationId: 'test-correlation-id',
        logger: mockLogger,
        account: { id: 'user-1', email: 'test@example.com', role: 'admin' },
      };

      const result = await useCase.execute(context);

      expect(result).toEqual(mockNetworks);
      expect(result).toHaveLength(2);
      expect(mockNetworkRepository.findAllActive).toHaveBeenCalledWith({ logger: mockLogger });
    });

    it('should return empty array when no active networks exist', async () => {
      mockNetworkRepository.findAllActive.mockResolvedValue([]);

      const context: GetActiveNetworksContext = {
        correlationId: 'test-correlation-id',
        logger: mockLogger,
        account: { id: 'user-1', email: 'test@example.com', role: 'admin' },
      };

      const result = await useCase.execute(context);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
});
