import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateNetworkDto } from './create-network.dto';

describe('CreateNetworkDto', () => {
  const validDto = {
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

  it('should pass validation with valid data', async () => {
    const dto = plainToInstance(CreateNetworkDto, validDto);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  describe('chainId validation', () => {
    it('should fail when chainId is missing', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, chainId: undefined });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'chainId')).toBe(true);
    });

    it('should fail when chainId is negative', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, chainId: -1 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'chainId')).toBe(true);
    });

    it('should fail when chainId is zero', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, chainId: 0 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'chainId')).toBe(true);
    });

    it('should fail when chainId is not a number', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, chainId: 'not-a-number' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'chainId')).toBe(true);
    });
  });

  describe('name validation', () => {
    it('should fail when name is missing', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, name: undefined });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('should fail when name exceeds 100 characters', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, name: 'a'.repeat(101) });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('should pass with 100 character name', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, name: 'a'.repeat(100) });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(false);
    });
  });

  describe('rpcUrl validation', () => {
    it('should fail when rpcUrl is missing', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, rpcUrl: undefined });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'rpcUrl')).toBe(true);
    });

    it('should fail when rpcUrl is not a valid URL', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, rpcUrl: 'not-a-url' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'rpcUrl')).toBe(true);
    });

    it('should fail when rpcUrl has no protocol', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, rpcUrl: 'mainnet.infura.io' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'rpcUrl')).toBe(true);
    });
  });

  describe('otherRpcUrls validation', () => {
    it('should pass when otherRpcUrls is not provided', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, otherRpcUrls: undefined });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'otherRpcUrls')).toBe(false);
    });

    it('should pass with empty array', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, otherRpcUrls: [] });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'otherRpcUrls')).toBe(false);
    });

    it('should fail when otherRpcUrls contains invalid URL', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, otherRpcUrls: ['not-a-url'] });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'otherRpcUrls')).toBe(true);
    });

    it('should fail when otherRpcUrls exceeds 10 items', async () => {
      const urls = Array(11).fill('https://example.com');
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, otherRpcUrls: urls });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'otherRpcUrls')).toBe(true);
    });
  });

  describe('testNet validation', () => {
    it('should fail when testNet is missing', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, testNet: undefined });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'testNet')).toBe(true);
    });

    it('should fail when testNet is not a boolean', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, testNet: 'true' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'testNet')).toBe(true);
    });
  });

  describe('blockExplorerUrl validation', () => {
    it('should fail when blockExplorerUrl is missing', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, blockExplorerUrl: undefined });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'blockExplorerUrl')).toBe(true);
    });

    it('should fail when blockExplorerUrl is not a valid URL', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, blockExplorerUrl: 'not-a-url' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'blockExplorerUrl')).toBe(true);
    });
  });

  describe('feeMultiplier validation', () => {
    it('should fail when feeMultiplier is missing', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, feeMultiplier: undefined });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'feeMultiplier')).toBe(true);
    });

    it('should fail when feeMultiplier is negative', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, feeMultiplier: -1 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'feeMultiplier')).toBe(true);
    });

    it('should pass with feeMultiplier of 0', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, feeMultiplier: 0 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'feeMultiplier')).toBe(false);
    });
  });

  describe('gasLimitMultiplier validation', () => {
    it('should fail when gasLimitMultiplier is missing', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, gasLimitMultiplier: undefined });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'gasLimitMultiplier')).toBe(true);
    });

    it('should fail when gasLimitMultiplier is negative', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, gasLimitMultiplier: -0.5 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'gasLimitMultiplier')).toBe(true);
    });
  });

  describe('defaultSignerAddress validation', () => {
    it('should fail when defaultSignerAddress is missing', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, defaultSignerAddress: undefined });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'defaultSignerAddress')).toBe(true);
    });

    it('should fail when defaultSignerAddress is not a valid Ethereum address', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, defaultSignerAddress: 'not-an-address' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'defaultSignerAddress')).toBe(true);
    });

    it('should fail when defaultSignerAddress is too short', async () => {
      const dto = plainToInstance(CreateNetworkDto, { ...validDto, defaultSignerAddress: '0x742d35Cc6634C0532925a3b844Bc' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'defaultSignerAddress')).toBe(true);
    });

    it('should fail when defaultSignerAddress is too long', async () => {
      const dto = plainToInstance(CreateNetworkDto, {
        ...validDto,
        defaultSignerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD45extra',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'defaultSignerAddress')).toBe(true);
    });

    it('should fail when defaultSignerAddress has invalid characters', async () => {
      const dto = plainToInstance(CreateNetworkDto, {
        ...validDto,
        defaultSignerAddress: '0xGGGd35Cc6634C0532925a3b844Bc9e7595f2bD45',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'defaultSignerAddress')).toBe(true);
    });

    it('should pass with valid lowercase Ethereum address', async () => {
      const dto = plainToInstance(CreateNetworkDto, {
        ...validDto,
        defaultSignerAddress: '0x742d35cc6634c0532925a3b844bc9e7595f2bd45',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'defaultSignerAddress')).toBe(false);
    });

    it('should pass with valid uppercase Ethereum address', async () => {
      const dto = plainToInstance(CreateNetworkDto, {
        ...validDto,
        defaultSignerAddress: '0x742D35CC6634C0532925A3B844BC9E7595F2BD45',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'defaultSignerAddress')).toBe(false);
    });
  });
});
