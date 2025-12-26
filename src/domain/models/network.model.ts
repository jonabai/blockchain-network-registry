export interface Network {
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
  createdAt: Date;
  updatedAt: Date;
}

export type CreateNetworkData = Omit<Network, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateNetworkData = Partial<Omit<Network, 'id' | 'createdAt' | 'updatedAt'>>;
