import { Test, TestingModule } from '@nestjs/testing';
import { DeleteNetworkUseCase, DeleteNetworkContext } from './delete-network.use-case';
import { NetworkRepository } from '@domain/gateways/network-repository.gateway';
import { NotFoundError } from '@shared/errors/domain.errors';

describe('DeleteNetworkUseCase', () => {
  let useCase: DeleteNetworkUseCase;
  let mockNetworkRepository: jest.Mocked<NetworkRepository>;
  let mockLogger: jest.Mocked<{
    info: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
    debug: jest.Mock;
  }>;

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
        DeleteNetworkUseCase,
        {
          provide: NetworkRepository,
          useValue: mockNetworkRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteNetworkUseCase>(DeleteNetworkUseCase);
  });

  describe('execute', () => {
    it('should soft delete a network successfully', async () => {
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
      mockNetworkRepository.softDelete.mockResolvedValue(false);

      const context: DeleteNetworkContext = {
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
