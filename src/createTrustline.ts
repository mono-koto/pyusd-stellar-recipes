#!/usr/bin/env tsx

import { loadConfig } from './utils/config.js';
import { StellarClient } from './utils/stellar.js';

async function main() {
  try {
    console.log('🤝 Creating PYUSD trustline on Stellar...\n');
    
    // Load and validate configuration
    const config = loadConfig();
    
    console.log(`Network: ${config.network.toUpperCase()}`);
    console.log(`Account: ${config.walletAddress}`);
    console.log(`Asset: ${config.pyusdAssetCode}:${config.pyusdIssuer}\n`);
    
    // Initialize Stellar client
    const stellar = new StellarClient(config);
    
    // Check if trustline already exists
    console.log('🔍 Checking existing trustlines...');
    const hasTrustline = await stellar.hasPyusdTrustline();
    
    if (hasTrustline) {
      console.log('✅ PYUSD trustline already exists!');
      console.log('💡 You can now check your balance with: npm run check-balance');
      return;
    }
    
    console.log('❌ No PYUSD trustline found');
    console.log('📝 Creating trustline...\n');
    
    // Create the trustline
    const txHash = await stellar.createPyusdTrustline();
    
    console.log('✅ Trustline created successfully!');
    console.log(`📋 Transaction Hash: ${txHash}`);
    console.log(`🔗 Explorer: https://stellar.expert/explorer/${config.network}/tx/${txHash}\n`);
    
    console.log('✨ Next steps:');
    console.log('   1. Wait for transaction confirmation (usually ~5 seconds)');
    console.log('   2. Get testnet PYUSD from a faucet (if on testnet)');
    console.log('   3. Check your balance: npm run check-balance');
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('\n💡 Common issues:');
    console.error('   - Make sure your .env file is configured correctly');
    console.error('   - Ensure your account has XLM for transaction fees (~0.5 XLM minimum)');
    console.error('   - Verify your account is funded on the correct network');
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}