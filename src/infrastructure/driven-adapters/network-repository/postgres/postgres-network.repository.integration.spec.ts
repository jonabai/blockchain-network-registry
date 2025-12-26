import { Test, TestingModule } from '@nestjs/testing';
import { PostgresNetworkRepository } from './postgres-network.repository';
import { DatabaseService } from '../../database/database.service';
import { ILogger } from '@domain/gateways/network-repository.gateway';
import { CreateNetworkData } from '@domain/models/network.model';
import { v4 as uuidv4 } from 'uuid';

describe('PostgresNetworkRepository Integration', () => {
  let repository: PostgresNetworkRepository;
  let databaseService: DatabaseService;
  let mockLogger: ILogger;

  const mockAppConfig = {
    serverPort: 3001,
    serverCorsOrigin: '*',
    databaseConfig: {
      client: 'pg',
      connection: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433', 10),
        database: process.env.DB_NAME || 'network_registry_test',
        user: process.env.DB_USER || 'network_registry_test',
        password: process.env.DB_PASSWORD || 'network_registry_test',
      },
      pool: { min: 2, max: 10 },
    },
    jwtConfig: {
      secret: 'test-secret',
      expiresIn: '1h',
    },
  };

  const createTestNetwork = (): CreateNetworkData => ({
    chainId: Math.floor(Math.random() * 100000) + 1,
    name: `Test Network ${uuidv4().substring(0, 8)}`,
    rpcUrl: 'https://test-rpc.example.com',
    otherRpcUrls: ['https://backup-rpc.example.com'],
    testNet: true,
    blockExplorerUrl: 'https://test-explorer.example.com',
    feeMultiplier: 1.5,
    gasLimitMultiplier: 1.2,
    active: true,
    defaultSignerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD45',
  });

  beforeAll(async () => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        PostgresNetworkRepository,
        {
          provide: 'IAppConfig',
          useValue: mockAppConfig,
        },
        {
          provide: 'ILogger',
          useValue: mockLogger,
        },
      ],
    }).compile();

    databaseService = module.get<DatabaseService>(DatabaseService);
    repository = module.get<PostgresNetworkRepository>(PostgresNetworkRepository);

    await databaseService.onModuleInit();
    await databaseService.runMigrations();
  });

  afterAll(async () => {
    if (databaseService) {
      await databaseService.onModuleDestroy();
    }
  });

  beforeEach(async () => {
    await databaseService.getKnex()('networks').del();
  });

  describe('create', () => {
    it('should create a network and return it with id and timestamps', async () => {
      const networkData = createTestNetwork();

      const result = await repository.create(networkData, { logger: mockLogger });

      expect(result.id).toBeDefined();
      expect(result.chainId).toBe(networkData.chainId);
      expect(result.name).toBe(networkData.name);
      expect(result.rpcUrl).toBe(networkData.rpcUrl);
      expect(result.otherRpcUrls).toEqual(networkData.otherRpcUrls);
      expect(result.testNet).toBe(networkData.testNet);
      expect(result.active).toBe(true);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('findById', () => {
    it('should find a network by id', async () => {
      const networkData = createTestNetwork();
      const created = await repository.create(networkData, { logger: mockLogger });

      const found = await repository.findById(created.id, { logger: mockLogger });

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.chainId).toBe(networkData.chainId);
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById(uuidv4(), { logger: mockLogger });

      expect(found).toBeNull();
    });
  });

  describe('findByChainId', () => {
    it('should find a network by chainId', async () => {
      const networkData = createTestNetwork();
      await repository.create(networkData, { logger: mockLogger });

      const found = await repository.findByChainId(networkData.chainId, { logger: mockLogger });

      expect(found).not.toBeNull();
      expect(found?.chainId).toBe(networkData.chainId);
    });

    it('should return null for non-existent chainId', async () => {
      const found = await repository.findByChainId(999999, { logger: mockLogger });

      expect(found).toBeNull();
    });
  });

  describe('findAllActive', () => {
    it('should return only active networks', async () => {
      const network1 = createTestNetwork();
      const network2 = createTestNetwork();
      const network3 = createTestNetwork();

      await repository.create(network1, { logger: mockLogger });
      await repository.create(network2, { logger: mockLogger });
      const inactive = await repository.create(network3, { logger: mockLogger });

      await repository.softDelete(inactive.id, { logger: mockLogger });

      const activeNetworks = await repository.findAllActive({ logger: mockLogger });

      expect(activeNetworks).toHaveLength(2);
      expect(activeNetworks.every((n) => n.active)).toBe(true);
    });

    it('should return empty array when no active networks exist', async () => {
      const activeNetworks = await repository.findAllActive({ logger: mockLogger });

      expect(activeNetworks).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a network', async () => {
      const networkData = createTestNetwork();
      const created = await repository.create(networkData, { logger: mockLogger });

      const updated = await repository.update(created.id, { name: 'Updated Name' }, { logger: mockLogger });

      expect(updated?.name).toBe('Updated Name');
      expect(updated?.chainId).toBe(networkData.chainId);
    });

    it('should return null for non-existent network', async () => {
      const updated = await repository.update(uuidv4(), { name: 'Updated Name' }, { logger: mockLogger });

      expect(updated).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('should set active to false', async () => {
      const networkData = createTestNetwork();
      const created = await repository.create(networkData, { logger: mockLogger });

      const result = await repository.softDelete(created.id, { logger: mockLogger });

      expect(result).toBe(true);

      const found = await repository.findById(created.id, { logger: mockLogger });
      expect(found?.active).toBe(false);
    });

    it('should return false for non-existent network', async () => {
      const result = await repository.softDelete(uuidv4(), { logger: mockLogger });

      expect(result).toBe(false);
    });
  });

  describe('existsByChainId', () => {
    it('should return true when chainId exists', async () => {
      const networkData = createTestNetwork();
      await repository.create(networkData, { logger: mockLogger });

      const exists = await repository.existsByChainId(networkData.chainId, undefined, { logger: mockLogger });

      expect(exists).toBe(true);
    });

    it('should return false when chainId does not exist', async () => {
      const exists = await repository.existsByChainId(999999, undefined, { logger: mockLogger });

      expect(exists).toBe(false);
    });

    it('should exclude specified id from check', async () => {
      const networkData = createTestNetwork();
      const created = await repository.create(networkData, { logger: mockLogger });

      const exists = await repository.existsByChainId(networkData.chainId, created.id, { logger: mockLogger });

      expect(exists).toBe(false);
    });
  });
});
