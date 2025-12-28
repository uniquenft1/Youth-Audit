
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum Network {
  ETHEREUM = '1',
  POLYGON = '137',
  BSC = '56',
  ARBITRUM = '42161',
  OPTIMISM = '10',
  BASE = '8453',
  AVALANCHE = '43114',
  SOLANA = 'solana'
}

export interface NetworkConfig {
  id: Network;
  name: string;
  apiUrl: string;
  explorerUrl: string;
  color: string;
  shortName: string;
}

export interface SecurityAudit {
  contractPurpose: string;
  keyFeatures: string[];
  securityRisks: {
    canDrainWallets: { status: boolean; explanation: string };
    adminPowers: string[];
    isPausable: { status: boolean; explanation: string };
    isUpgradeable: { status: boolean; explanation: string };
    hiddenFees: { status: boolean; explanation: string };
  };
  riskLevel: RiskLevel;
  verdict: string;
}

export interface ContractInfo {
  address: string;
  name: string;
  sourceCode: string;
  isVerified: boolean;
  network: Network;
}

export interface UsageStats {
  scansToday: number;
  lastReset: string;
  isPro: boolean;
}
