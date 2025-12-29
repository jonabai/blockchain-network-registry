import { Test, TestingModule } from '@nestjs/testing';
import { PostgresNetworkRepository } from './postgres-network.repository';
import { DatabaseService } from '../../database/database.service';
import { Network, CreateNetworkData, UpdateNetworkData } from '@domain/models/network.model';
import { RepositoryOptions } from '@domain/gateways/network-repository.gateway';

describe('PostgresNetworkRepository', () => {
  let repository: PostgresNetworkRepository;
  let mockKnex: jest.Mock;
  let mockQueryBuilder: {
    where: jest.Mock;
    whereNot: jest.Mock;
    first: jest.Mock;
    orderBy: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
  };

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const mockOptions: RepositoryOptions = {
    logger: mockLogger,
  };

  const mockNetworkRow = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    chain_id: 1,
    name: 'Ethereum Mainnet',
    rpc_url: 'https://mainnet.infura.io/v3/your-key',
    other_rpc_urls: '["https://eth-mainnet.g.alchemy.com/v2/your-key"]',
    test_net: false,
    block_explorer_url: 'https://etherscan.io',
    fee_multiplier: '1.0000',
    gas_limit_multiplier: '1.0000',
    active: true,
    default_signer_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD45',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  };

  const expectedNetwork: Network = {
    id: '550e8400-e29b-41d4-a716-446655440000',
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
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      whereNot: jest.fn().mockReturnThis(),
      first: jest.fn(),
      orderBy: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
    };

    mockKnex = jest.fn().mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostgresNetworkRepository,
        {
          provide: DatabaseService,
          useValue: {
            getKnex: () => mockKnex,
          },
        },
      ],
    }).compile();

    repository = module.get<PostgresNetworkRepository>(PostgresNetworkRepository);

    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return network when found', async () => {
      mockQueryBuilder.first.mockResolvedValue(mockNetworkRow);

      const result = await repository.findById('550e8400-e29b-41d4-a716-446655440000', mockOptions);

      expect(result).toEqual(expectedNetwork);
      expect(mockKnex).toHaveBeenCalledWith('networks');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ id: '550e8400-e29b-41d4-a716-446655440000' });
      expect(mockLogger.info).toHaveBeenCalledWith('Finding network by id', expect.any(Object));
    });

    it('should return null when network not found', async () => {
      mockQueryBuilder.first.mockResolvedValue(undefined);

      const result = await repository.findById('non-existent-id', mockOptions);

      expect(result).toBeNull();
      expect(mockLogger.info).toHaveBeenCalledWith('Network not found', expect.any(Object));
    });

    it('should throw and log error when database fails', async () => {
      const error = new Error('Database connection failed');
      mockQueryBuilder.first.mockRejectedValue(error);

      await expect(repository.findById('some-id', mockOptions)).rejects.toThrow('Database connection failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Error finding network by id', expect.any(Object));
    });
  });

  describe('findByChainId', () => {
    it('should return network when found by chainId', async () => {
      mockQueryBuilder.first.mockResolvedValue(mockNetworkRow);

      const result = await repository.findByChainId(1, mockOptions);

      expect(result).toEqual(expectedNetwork);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ chain_id: 1 });
      expect(mockLogger.info).toHaveBeenCalledWith('Finding network by chainId', expect.any(Object));
    });

    it('should return null when network not found by chainId', async () => {
      mockQueryBuilder.first.mockResolvedValue(undefined);

      const result = await repository.findByChainId(999, mockOptions);

      expect(result).toBeNull();
      expect(mockLogger.info).toHaveBeenCalledWith('Network not found by chainId', expect.any(Object));
    });

    it('should throw and log error when database fails', async () => {
      const error = new Error('Database error');
      mockQueryBuilder.first.mockRejectedValue(error);

      await expect(repository.findByChainId(1, mockOptions)).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalledWith('Error finding network by chainId', expect.any(Object));
    });
  });

  describe('findAllActive', () => {
    it('should return all active networks', async () => {
      const rows = [mockNetworkRow, { ...mockNetworkRow, id: 'network-2', chain_id: 137 }];
      mockQueryBuilder.orderBy.mockResolvedValue(rows);

      const result = await repository.findAllActive(mockOptions);

      expect(result).toHaveLength(2);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ active: true });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('name', 'asc');
      expect(mockLogger.info).toHaveBeenCalledWith('Found active networks', { count: 2 });
    });

    it('should return empty array when no active networks', async () => {
      mockQueryBuilder.orderBy.mockResolvedValue([]);

      const result = await repository.findAllActive(mockOptions);

      expect(result).toEqual([]);
      expect(mockLogger.info).toHaveBeenCalledWith('Found active networks', { count: 0 });
    });

    it('should throw and log error when database fails', async () => {
      const error = new Error('Query failed');
      mockQueryBuilder.orderBy.mockRejectedValue(error);

      await expect(repository.findAllActive(mockOptions)).rejects.toThrow('Query failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Error finding active networks', expect.any(Object));
    });
  });

  describe('create', () => {
    const createData: CreateNetworkData = {
      chainId: 1,
      name: 'Ethereum Mainnet',
      rpcUrl: 'https://mainnet.infura.io/v3/your-key',
      otherRpcUrls: ['https://eth-mainnet.g.alchemy.com/v2/your-key'],
      testNet: false,
      blockExplorerUrl: 'https://etherscan.io',
      feeMultiplier: 1.0,
      gasLimitMultiplier: 1.0,
      defaultSignerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD45',
      active: true,
    };

    it('should create and return the network', async () => {
      mockQueryBuilder.insert.mockResolvedValue([1]);
      mockQueryBuilder.first.mockResolvedValue(mockNetworkRow);

      const result = await repository.create(createData, mockOptions);

      expect(result).toEqual(expectedNetwork);
      expect(mockKnex).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Creating network', expect.any(Object));
      expect(mockLogger.info).toHaveBeenCalledWith('Network created successfully', expect.any(Object));
    });

    it('should throw error when created network cannot be retrieved', async () => {
      mockQueryBuilder.insert.mockResolvedValue([1]);
      mockQueryBuilder.first.mockResolvedValue(undefined);

      await expect(repository.create(createData, mockOptions)).rejects.toThrow('Failed to retrieve created network');
    });

    it('should throw and log error when insert fails', async () => {
      const error = new Error('Insert failed');
      mockQueryBuilder.insert.mockRejectedValue(error);

      await expect(repository.create(createData, mockOptions)).rejects.toThrow('Insert failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Error creating network', expect.any(Object));
    });

    it('should throw ConflictError when unique constraint is violated', async () => {
      const uniqueViolationError = { code: '23505', message: 'duplicate key value violates unique constraint' };
      mockQueryBuilder.insert.mockRejectedValue(uniqueViolationError);

      await expect(repository.create(createData, mockOptions)).rejects.toThrow('Network with chainId 1 already exists');
      expect(mockLogger.warn).toHaveBeenCalledWith('Unique constraint violation during network creation', { chainId: 1 });
    });
  });

  describe('update', () => {
    const updateData: UpdateNetworkData = {
      name: 'Updated Ethereum',
      feeMultiplier: 1.5,
    };

    it('should update and return the network', async () => {
      const updatedRow = { ...mockNetworkRow, name: 'Updated Ethereum', fee_multiplier: '1.5000' };
      mockQueryBuilder.first.mockResolvedValueOnce(mockNetworkRow);
      mockQueryBuilder.update.mockResolvedValue(1);
      mockQueryBuilder.first.mockResolvedValueOnce(updatedRow);

      const result = await repository.update('550e8400-e29b-41d4-a716-446655440000', updateData, mockOptions);

      expect(result).toBeTruthy();
      expect(result?.name).toBe('Updated Ethereum');
      expect(mockLogger.info).toHaveBeenCalledWith('Updating network', expect.any(Object));
      expect(mockLogger.info).toHaveBeenCalledWith('Network updated successfully', expect.any(Object));
    });

    it('should return null when network not found', async () => {
      mockQueryBuilder.first.mockResolvedValue(undefined);

      const result = await repository.update('non-existent-id', updateData, mockOptions);

      expect(result).toBeNull();
      expect(mockLogger.info).toHaveBeenCalledWith('Network not found for update', expect.any(Object));
    });

    it('should throw and log error when update fails', async () => {
      mockQueryBuilder.first.mockResolvedValueOnce(mockNetworkRow);
      const error = new Error('Update failed');
      mockQueryBuilder.update.mockRejectedValue(error);

      await expect(repository.update('some-id', updateData, mockOptions)).rejects.toThrow('Update failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Error updating network', expect.any(Object));
    });

    it('should throw ConflictError when unique constraint is violated on chainId update', async () => {
      const updateWithChainId: UpdateNetworkData = { chainId: 137 };
      mockQueryBuilder.first.mockResolvedValueOnce(mockNetworkRow);
      const uniqueViolationError = { code: '23505', message: 'duplicate key value violates unique constraint' };
      mockQueryBuilder.update.mockRejectedValue(uniqueViolationError);

      await expect(repository.update('some-id', updateWithChainId, mockOptions)).rejects.toThrow('Network with chainId 137 already exists');
      expect(mockLogger.warn).toHaveBeenCalledWith('Unique constraint violation during network update', { id: 'some-id', chainId: 137 });
    });
  });

  describe('softDelete', () => {
    it('should soft delete and return true', async () => {
      mockQueryBuilder.first.mockResolvedValue(mockNetworkRow);
      mockQueryBuilder.update.mockResolvedValue(1);

      const result = await repository.softDelete('550e8400-e29b-41d4-a716-446655440000', mockOptions);

      expect(result).toBe(true);
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          active: false,
        }),
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Network soft deleted successfully', expect.any(Object));
    });

    it('should return false when network not found', async () => {
      mockQueryBuilder.first.mockResolvedValue(undefined);

      const result = await repository.softDelete('non-existent-id', mockOptions);

      expect(result).toBe(false);
      expect(mockLogger.info).toHaveBeenCalledWith('Network not found for soft delete', expect.any(Object));
    });

    it('should throw and log error when delete fails', async () => {
      mockQueryBuilder.first.mockResolvedValue(mockNetworkRow);
      const error = new Error('Delete failed');
      mockQueryBuilder.update.mockRejectedValue(error);

      await expect(repository.softDelete('some-id', mockOptions)).rejects.toThrow('Delete failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Error soft deleting network', expect.any(Object));
    });
  });

  describe('existsByChainId', () => {
    it('should return true when network exists', async () => {
      mockQueryBuilder.first.mockResolvedValue(mockNetworkRow);

      const result = await repository.existsByChainId(1, undefined, mockOptions);

      expect(result).toBe(true);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ chain_id: 1 });
      expect(mockLogger.info).toHaveBeenCalledWith('Network exists check result', { chainId: 1, exists: true });
    });

    it('should return false when network does not exist', async () => {
      mockQueryBuilder.first.mockResolvedValue(undefined);

      const result = await repository.existsByChainId(999, undefined, mockOptions);

      expect(result).toBe(false);
      expect(mockLogger.info).toHaveBeenCalledWith('Network exists check result', { chainId: 999, exists: false });
    });

    it('should exclude specified id from check', async () => {
      mockQueryBuilder.first.mockResolvedValue(undefined);

      const result = await repository.existsByChainId(1, 'exclude-id', mockOptions);

      expect(result).toBe(false);
      expect(mockQueryBuilder.whereNot).toHaveBeenCalledWith({ id: 'exclude-id' });
    });

    it('should throw and log error when check fails', async () => {
      const error = new Error('Query failed');
      mockQueryBuilder.first.mockRejectedValue(error);

      await expect(repository.existsByChainId(1, undefined, mockOptions)).rejects.toThrow('Query failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Error checking network existence', expect.any(Object));
    });
  });

  describe('mapToDomain edge cases', () => {
    it('should handle null other_rpc_urls', async () => {
      const rowWithNullUrls = { ...mockNetworkRow, other_rpc_urls: null };
      mockQueryBuilder.first.mockResolvedValue(rowWithNullUrls);

      const result = await repository.findById('some-id', mockOptions);

      expect(result?.otherRpcUrls).toEqual([]);
    });

    it('should handle empty other_rpc_urls', async () => {
      const rowWithEmptyUrls = { ...mockNetworkRow, other_rpc_urls: '[]' };
      mockQueryBuilder.first.mockResolvedValue(rowWithEmptyUrls);

      const result = await repository.findById('some-id', mockOptions);

      expect(result?.otherRpcUrls).toEqual([]);
    });

    it('should handle invalid JSON in other_rpc_urls gracefully', async () => {
      const rowWithInvalidJson = { ...mockNetworkRow, other_rpc_urls: 'not-valid-json' };
      mockQueryBuilder.first.mockResolvedValue(rowWithInvalidJson);

      const result = await repository.findById('some-id', mockOptions);

      expect(result?.otherRpcUrls).toEqual([]);
    });
  });
});
