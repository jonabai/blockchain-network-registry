import { Injectable } from '@nestjs/common';
import { IAppConfig, DatabaseConfig, AuthConfig, SnsConfig } from './app-config.interface';

// Use require to ensure config is loaded at runtime, not at module load time
// eslint-disable-next-line @typescript-eslint/no-require-imports
const config = require('config');

@Injectable()
export class AppConfigService implements IAppConfig {
  readonly serverPort: number;
  readonly serverCorsOrigin: string | string[];
  readonly databaseConfig: DatabaseConfig;
  readonly authConfig: AuthConfig;
  readonly snsConfig: SnsConfig;
  readonly isProduction: boolean;

  constructor() {
    this.serverPort = config.get('server.port') as number;
    this.serverCorsOrigin = config.get('server.cors.origin') as string | string[];
    this.databaseConfig = config.get('database') as DatabaseConfig;
    this.authConfig = config.get('auth') as AuthConfig;
    this.snsConfig = config.get('sns') as SnsConfig;
    this.isProduction = process.env.NODE_ENV === 'production';
  }
}
