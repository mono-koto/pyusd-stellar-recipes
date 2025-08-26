import { Networks } from '@stellar/stellar-sdk';
import { z } from 'zod';
import { config } from 'dotenv';

config();

export interface StellarConfig {
  network: string;
  networkPassphrase: string;
  horizonUrl: string;
  sorobanUrl: string;
}

export interface WalletConfig {
  privateKey: string;
  walletAddress: string;
}

export interface PyusdConfig {
  pyusdAssetCode: string;
  pyusdIssuer: string;
  pyusdSacContract: string;
}

export type Config = StellarConfig & WalletConfig & PyusdConfig;

const testnetConfig: StellarConfig = {
  network: 'testnet',
  networkPassphrase: Networks.TESTNET,
  horizonUrl: 'https://horizon-testnet.stellar.org',
  sorobanUrl: 'https://soroban-testnet.stellar.org',
};

const mainnetConfig: StellarConfig = {
  network: 'mainnet',
  networkPassphrase: Networks.PUBLIC,
  horizonUrl: 'https://horizon.stellar.org',
  sorobanUrl: 'https://soroban-mainnet.stellar.org',
};

const stellarConfigs = {
  testnet: testnetConfig,
  mainnet: mainnetConfig,
};

const envSchema = z.object({
  STELLAR_NETWORK: z
    .enum(['testnet', 'mainnet'])
    .default('testnet')
    .describe('Stellar network to use'),
  PRIVATE_KEY: z
    .string()
    .length(56, 'Must be exactly 56 characters')
    .startsWith('S', 'Must start with S')
    .describe('Stellar private key'),
  WALLET_ADDRESS: z
    .string()
    .length(56, 'Must be exactly 56 characters')
    .startsWith('G', 'Must start with G')
    .describe('Stellar public key address'),
  PYUSD_ASSET_CODE: z.string().default('PYUSD').describe('PYUSD asset code'),
  PYUSD_ISSUER: z
    .string()
    .length(56, 'Must be exactly 56 characters')
    .startsWith('G', 'Must start with G')
    .describe('PYUSD issuer public key'),
  PYUSD_SAC_CONTRACT: z
    .string()
    .length(56, 'Must be exactly 56 characters')
    .startsWith('C', 'Must start with C')
    .describe('PYUSD SAC contract address'),
});

export function loadConfig(): Config {
  try {
    const data = envSchema.parse(process.env);
    const network = data.STELLAR_NETWORK;

    return {
      ...stellarConfigs[network],
      privateKey: data.PRIVATE_KEY,
      walletAddress: data.WALLET_ADDRESS,
      pyusdAssetCode: data.PYUSD_ASSET_CODE,
      pyusdIssuer: data.PYUSD_ISSUER,
      pyusdSacContract: data.PYUSD_SAC_CONTRACT,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('\n❌ Environment variable validation failed:');
      console.error(z.prettifyError(error));
      console.error('\n💡 Make sure your .env file is configured correctly.\n');
    }
    throw error;
  }
}
