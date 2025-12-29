export interface DatabaseConfig {
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

export interface AuthConfig {
  apiKey: string;
}

export interface ServerConfig {
  port: number;
  cors: {
    origin: string | string[];
  };
}

export interface SnsConfig {
  region: string;
  networkEventsTopicArn: string;
}

export interface IAppConfig {
  serverPort: number;
  serverCorsOrigin: string | string[];
  databaseConfig: DatabaseConfig;
  authConfig: AuthConfig;
  snsConfig: SnsConfig;
  isProduction: boolean;
}
