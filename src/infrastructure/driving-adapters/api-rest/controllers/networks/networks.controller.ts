import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CreateNetworkUseCase } from '@application/use-cases/networks/create-network/create-network.use-case';
import { GetNetworkByIdUseCase } from '@application/use-cases/networks/get-network-by-id/get-network-by-id.use-case';
import { GetActiveNetworksUseCase } from '@application/use-cases/networks/get-active-networks/get-active-networks.use-case';
import { UpdateNetworkUseCase } from '@application/use-cases/networks/update-network/update-network.use-case';
import { PartialUpdateNetworkUseCase } from '@application/use-cases/networks/partial-update-network/partial-update-network.use-case';
import { DeleteNetworkUseCase } from '@application/use-cases/networks/delete-network/delete-network.use-case';
import { CreateNetworkDto, UpdateNetworkDto, PatchNetworkDto, NetworkResponseDto } from '../../dto/networks';
import { RequestContext } from '../../decorators/request-context.decorator';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AuthenticatedRequestContext } from '../../../../../request-context.interface';

@ApiTags('Networks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('networks')
export class NetworksController {
  constructor(
    private readonly createNetworkUseCase: CreateNetworkUseCase,
    private readonly getNetworkByIdUseCase: GetNetworkByIdUseCase,
    private readonly getActiveNetworksUseCase: GetActiveNetworksUseCase,
    private readonly updateNetworkUseCase: UpdateNetworkUseCase,
    private readonly partialUpdateNetworkUseCase: PartialUpdateNetworkUseCase,
    private readonly deleteNetworkUseCase: DeleteNetworkUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new blockchain network' })
  @ApiResponse({ status: 201, description: 'Network created successfully', type: NetworkResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Network with this chainId already exists' })
  async createNetwork(
    @RequestContext() context: AuthenticatedRequestContext,
    @Body() createDto: CreateNetworkDto,
  ): Promise<NetworkResponseDto> {
    const network = await this.createNetworkUseCase.execute({
      ...context,
      data: {
        ...createDto,
        otherRpcUrls: createDto.otherRpcUrls || [],
        active: true,
      },
    });
    return NetworkResponseDto.fromDomain(network);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all active blockchain networks' })
  @ApiResponse({ status: 200, description: 'List of active networks', type: [NetworkResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getActiveNetworks(@RequestContext() context: AuthenticatedRequestContext): Promise<NetworkResponseDto[]> {
    const networks = await this.getActiveNetworksUseCase.execute(context);
    return networks.map((network) => NetworkResponseDto.fromDomain(network));
  }

  @Get(':networkId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a blockchain network by ID' })
  @ApiParam({ name: 'networkId', description: 'Network UUID', type: String })
  @ApiResponse({ status: 200, description: 'Network found', type: NetworkResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Network not found' })
  async getNetworkById(
    @RequestContext() context: AuthenticatedRequestContext,
    @Param('networkId', new ParseUUIDPipe()) networkId: string,
  ): Promise<NetworkResponseDto> {
    const network = await this.getNetworkByIdUseCase.execute({
      ...context,
      networkId,
    });
    return NetworkResponseDto.fromDomain(network);
  }

  @Put(':networkId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Full update of a blockchain network' })
  @ApiParam({ name: 'networkId', description: 'Network UUID', type: String })
  @ApiResponse({ status: 200, description: 'Network updated successfully', type: NetworkResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Network not found' })
  @ApiResponse({ status: 409, description: 'Network with this chainId already exists' })
  async updateNetwork(
    @RequestContext() context: AuthenticatedRequestContext,
    @Param('networkId', new ParseUUIDPipe()) networkId: string,
    @Body() updateDto: UpdateNetworkDto,
  ): Promise<NetworkResponseDto> {
    const network = await this.updateNetworkUseCase.execute({
      ...context,
      networkId,
      data: {
        ...updateDto,
        otherRpcUrls: updateDto.otherRpcUrls || [],
      },
    });
    return NetworkResponseDto.fromDomain(network);
  }

  @Patch(':networkId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Partial update of a blockchain network' })
  @ApiParam({ name: 'networkId', description: 'Network UUID', type: String })
  @ApiResponse({ status: 200, description: 'Network updated successfully', type: NetworkResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Network not found' })
  @ApiResponse({ status: 409, description: 'Network with this chainId already exists' })
  async partialUpdateNetwork(
    @RequestContext() context: AuthenticatedRequestContext,
    @Param('networkId', new ParseUUIDPipe()) networkId: string,
    @Body() patchDto: PatchNetworkDto,
  ): Promise<NetworkResponseDto> {
    const network = await this.partialUpdateNetworkUseCase.execute({
      ...context,
      networkId,
      data: patchDto,
    });
    return NetworkResponseDto.fromDomain(network);
  }

  @Delete(':networkId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a blockchain network (sets active to false)' })
  @ApiParam({ name: 'networkId', description: 'Network UUID', type: String })
  @ApiResponse({ status: 204, description: 'Network deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Network not found' })
  async deleteNetwork(
    @RequestContext() context: AuthenticatedRequestContext,
    @Param('networkId', new ParseUUIDPipe()) networkId: string,
  ): Promise<void> {
    await this.deleteNetworkUseCase.execute({
      ...context,
      networkId,
    });
  }
}
