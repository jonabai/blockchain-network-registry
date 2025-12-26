import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateNetworkDto {
  @ApiProperty({ description: 'Unique blockchain chain ID', example: 1 })
  @IsNumber()
  @Min(1)
  chainId: number;

  @ApiProperty({ description: 'Network name', example: 'Ethereum Mainnet', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Primary RPC URL', example: 'https://mainnet.infura.io/v3/your-key' })
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  rpcUrl: string;

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

  @ApiProperty({ description: 'Whether this is a testnet', example: false })
  @IsBoolean()
  testNet: boolean;

  @ApiProperty({ description: 'Block explorer URL', example: 'https://etherscan.io' })
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  blockExplorerUrl: string;

  @ApiProperty({ description: 'Fee multiplier for gas price', example: 1.0, minimum: 0 })
  @IsNumber()
  @Min(0)
  feeMultiplier: number;

  @ApiProperty({ description: 'Gas limit multiplier', example: 1.0, minimum: 0 })
  @IsNumber()
  @Min(0)
  gasLimitMultiplier: number;

  @ApiProperty({
    description: 'Default signer Ethereum address',
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD45',
  })
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'defaultSignerAddress must be a valid Ethereum address (0x followed by 40 hex characters)',
  })
  defaultSignerAddress: string;
}
