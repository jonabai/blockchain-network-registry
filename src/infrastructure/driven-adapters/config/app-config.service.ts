import { Injectable } from '@nestjs/common';
import { IAppConfig, DatabaseConfig, JwtConfig } from './app-config.interface';

// Use require to ensure config is loaded at runtime, not at module load time
// eslint-disable-next-line @typescript-eslint/no-require-imports
const config = require('config');

@Injectable()
export class AppConfigService implements IAppConfig {
  readonly serverPort: number;
  readonly serverCorsOrigin: string | string[];
  readonly databaseConfig: DatabaseConfig;
  readonly jwtConfig: JwtConfig;
  readonly isProduction: boolean;

  constructor() {
    this.serverPort = config.get('server.port') as number;
    this.serverCorsOrigin = config.get('server.cors.origin') as string | string[];
    this.databaseConfig = config.get('database') as DatabaseConfig;
    this.jwtConfig = config.get('jwt') as JwtConfig;
    this.isProduction = process.env.NODE_ENV === 'production';
  }
}
