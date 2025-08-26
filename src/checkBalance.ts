#!/usr/bin/env tsx

import { loadConfig } from './utils/config.js';
import { StellarClient } from './utils/stellar.js';

async function main() {
  try {
    console.log('🔍 Checking PYUSD balance on Stellar...\n');
    
    // Load and validate configuration
    const config = loadConfig();
    
    console.log(`Network: ${config.network.toUpperCase()}`);
    console.log(`Account: ${config.walletAddress}`);
    console.log(`Asset: ${config.pyusdAssetCode}:${config.pyusdIssuer}\n`);
    
    // Initialize Stellar client
    const stellar = new StellarClient(config);
    
    // Check if trustline exists
    const hasTrustline = await stellar.hasPyusdTrustline();
    if (!hasTrustline) {
      console.log('❌ No PYUSD trustline found.');
      console.log('💡 Create a trustline first with: npm run create-trustline');
      return;
    }
    
    console.log('✅ PYUSD trustline found\n');
    
    // Method 1: Check balance using classic Stellar account query
    console.log('📊 Method 1: Classic Stellar Account Balance');
    try {
      const classicBalance = await stellar.getPyusdBalanceClassic();
      console.log(`   Balance: ${classicBalance} ${config.pyusdAssetCode}`);
    } catch (error) {
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    console.log();
    
    // Method 2: Check balance using SAC contract
    console.log('📊 Method 2: Stellar Asset Contract (SAC) Balance');
    try {
      const sacBalance = await stellar.getPyusdBalanceSAC();
      console.log(`   Balance: ${sacBalance} ${config.pyusdAssetCode}`);
      console.log(`   Contract: ${config.pyusdSacContract}`);
    } catch (error) {
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('   Note: SAC method requires the contract to be deployed');
    }
    
    console.log('\n✨ Balance check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('\n💡 Make sure your .env file is configured correctly.');
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}