import { Test, TestingModule } from '@nestjs/testing';
import { NetworksController } from './networks.controller';
import { CreateNetworkUseCase } from '@application/use-cases/networks/create-network/create-network.use-case';
import { GetNetworkByIdUseCase } from '@application/use-cases/networks/get-network-by-id/get-network-by-id.use-case';
import { GetActiveNetworksUseCase } from '@application/use-cases/networks/get-active-networks/get-active-networks.use-case';
import { UpdateNetworkUseCase } from '@application/use-cases/networks/update-network/update-network.use-case';
import { PartialUpdateNetworkUseCase } from '@application/use-cases/networks/partial-update-network/partial-update-network.use-case';
import { DeleteNetworkUseCase } from '@application/use-cases/networks/delete-network/delete-network.use-case';
import { CreateNetworkDto, UpdateNetworkDto, PatchNetworkDto } from '../../dto/networks';
import { Network } from '@domain/models/network.model';
import { AuthenticatedRequestContext } from '../../../../../request-context.interface';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

describe('NetworksController', () => {
  let controller: NetworksController;
  let createNetworkUseCase: jest.Mocked<CreateNetworkUseCase>;
  let getNetworkByIdUseCase: jest.Mocked<GetNetworkByIdUseCase>;
  let getActiveNetworksUseCase: jest.Mocked<GetActiveNetworksUseCase>;
  let updateNetworkUseCase: jest.Mocked<UpdateNetworkUseCase>;
  let partialUpdateNetworkUseCase: jest.Mocked<PartialUpdateNetworkUseCase>;
  let deleteNetworkUseCase: jest.Mocked<DeleteNetworkUseCase>;

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const mockContext: AuthenticatedRequestContext = {
    correlationId: 'test-correlation-id',
    logger: mockLogger,
    account: { id: 'user-1', email: 'test@example.com', role: 'admin' },
  };

  const mockNetwork: Network = {
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

  const mockCreateDto: CreateNetworkDto = {
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NetworksController],
      providers: [
        {
          provide: CreateNetworkUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetNetworkByIdUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetActiveNetworksUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: UpdateNetworkUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: PartialUpdateNetworkUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: DeleteNetworkUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NetworksController>(NetworksController);
    createNetworkUseCase = module.get(CreateNetworkUseCase);
    getNetworkByIdUseCase = module.get(GetNetworkByIdUseCase);
    getActiveNetworksUseCase = module.get(GetActiveNetworksUseCase);
    updateNetworkUseCase = module.get(UpdateNetworkUseCase);
    partialUpdateNetworkUseCase = module.get(PartialUpdateNetworkUseCase);
    deleteNetworkUseCase = module.get(DeleteNetworkUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createNetwork', () => {
    it('should create a network and return response DTO', async () => {
      createNetworkUseCase.execute.mockResolvedValue(mockNetwork);

      const result = await controller.createNetwork(mockContext, mockCreateDto);

      expect(createNetworkUseCase.execute).toHaveBeenCalledWith({
        ...mockContext,
        data: {
          ...mockCreateDto,
          otherRpcUrls: mockCreateDto.otherRpcUrls,
          active: true,
        },
      });
      expect(result.id).toBe(mockNetwork.id);
      expect(result.chainId).toBe(mockNetwork.chainId);
      expect(result.name).toBe(mockNetwork.name);
    });

    it('should set empty array for otherRpcUrls when not provided', async () => {
      const dtoWithoutOtherUrls = { ...mockCreateDto, otherRpcUrls: undefined };
      createNetworkUseCase.execute.mockResolvedValue(mockNetwork);

      await controller.createNetwork(mockContext, dtoWithoutOtherUrls);

      expect(createNetworkUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            otherRpcUrls: [],
          }),
        }),
      );
    });
  });

  describe('getActiveNetworks', () => {
    it('should return array of active networks', async () => {
      const mockNetworks = [mockNetwork, { ...mockNetwork, id: 'network-2', chainId: 137 }];
      getActiveNetworksUseCase.execute.mockResolvedValue(mockNetworks);

      const result = await controller.getActiveNetworks(mockContext);

      expect(getActiveNetworksUseCase.execute).toHaveBeenCalledWith(mockContext);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(mockNetwork.id);
    });

    it('should return empty array when no active networks', async () => {
      getActiveNetworksUseCase.execute.mockResolvedValue([]);

      const result = await controller.getActiveNetworks(mockContext);

      expect(result).toEqual([]);
    });
  });

  describe('getNetworkById', () => {
    it('should return network by id', async () => {
      getNetworkByIdUseCase.execute.mockResolvedValue(mockNetwork);

      const result = await controller.getNetworkById(mockContext, mockNetwork.id);

      expect(getNetworkByIdUseCase.execute).toHaveBeenCalledWith({
        ...mockContext,
        networkId: mockNetwork.id,
      });
      expect(result.id).toBe(mockNetwork.id);
    });
  });

  describe('updateNetwork', () => {
    it('should fully update a network', async () => {
      const updateDto: UpdateNetworkDto = {
        ...mockCreateDto,
        name: 'Updated Ethereum',
      };
      const updatedNetwork = { ...mockNetwork, name: 'Updated Ethereum' };
      updateNetworkUseCase.execute.mockResolvedValue(updatedNetwork);

      const result = await controller.updateNetwork(mockContext, mockNetwork.id, updateDto);

      expect(updateNetworkUseCase.execute).toHaveBeenCalledWith({
        ...mockContext,
        networkId: mockNetwork.id,
        data: {
          ...updateDto,
          otherRpcUrls: updateDto.otherRpcUrls,
        },
      });
      expect(result.name).toBe('Updated Ethereum');
    });

    it('should set empty array for otherRpcUrls when not provided', async () => {
      const updateDto: UpdateNetworkDto = { ...mockCreateDto, otherRpcUrls: undefined };
      updateNetworkUseCase.execute.mockResolvedValue(mockNetwork);

      await controller.updateNetwork(mockContext, mockNetwork.id, updateDto);

      expect(updateNetworkUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            otherRpcUrls: [],
          }),
        }),
      );
    });
  });

  describe('partialUpdateNetwork', () => {
    it('should partially update a network', async () => {
      const patchDto: PatchNetworkDto = { name: 'Partially Updated' };
      const updatedNetwork = { ...mockNetwork, name: 'Partially Updated' };
      partialUpdateNetworkUseCase.execute.mockResolvedValue(updatedNetwork);

      const result = await controller.partialUpdateNetwork(mockContext, mockNetwork.id, patchDto);

      expect(partialUpdateNetworkUseCase.execute).toHaveBeenCalledWith({
        ...mockContext,
        networkId: mockNetwork.id,
        data: patchDto,
      });
      expect(result.name).toBe('Partially Updated');
    });

    it('should update only provided fields', async () => {
      const patchDto: PatchNetworkDto = { feeMultiplier: 1.5 };
      const updatedNetwork = { ...mockNetwork, feeMultiplier: 1.5 };
      partialUpdateNetworkUseCase.execute.mockResolvedValue(updatedNetwork);

      const result = await controller.partialUpdateNetwork(mockContext, mockNetwork.id, patchDto);

      expect(result.feeMultiplier).toBe(1.5);
      expect(result.name).toBe(mockNetwork.name);
    });
  });

  describe('deleteNetwork', () => {
    it('should soft delete a network', async () => {
      deleteNetworkUseCase.execute.mockResolvedValue(undefined);

      await controller.deleteNetwork(mockContext, mockNetwork.id);

      expect(deleteNetworkUseCase.execute).toHaveBeenCalledWith({
        ...mockContext,
        networkId: mockNetwork.id,
      });
    });
  });
});
