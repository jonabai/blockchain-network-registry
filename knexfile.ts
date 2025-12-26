import type { Knex } from 'knex';
import config from 'config';

interface DatabaseConfig {
  client: string;
  connection: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
  pool: {
    min: number;
    max: number;
  };
  migrations: {
    directory: string;
    extension: string;
  };
}

const dbConfig = config.get<DatabaseConfig>('database');

const knexConfig: Knex.Config = {
  client: dbConfig.client,
  connection: {
    host: dbConfig.connection.host,
    port: dbConfig.connection.port,
    database: dbConfig.connection.database,
    user: dbConfig.connection.user,
    password: dbConfig.connection.password,
  },
  pool: dbConfig.pool,
  migrations: {
    directory: dbConfig.migrations.directory,
    extension: dbConfig.migrations.extension,
  },
};

export default knexConfig;
