import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PatchNetworkDto } from './patch-network.dto';

describe('PatchNetworkDto', () => {
  it('should pass validation with empty object (all fields optional)', async () => {
    const dto = plainToInstance(PatchNetworkDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass validation with all valid fields', async () => {
    const dto = plainToInstance(PatchNetworkDto, {
      chainId: 1,
      name: 'Ethereum Mainnet',
      rpcUrl: 'https://mainnet.infura.io/v3/your-key',
      otherRpcUrls: ['https://eth-mainnet.g.alchemy.com/v2/your-key'],
      testNet: false,
      blockExplorerUrl: 'https://etherscan.io',
      feeMultiplier: 1.0,
      gasLimitMultiplier: 1.0,
      defaultSignerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD45',
      active: true,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  describe('chainId validation', () => {
    it('should pass when chainId is a positive number', async () => {
      const dto = plainToInstance(PatchNetworkDto, { chainId: 137 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'chainId')).toBe(false);
    });

    it('should fail when chainId is negative', async () => {
      const dto = plainToInstance(PatchNetworkDto, { chainId: -1 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'chainId')).toBe(true);
    });

    it('should fail when chainId is zero', async () => {
      const dto = plainToInstance(PatchNetworkDto, { chainId: 0 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'chainId')).toBe(true);
    });

    it('should fail when chainId is not a number', async () => {
      const dto = plainToInstance(PatchNetworkDto, { chainId: 'not-a-number' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'chainId')).toBe(true);
    });
  });

  describe('name validation', () => {
    it('should pass with valid name', async () => {
      const dto = plainToInstance(PatchNetworkDto, { name: 'Valid Name' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(false);
    });

    it('should fail when name exceeds 100 characters', async () => {
      const dto = plainToInstance(PatchNetworkDto, { name: 'a'.repeat(101) });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('should pass with 100 character name', async () => {
      const dto = plainToInstance(PatchNetworkDto, { name: 'a'.repeat(100) });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(false);
    });
  });

  describe('rpcUrl validation', () => {
    it('should pass with valid URL', async () => {
      const dto = plainToInstance(PatchNetworkDto, { rpcUrl: 'https://example.com' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'rpcUrl')).toBe(false);
    });

    it('should fail when rpcUrl is not a valid URL', async () => {
      const dto = plainToInstance(PatchNetworkDto, { rpcUrl: 'not-a-url' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'rpcUrl')).toBe(true);
    });

    it('should fail when rpcUrl has no protocol', async () => {
      const dto = plainToInstance(PatchNetworkDto, { rpcUrl: 'example.com' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'rpcUrl')).toBe(true);
    });
  });

  describe('otherRpcUrls validation', () => {
    it('should pass with empty array', async () => {
      const dto = plainToInstance(PatchNetworkDto, { otherRpcUrls: [] });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'otherRpcUrls')).toBe(false);
    });

    it('should pass with valid URLs', async () => {
      const dto = plainToInstance(PatchNetworkDto, {
        otherRpcUrls: ['https://example1.com', 'https://example2.com'],
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'otherRpcUrls')).toBe(false);
    });

    it('should fail when otherRpcUrls contains invalid URL', async () => {
      const dto = plainToInstance(PatchNetworkDto, { otherRpcUrls: ['not-a-url'] });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'otherRpcUrls')).toBe(true);
    });

    it('should fail when otherRpcUrls exceeds 10 items', async () => {
      const urls = Array(11).fill('https://example.com');
      const dto = plainToInstance(PatchNetworkDto, { otherRpcUrls: urls });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'otherRpcUrls')).toBe(true);
    });
  });

  describe('testNet validation', () => {
    it('should pass with boolean value', async () => {
      const dto = plainToInstance(PatchNetworkDto, { testNet: true });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'testNet')).toBe(false);
    });

    it('should fail when testNet is not a boolean', async () => {
      const dto = plainToInstance(PatchNetworkDto, { testNet: 'true' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'testNet')).toBe(true);
    });
  });

  describe('blockExplorerUrl validation', () => {
    it('should pass with valid URL', async () => {
      const dto = plainToInstance(PatchNetworkDto, { blockExplorerUrl: 'https://etherscan.io' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'blockExplorerUrl')).toBe(false);
    });

    it('should fail when blockExplorerUrl is not a valid URL', async () => {
      const dto = plainToInstance(PatchNetworkDto, { blockExplorerUrl: 'not-a-url' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'blockExplorerUrl')).toBe(true);
    });
  });

  describe('feeMultiplier validation', () => {
    it('should pass with valid number', async () => {
      const dto = plainToInstance(PatchNetworkDto, { feeMultiplier: 1.5 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'feeMultiplier')).toBe(false);
    });

    it('should pass with zero', async () => {
      const dto = plainToInstance(PatchNetworkDto, { feeMultiplier: 0 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'feeMultiplier')).toBe(false);
    });

    it('should fail when feeMultiplier is negative', async () => {
      const dto = plainToInstance(PatchNetworkDto, { feeMultiplier: -1 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'feeMultiplier')).toBe(true);
    });
  });

  describe('gasLimitMultiplier validation', () => {
    it('should pass with valid number', async () => {
      const dto = plainToInstance(PatchNetworkDto, { gasLimitMultiplier: 1.2 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'gasLimitMultiplier')).toBe(false);
    });

    it('should fail when gasLimitMultiplier is negative', async () => {
      const dto = plainToInstance(PatchNetworkDto, { gasLimitMultiplier: -0.5 });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'gasLimitMultiplier')).toBe(true);
    });
  });

  describe('defaultSignerAddress validation', () => {
    it('should pass with valid Ethereum address', async () => {
      const dto = plainToInstance(PatchNetworkDto, {
        defaultSignerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD45',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'defaultSignerAddress')).toBe(false);
    });

    it('should fail when defaultSignerAddress is not a valid Ethereum address', async () => {
      const dto = plainToInstance(PatchNetworkDto, { defaultSignerAddress: 'not-an-address' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'defaultSignerAddress')).toBe(true);
    });

    it('should fail when defaultSignerAddress is too short', async () => {
      const dto = plainToInstance(PatchNetworkDto, { defaultSignerAddress: '0x742d35Cc6634' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'defaultSignerAddress')).toBe(true);
    });

    it('should fail when defaultSignerAddress has invalid characters', async () => {
      const dto = plainToInstance(PatchNetworkDto, {
        defaultSignerAddress: '0xGGGd35Cc6634C0532925a3b844Bc9e7595f2bD45',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'defaultSignerAddress')).toBe(true);
    });
  });

  describe('active validation', () => {
    it('should pass with boolean value', async () => {
      const dto = plainToInstance(PatchNetworkDto, { active: false });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'active')).toBe(false);
    });

    it('should fail when active is not a boolean', async () => {
      const dto = plainToInstance(PatchNetworkDto, { active: 'false' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'active')).toBe(true);
    });
  });
});
