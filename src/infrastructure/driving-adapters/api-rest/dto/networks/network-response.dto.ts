import { ApiProperty } from '@nestjs/swagger';
import { Network } from '@domain/models/network.model';

export class NetworkResponseDto {
  @ApiProperty({ description: 'Network UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Unique blockchain chain ID', example: 1 })
  chainId: number;

  @ApiProperty({ description: 'Network name', example: 'Ethereum Mainnet' })
  name: string;

  @ApiProperty({ description: 'Primary RPC URL', example: 'https://mainnet.infura.io/v3/your-key' })
  rpcUrl: string;

  @ApiProperty({
    description: 'Alternative RPC URLs',
    example: ['https://eth-mainnet.g.alchemy.com/v2/your-key'],
    type: [String],
  })
  otherRpcUrls: string[];

  @ApiProperty({ description: 'Whether this is a testnet', example: false })
  testNet: boolean;

  @ApiProperty({ description: 'Block explorer URL', example: 'https://etherscan.io' })
  blockExplorerUrl: string;

  @ApiProperty({ description: 'Fee multiplier for gas price', example: 1.0 })
  feeMultiplier: number;

  @ApiProperty({ description: 'Gas limit multiplier', example: 1.0 })
  gasLimitMultiplier: number;

  @ApiProperty({ description: 'Whether the network is active', example: true })
  active: boolean;

  @ApiProperty({
    description: 'Default signer Ethereum address',
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD45',
  })
  defaultSignerAddress: string;

  @ApiProperty({ description: 'Creation timestamp', example: '2024-12-26T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', example: '2024-12-26T10:00:00.000Z' })
  updatedAt: Date;

  static fromDomain(network: Network): NetworkResponseDto {
    const dto = new NetworkResponseDto();
    dto.id = network.id;
    dto.chainId = network.chainId;
    dto.name = network.name;
    dto.rpcUrl = network.rpcUrl;
    dto.otherRpcUrls = network.otherRpcUrls;
    dto.testNet = network.testNet;
    dto.blockExplorerUrl = network.blockExplorerUrl;
    dto.feeMultiplier = network.feeMultiplier;
    dto.gasLimitMultiplier = network.gasLimitMultiplier;
    dto.active = network.active;
    dto.defaultSignerAddress = network.defaultSignerAddress;
    dto.createdAt = network.createdAt;
    dto.updatedAt = network.updatedAt;
    return dto;
  }
}
