import { Network } from './network.model';

export enum NetworkEventType {
  NETWORK_CREATED = 'NETWORK_CREATED',
  NETWORK_UPDATED = 'NETWORK_UPDATED',
  NETWORK_DELETED = 'NETWORK_DELETED',
}

export interface NetworkEventData {
  id: string;
  chainId: number;
  name: string;
  rpcUrl: string;
  otherRpcUrls: string[];
  testNet: boolean;
  blockExplorerUrl: string;
  feeMultiplier: number;
  gasLimitMultiplier: number;
  active: boolean;
  defaultSignerAddress: string;
}

export interface NetworkEvent {
  eventType: NetworkEventType;
  timestamp: string;
  correlationId: string;
  data: NetworkEventData;
}

export function networkToEventData(network: Network): NetworkEventData {
  return {
    id: network.id,
    chainId: network.chainId,
    name: network.name,
    rpcUrl: network.rpcUrl,
    otherRpcUrls: network.otherRpcUrls,
    testNet: network.testNet,
    blockExplorerUrl: network.blockExplorerUrl,
    feeMultiplier: network.feeMultiplier,
    gasLimitMultiplier: network.gasLimitMultiplier,
    active: network.active,
    defaultSignerAddress: network.defaultSignerAddress,
  };
}
