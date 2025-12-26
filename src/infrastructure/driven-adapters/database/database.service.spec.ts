import { DatabaseService } from './database.service';
import { IAppConfig } from '../config/app-config.interface';
import { ILogger } from '@domain/gateways/network-repository.gateway';

jest.mock('knex', () => {
  const mockKnexInstance = {
    raw: jest.fn(),
    destroy: jest.fn(),
    migrate: {
      latest: jest.fn(),
    },
  };

  const knexFn = jest.fn(() => mockKnexInstance);
  return {
    knex: knexFn,
    __mockKnexInstance: mockKnexInstance,
  };
});

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockConfigService: jest.Mocked<IAppConfig>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockKnexInstance: {
    raw: jest.Mock;
    destroy: jest.Mock;
    migrate: { latest: jest.Mock };
  };

  const mockDatabaseConfig = {
    client: 'pg',
    connection: {
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      user: 'test_user',
      password: 'test_password',
    },
    pool: {
      min: 2,
      max: 10,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const knexModule = require('knex');
    mockKnexInstance = knexModule.__mockKnexInstance;

    mockConfigService = {
      databaseConfig: mockDatabaseConfig,
      jwtConfig: { secret: 'test', expiresIn: '1h' },
      serverPort: 3000,
      serverCorsOrigin: '*',
    } as jest.Mocked<IAppConfig>;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    service = new DatabaseService(mockConfigService, mockLogger);
  });

  describe('onModuleInit', () => {
    it('should initialize knex and establish database connection', async () => {
      mockKnexInstance.raw.mockResolvedValue([{ '?column?': 1 }]);

      await service.onModuleInit();

      expect(mockLogger.info).toHaveBeenCalledWith('Initializing DatabaseService...');
      expect(mockKnexInstance.raw).toHaveBeenCalledWith('SELECT 1');
      expect(mockLogger.info).toHaveBeenCalledWith('Database connection established successfully');
    });

    it('should throw error and log when database connection fails', async () => {
      const dbError = new Error('Connection refused');
      mockKnexInstance.raw.mockRejectedValue(dbError);

      await expect(service.onModuleInit()).rejects.toThrow('Connection refused');

      expect(mockLogger.info).toHaveBeenCalledWith('Initializing DatabaseService...');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to connect to database', {
        error: 'Error: Connection refused',
      });
    });

    it('should use configuration from config service', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const knexModule = require('knex');
      const knexFn = knexModule.knex;
      mockKnexInstance.raw.mockResolvedValue([{ '?column?': 1 }]);

      await service.onModuleInit();

      expect(knexFn).toHaveBeenCalledWith({
        client: 'pg',
        connection: {
          host: 'localhost',
          port: 5432,
          database: 'test_db',
          user: 'test_user',
          password: 'test_password',
        },
        pool: {
          min: 2,
          max: 10,
        },
      });
    });
  });

  describe('onModuleDestroy', () => {
    it('should close database connection when knex instance exists', async () => {
      mockKnexInstance.raw.mockResolvedValue([{ '?column?': 1 }]);
      mockKnexInstance.destroy.mockResolvedValue(undefined);

      await service.onModuleInit();
      await service.onModuleDestroy();

      expect(mockLogger.info).toHaveBeenCalledWith('Closing database connection...');
      expect(mockKnexInstance.destroy).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Database connection closed');
    });

    it('should not attempt to close when knex instance does not exist', async () => {
      await service.onModuleDestroy();

      expect(mockKnexInstance.destroy).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalledWith('Closing database connection...');
    });
  });

  describe('getKnex', () => {
    it('should return the knex instance after initialization', async () => {
      mockKnexInstance.raw.mockResolvedValue([{ '?column?': 1 }]);

      await service.onModuleInit();
      const knex = service.getKnex();

      expect(knex).toBe(mockKnexInstance);
    });
  });

  describe('runMigrations', () => {
    it('should run database migrations', async () => {
      mockKnexInstance.raw.mockResolvedValue([{ '?column?': 1 }]);
      mockKnexInstance.migrate.latest.mockResolvedValue([1, ['migration1.ts']]);

      await service.onModuleInit();
      await service.runMigrations();

      expect(mockLogger.info).toHaveBeenCalledWith('Running database migrations...');
      expect(mockKnexInstance.migrate.latest).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Database migrations completed');
    });

    it('should throw error when migrations fail', async () => {
      mockKnexInstance.raw.mockResolvedValue([{ '?column?': 1 }]);
      const migrationError = new Error('Migration failed');
      mockKnexInstance.migrate.latest.mockRejectedValue(migrationError);

      await service.onModuleInit();

      await expect(service.runMigrations()).rejects.toThrow('Migration failed');
      expect(mockLogger.info).toHaveBeenCalledWith('Running database migrations...');
    });
  });
});
