import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { Knex, knex } from 'knex';
import { IAppConfig } from '../config/app-config.interface';
import { ILogger } from '@domain/gateways/network-repository.gateway';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private knexInstance!: Knex;

  constructor(
    @Inject('IAppConfig') private readonly configService: IAppConfig,
    @Inject('ILogger') private readonly logger: ILogger,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.info('Initializing DatabaseService...');

    const dbConfig = this.configService.databaseConfig;

    this.knexInstance = knex({
      client: dbConfig.client,
      connection: {
        host: dbConfig.connection.host,
        port: dbConfig.connection.port,
        database: dbConfig.connection.database,
        user: dbConfig.connection.user,
        password: dbConfig.connection.password,
      },
      pool: dbConfig.pool,
    });

    try {
      await this.knexInstance.raw('SELECT 1');
      this.logger.info('Database connection established successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database', { error: String(error) });
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.knexInstance) {
      this.logger.info('Closing database connection...');
      await this.knexInstance.destroy();
      this.logger.info('Database connection closed');
    }
  }

  getKnex(): Knex {
    return this.knexInstance;
  }

  async runMigrations(): Promise<void> {
    this.logger.info('Running database migrations...');
    await this.knexInstance.migrate.latest();
    this.logger.info('Database migrations completed');
  }
}
