import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DatabaseService } from '@infrastructure/driven-adapters/database/database.service';
import { AppConfigService } from '@infrastructure/driven-adapters/config/app-config.service';

describe('NetworksController (e2e)', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let apiKey: string;

  const createNetworkDto = {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/your-key',
    otherRpcUrls: ['https://eth-mainnet.g.alchemy.com/v2/your-key'],
    testNet: false,
    blockExplorerUrl: 'https://etherscan.io',
    feeMultiplier: 1.0,
    gasLimitMultiplier: 1.0,
    defaultSignerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD45',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    databaseService = app.get(DatabaseService);
    const configService = app.get(AppConfigService);

    apiKey = configService.authConfig.apiKey;

    await databaseService.runMigrations();
  });

  afterAll(async () => {
    await databaseService.getKnex().destroy();
    await app.close();
  });

  beforeEach(async () => {
    await databaseService.getKnex()('networks').del();
  });

  describe('POST /networks', () => {
    it('should create a new network', async () => {
      const response = await request(app.getHttpServer())
        .post('/networks')
        .set('X-API-Key', apiKey)
        .send(createNetworkDto)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.chainId).toBe(createNetworkDto.chainId);
      expect(response.body.name).toBe(createNetworkDto.name);
      expect(response.body.active).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer()).post('/networks').send(createNetworkDto).expect(401);
    });

    it('should return 400 for invalid data', async () => {
      await request(app.getHttpServer())
        .post('/networks')
        .set('X-API-Key', apiKey)
        .send({ ...createNetworkDto, chainId: -1 })
        .expect(400);
    });

    it('should return 409 for duplicate chainId', async () => {
      await request(app.getHttpServer())
        .post('/networks')
        .set('X-API-Key', apiKey)
        .send(createNetworkDto)
        .expect(201);

      await request(app.getHttpServer())
        .post('/networks')
        .set('X-API-Key', apiKey)
        .send(createNetworkDto)
        .expect(409);
    });

    it('should validate Ethereum address format', async () => {
      await request(app.getHttpServer())
        .post('/networks')
        .set('X-API-Key', apiKey)
        .send({ ...createNetworkDto, defaultSignerAddress: 'invalid-address' })
        .expect(400);
    });
  });

  describe('GET /networks', () => {
    it('should return only active networks', async () => {
      await request(app.getHttpServer())
        .post('/networks')
        .set('X-API-Key', apiKey)
        .send(createNetworkDto)
        .expect(201);

      const network2 = await request(app.getHttpServer())
        .post('/networks')
        .set('X-API-Key', apiKey)
        .send({ ...createNetworkDto, chainId: 137, name: 'Polygon' })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/networks/${network2.body.id}`)
        .set('X-API-Key', apiKey)
        .expect(204);

      const response = await request(app.getHttpServer())
        .get('/networks')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].chainId).toBe(1);
    });

    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer()).get('/networks').expect(401);
    });
  });

  describe('GET /networks/:networkId', () => {
    it('should return a network by id', async () => {
      const created = await request(app.getHttpServer())
        .post('/networks')
        .set('X-API-Key', apiKey)
        .send(createNetworkDto)
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/networks/${created.body.id}`)
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.id).toBe(created.body.id);
      expect(response.body.chainId).toBe(createNetworkDto.chainId);
    });

    it('should return 404 for non-existent network', async () => {
      await request(app.getHttpServer())
        .get('/networks/550e8400-e29b-41d4-a716-446655440000')
        .set('X-API-Key', apiKey)
        .expect(404);
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/networks/invalid-uuid')
        .set('X-API-Key', apiKey)
        .expect(400);
    });
  });

  describe('PUT /networks/:networkId', () => {
    it('should fully update a network', async () => {
      const created = await request(app.getHttpServer())
        .post('/networks')
        .set('X-API-Key', apiKey)
        .send(createNetworkDto)
        .expect(201);

      const updateDto = {
        ...createNetworkDto,
        name: 'Updated Ethereum Mainnet',
        feeMultiplier: 1.5,
      };

      const response = await request(app.getHttpServer())
        .put(`/networks/${created.body.id}`)
        .set('X-API-Key', apiKey)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe('Updated Ethereum Mainnet');
      expect(response.body.feeMultiplier).toBe(1.5);
    });

    it('should return 404 for non-existent network', async () => {
      await request(app.getHttpServer())
        .put('/networks/550e8400-e29b-41d4-a716-446655440000')
        .set('X-API-Key', apiKey)
        .send(createNetworkDto)
        .expect(404);
    });

    it('should return 409 when updating to existing chainId', async () => {
      const network1 = await request(app.getHttpServer())
        .post('/networks')
        .set('X-API-Key', apiKey)
        .send(createNetworkDto)
        .expect(201);

      await request(app.getHttpServer())
        .post('/networks')
        .set('X-API-Key', apiKey)
        .send({ ...createNetworkDto, chainId: 137, name: 'Polygon' })
        .expect(201);

      await request(app.getHttpServer())
        .put(`/networks/${network1.body.id}`)
        .set('X-API-Key', apiKey)
        .send({ ...createNetworkDto, chainId: 137 })
        .expect(409);
    });
  });

  describe('PATCH /networks/:networkId', () => {
    it('should partially update a network', async () => {
      const created = await request(app.getHttpServer())
        .post('/networks')
        .set('X-API-Key', apiKey)
        .send(createNetworkDto)
        .expect(201);

      const response = await request(app.getHttpServer())
        .patch(`/networks/${created.body.id}`)
        .set('X-API-Key', apiKey)
        .send({ name: 'Partially Updated Name' })
        .expect(200);

      expect(response.body.name).toBe('Partially Updated Name');
      expect(response.body.chainId).toBe(createNetworkDto.chainId);
    });

    it('should update active status', async () => {
      const created = await request(app.getHttpServer())
        .post('/networks')
        .set('X-API-Key', apiKey)
        .send(createNetworkDto)
        .expect(201);

      const response = await request(app.getHttpServer())
        .patch(`/networks/${created.body.id}`)
        .set('X-API-Key', apiKey)
        .send({ active: false })
        .expect(200);

      expect(response.body.active).toBe(false);
    });
  });

  describe('DELETE /networks/:networkId', () => {
    it('should soft delete a network', async () => {
      const created = await request(app.getHttpServer())
        .post('/networks')
        .set('X-API-Key', apiKey)
        .send(createNetworkDto)
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/networks/${created.body.id}`)
        .set('X-API-Key', apiKey)
        .expect(204);

      const response = await request(app.getHttpServer())
        .get(`/networks/${created.body.id}`)
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.active).toBe(false);
    });

    it('should return 404 for non-existent network', async () => {
      await request(app.getHttpServer())
        .delete('/networks/550e8400-e29b-41d4-a716-446655440000')
        .set('X-API-Key', apiKey)
        .expect(404);
    });
  });
});
