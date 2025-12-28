
import { ContractInfo, Network, NetworkConfig } from '../types';

const STORAGE_KEY_PREFIX = 'youth_api_key_';

export const NETWORKS: Record<Network, NetworkConfig> = {
  [Network.ETHEREUM]: {
    id: Network.ETHEREUM,
    name: 'Ethereum',
    shortName: 'ETH',
    apiUrl: 'https://api.etherscan.io/v2/api',
    explorerUrl: 'https://etherscan.io',
    color: '#627EEA'
  },
  [Network.POLYGON]: {
    id: Network.POLYGON,
    name: 'Polygon',
    shortName: 'MATIC',
    apiUrl: 'https://api.polygonscan.com/api',
    explorerUrl: 'https://polygonscan.com',
    color: '#8247E5'
  },
  [Network.BSC]: {
    id: Network.BSC,
    name: 'BNB Chain',
    shortName: 'BSC',
    apiUrl: 'https://api.bscscan.com/api',
    explorerUrl: 'https://bscscan.com',
    color: '#F3BA2F'
  },
  [Network.ARBITRUM]: {
    id: Network.ARBITRUM,
    name: 'Arbitrum One',
    shortName: 'ARB',
    apiUrl: 'https://api.arbiscan.io/api',
    explorerUrl: 'https://arbiscan.io',
    color: '#28A0F0'
  },
  [Network.OPTIMISM]: {
    id: Network.OPTIMISM,
    name: 'Optimism',
    shortName: 'OP',
    apiUrl: 'https://api-optimistic.etherscan.io/api',
    explorerUrl: 'https://optimistic.etherscan.io',
    color: '#FF0420'
  },
  [Network.BASE]: {
    id: Network.BASE,
    name: 'Base',
    shortName: 'BASE',
    apiUrl: 'https://api.basescan.org/api',
    explorerUrl: 'https://basescan.org',
    color: '#0052FF'
  },
  [Network.AVALANCHE]: {
    id: Network.AVALANCHE,
    name: 'Avalanche',
    shortName: 'AVAX',
    apiUrl: 'https://api.snowtrace.io/api',
    explorerUrl: 'https://snowtrace.io',
    color: '#E84142'
  },
  [Network.SOLANA]: {
    id: Network.SOLANA,
    name: 'Solana',
    shortName: 'SOL',
    apiUrl: 'https://pro-api.solscan.io/v1',
    explorerUrl: 'https://solscan.io',
    color: '#14F195'
  }
};

export const etherscanService = {
  setApiKey: (network: Network, key: string) => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${network}`, key);
  },

  getApiKey: (network: Network): string => {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}${network}`) || '';
  },

  isValidAddress: (address: string, network: Network): boolean => {
    if (network === Network.SOLANA) {
      // Solana Base58 address validation (32-44 chars)
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    }
    // Standard EVM 0x address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },

  fetchSourceCode: async (address: string, network: Network): Promise<ContractInfo> => {
    const config = NETWORKS[network];
    const apiKey = etherscanService.getApiKey(network);
    
    if (!apiKey) {
      throw new Error(`MISSING_API_KEY: Authentication failed. Please configure your ${config.name} API Key in the settings panel.`);
    }

    if (network === Network.SOLANA) {
       const url = `${config.apiUrl}/program/source?address=${address}`;
       try {
         const response = await fetch(url, { 
           headers: { 'token': apiKey },
           signal: AbortSignal.timeout(10000) // 10s timeout
         });
         
         if (response.status === 401 || response.status === 403) {
            throw new Error(`INVALID_API_KEY: The ${config.name} key provided is unauthorized or expired. Please verify it in your Solscan dashboard.`);
         }

         const data = await response.json();
         
         if (data.success && data.data) {
           if (!data.data.source) {
             throw new Error(`NOT_VERIFIED: This Solana program is not verified. Youth requires verified source code for security analysis.`);
           }
           return {
             address,
             name: data.data.programName || 'Solana Program',
             sourceCode: data.data.source || '',
             isVerified: true,
             network
           };
         }
         throw new Error(`NOT_FOUND: Solana program source not found for address ${address}.`);
       } catch (error: any) {
         if (error.name === 'TimeoutError') {
           throw new Error(`NETWORK_TIMEOUT: ${config.name} indexer is taking too long to respond. Please try again.`);
         }
         if (error.message.includes('API_KEY')) throw error;
         throw new Error(`NETWORK_ERROR: Communication with ${config.name} failed. Check your connection.`);
       }
    }

    // EVM Fetching logic
    const isEtherscanV2 = config.apiUrl.includes('etherscan.io/v2');
    const url = isEtherscanV2 
      ? `${config.apiUrl}?chainid=${network}&module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`
      : `${config.apiUrl}?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;
    
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const data = await response.json();

      if (data.status === '1' && Array.isArray(data.result) && data.result[0]) {
        const result = data.result[0];
        
        if (!result.SourceCode || result.SourceCode === '') {
          throw new Error(`NOT_VERIFIED: Source code for ${address} is not verified on ${config.name}. Youth cannot audit unverified bytecode.`);
        }

        return {
          address,
          name: result.ContractName || 'Unknown Contract',
          sourceCode: result.SourceCode,
          isVerified: true,
          network
        };
      } else {
        const resultText = typeof data.result === 'string' ? data.result : '';
        const errorMessage = resultText || (data.message || '');

        if (errorMessage.toLowerCase().includes('invalid api key')) {
           throw new Error(`INVALID_API_KEY: Your ${config.name} API Key was rejected. Please update it in settings with a valid key from your ${config.shortName}scan account.`);
        }
        
        if (errorMessage.toLowerCase().includes('rate limit')) {
           throw new Error(`RATE_LIMIT: Too many requests to ${config.name}. Please wait a moment or upgrade your API key plan.`);
        }

        throw new Error(`INDEXER_ERROR: ${config.name} returned an error: ${errorMessage}`);
      }
    } catch (error: any) {
      if (error.name === 'TimeoutError') {
        throw new Error(`NETWORK_TIMEOUT: ${config.name} indexer connection timed out.`);
      }
      if (error.message.includes('API_KEY') || error.message.includes('NOT_VERIFIED') || error.message.includes('RATE_LIMIT')) {
        throw error;
      }
      console.error(`${config.name} Fetch Error:`, error);
      throw new Error(`NETWORK_ERROR: Unable to communicate with ${config.name} infrastructure.`);
    }
  }
};
