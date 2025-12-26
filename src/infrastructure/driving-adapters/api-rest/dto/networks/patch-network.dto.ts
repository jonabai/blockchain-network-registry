import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsUrl,
  IsArray,
  IsOptional,
  MaxLength,
  Min,
  Matches,
  ArrayMaxSize,
} from 'class-validator';

export class PatchNetworkDto {
  @ApiPropertyOptional({ description: 'Unique blockchain chain ID', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  chainId?: number;

  @ApiPropertyOptional({ description: 'Network name', example: 'Ethereum Mainnet', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Primary RPC URL', example: 'https://mainnet.infura.io/v3/your-key' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  rpcUrl?: string;

  @ApiPropertyOptional({
    description: 'Alternative RPC URLs',
    example: ['https://eth-mainnet.g.alchemy.com/v2/your-key'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUrl({ require_protocol: true }, { each: true })
  @ArrayMaxSize(10)
  otherRpcUrls?: string[];

  @ApiPropertyOptional({ description: 'Whether this is a testnet', example: false })
  @IsOptional()
  @IsBoolean()
  testNet?: boolean;

  @ApiPropertyOptional({ description: 'Block explorer URL', example: 'https://etherscan.io' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  blockExplorerUrl?: string;

  @ApiPropertyOptional({ description: 'Fee multiplier for gas price', example: 1.0, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  feeMultiplier?: number;

  @ApiPropertyOptional({ description: 'Gas limit multiplier', example: 1.0, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  gasLimitMultiplier?: number;

  @ApiPropertyOptional({
    description: 'Default signer Ethereum address',
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD45',
  })
  @IsOptional()
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'defaultSignerAddress must be a valid Ethereum address (0x followed by 40 hex characters)',
  })
  defaultSignerAddress?: string;

  @ApiPropertyOptional({ description: 'Whether the network is active', example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
