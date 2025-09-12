#!/usr/bin/env tsx

import { loadConfig } from './utils/config.js';
import { StellarClient } from './utils/stellar.js';

async function main() {
  try {
    console.log('💸 Sending PYUSD on Stellar...\n');
    
    // Get command line arguments
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log('Usage: npm run send-pyusd <destination_address> <amount> [memo]');
      console.log('Example: npm run send-pyusd GDKW...EXAMPLE 10.5000000 "Payment for services"');
      process.exit(1);
    }
    
    const destinationAddress = args[0]!;
    const amount = args[1]!;
    const memo = args[2];
    
    // Validate inputs
    if (!destinationAddress || !destinationAddress.startsWith('G') || destinationAddress.length !== 56) {
      throw new Error('Invalid destination address format');
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      throw new Error('Invalid amount');
    }
    
    // Load and validate configuration
    const config = loadConfig();
    
    console.log(`Network: ${config.network.toUpperCase()}`);
    console.log(`From: ${config.walletAddress}`);
    console.log(`To: ${destinationAddress}`);
    console.log(`Amount: ${amount} ${config.pyusdAssetCode}`);
    if (memo) {
      console.log(`Memo: "${memo}"`);
    }
    console.log();
    
    // Initialize Stellar client
    const stellar = new StellarClient(config);
    
    // Check sender balance first
    console.log('🔍 Checking sender balance...');
    const senderBalance = await stellar.getPyusdBalanceClassic();
    console.log(`Current balance: ${senderBalance} ${config.pyusdAssetCode}`);
    
    if (parseFloat(senderBalance) < parseFloat(amount)) {
      throw new Error(`Insufficient balance. Have ${senderBalance}, need ${amount}`);
    }
    
    console.log();
    
    // Method 1: Send using classic Stellar payment
    console.log('🚀 Method 1: Classic Stellar Payment');
    try {
      const txHash1 = await stellar.sendPyusdClassic(destinationAddress, amount, memo);
      console.log(`   ✅ Transaction successful!`);
      console.log(`   📋 Hash: ${txHash1}`);
      console.log(`   🔗 Explorer: https://stellar.expert/explorer/${config.network}/tx/${txHash1}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // If classic method fails, try SAC method
      console.log('\n🚀 Method 2: Stellar Asset Contract (SAC) Transfer');
      try {
        const txHash2 = await stellar.sendPyusdSAC(destinationAddress, amount);
        console.log(`   ✅ Transaction successful!`);
        console.log(`   📋 Hash: ${txHash2}`);
        console.log(`   🔗 Explorer: https://stellar.expert/explorer/${config.network}/tx/${txHash2}`);
        console.log(`   📄 Contract: ${config.pyusdSacContract}`);
      } catch (sacError) {
        console.log(`   ❌ SAC Error: ${sacError instanceof Error ? sacError.message : 'Unknown error'}`);
        throw new Error('Both payment methods failed');
      }
    }
    
    console.log('\n✨ Payment complete!');
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('\n💡 Make sure:');
    console.error('   - Your .env file is configured correctly');
    console.error('   - You have sufficient PYUSD balance');
    console.error('   - The destination address is valid');
    console.error('   - You have XLM for transaction fees');
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}