import {
  Keypair,
  Horizon,
  Asset,
  TransactionBuilder,
  Operation,
  BASE_FEE,
  Memo,
  Contract,
  rpc,
  scValToNative,
  nativeToScVal,
  Address,
} from '@stellar/stellar-sdk';
import { Config } from './config.js';

export class StellarClient {
  private horizonServer: Horizon.Server;
  private sorobanServer: rpc.Server;
  private keypair: Keypair;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.horizonServer = new Horizon.Server(config.horizonUrl);
    this.sorobanServer = new rpc.Server(config.sorobanUrl);
    this.keypair = Keypair.fromSecret(config.privateKey);
  }

  /**
   * Get PYUSD balance using classic Stellar account balance
   */
  async getPyusdBalanceClassic(): Promise<string> {
    try {
      const account = await this.horizonServer.loadAccount(
        this.config.walletAddress
      );

      // Find PYUSD balance in account balances
      const pyusdBalance = account.balances.find(
        (balance) =>
          'asset_code' in balance &&
          'asset_issuer' in balance &&
          balance.asset_code === this.config.pyusdAssetCode &&
          balance.asset_issuer === this.config.pyusdIssuer
      );

      return pyusdBalance ? pyusdBalance.balance : '0';
    } catch (error) {
      if (error instanceof Error) {
        // Handle common network errors
        if (error.message.includes('Request failed with status code 404')) {
          throw new Error(
            `Account not found. Make sure the account is funded and exists on ${this.config.network}`
          );
        }
        if (
          error.message.includes('ENOTFOUND') ||
          error.message.includes('ECONNREFUSED')
        ) {
          throw new Error(
            `Network error: Cannot connect to Horizon server at ${this.config.horizonUrl}`
          );
        }
        throw new Error(`Failed to get classic balance: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get PYUSD balance using SAC contract
   */
  async getPyusdBalanceSAC(): Promise<string> {
    try {
      const contract = new Contract(this.config.pyusdSacContract);
      const account = await this.horizonServer.loadAccount(
        this.keypair.publicKey()
      );

      // Build the transaction to call the balance function
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: this.config.networkPassphrase,
      })
        .addOperation(
          contract.call(
            'balance',
            Address.fromString(this.config.walletAddress).toScVal()
          )
        )
        .setTimeout(30)
        .build();

      // Simulate the transaction using Soroban RPC
      const response =
        await this.sorobanServer.simulateTransaction(transaction);

      if (rpc.Api.isSimulationSuccess(response)) {
        if (response.result?.retval) {
          // Use scValToNative to convert, it handles i128 properly
          const balance = scValToNative(response.result.retval);
          // Convert from stroops to PYUSD (7 decimals)
          return (Number(balance) / 10000000).toFixed(7);
        }
      }

      // Enhanced error reporting for SAC failures
      if (rpc.Api.isSimulationError(response)) {
        const error = response.error;
        throw new Error(`SAC simulation failed: ${error}`);
      }
      throw new Error('SAC balance call failed - no result returned');
    } catch (error) {
      if (error instanceof Error) {
        // Handle common Soroban errors
        if (
          error.message.includes('ENOTFOUND') ||
          error.message.includes('ECONNREFUSED')
        ) {
          throw new Error(
            `Network error: Cannot connect to Soroban RPC server`
          );
        }
        if (error.message.includes('Contract not found')) {
          throw new Error(
            `SAC contract not found: ${this.config.pyusdSacContract}`
          );
        }
        throw new Error(`Failed to get SAC balance: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Send PYUSD using classic Stellar payment operation
   */
  async sendPyusdClassic(
    destinationAddress: string,
    amount: string,
    memo?: string
  ): Promise<string> {
    try {
      const account = await this.horizonServer.loadAccount(
        this.keypair.publicKey()
      );
      const pyusdAsset = new Asset(
        this.config.pyusdAssetCode,
        this.config.pyusdIssuer
      );

      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: this.config.networkPassphrase,
      }).addOperation(
        Operation.payment({
          destination: destinationAddress,
          asset: pyusdAsset,
          amount: amount,
        })
      );

      // Add memo if provided
      if (memo) {
        transaction.addMemo(Memo.text(memo));
      }

      const builtTransaction = transaction.setTimeout(30).build();

      // Sign and submit
      builtTransaction.sign(this.keypair);
      const response =
        await this.horizonServer.submitTransaction(builtTransaction);

      return response.hash;
    } catch (error) {
      if (error instanceof Error) {
        // Handle common transaction errors
        if (error.message.includes('insufficient balance')) {
          throw new Error(
            `Insufficient balance. Check your XLM and PYUSD balances.`
          );
        }
        if (error.message.includes('op_no_trust')) {
          throw new Error(
            `Destination account has no PYUSD trustline. They need to create one first.`
          );
        }
        if (error.message.includes('op_underfunded')) {
          throw new Error(`Insufficient PYUSD balance for this transaction.`);
        }
        if (error.message.includes('tx_bad_seq')) {
          throw new Error(`Transaction sequence error. Please retry.`);
        }
        throw new Error(`Failed to send PYUSD (classic): ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Send PYUSD using SAC contract transfer
   */
  async sendPyusdSAC(
    destinationAddress: string,
    amount: string
  ): Promise<string> {
    try {
      const contract = new Contract(this.config.pyusdSacContract);
      const account = await this.horizonServer.loadAccount(
        this.keypair.publicKey()
      );

      // Convert amount to stroops (7 decimals)
      const amountInStroops = Math.floor(
        parseFloat(amount) * 10000000
      ).toString();

      // Build the transaction
      let transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: this.config.networkPassphrase,
      })
        .addOperation(
          contract.call(
            'transfer',
            new Address(this.config.walletAddress).toScVal(),
            new Address(destinationAddress).toScVal(),
            nativeToScVal(amountInStroops, { type: 'i128' })
          )
        )
        .setTimeout(30)
        .build();

      // Simulate the transaction first to prepare it
      const simResponse =
        await this.sorobanServer.simulateTransaction(transaction);

      if (rpc.Api.isSimulationSuccess(simResponse)) {
        // Prepare the transaction with the simulation result
        transaction = rpc.assembleTransaction(transaction, simResponse).build();
      } else {
        throw new Error('Transaction simulation failed');
      }

      // Sign the transaction
      transaction.sign(this.keypair);

      // Submit to Soroban network
      const response = await this.sorobanServer.sendTransaction(transaction);

      return response.hash;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to send PYUSD (SAC): ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Check if account has PYUSD trustline
   */
  async hasPyusdTrustline(): Promise<boolean> {
    try {
      const account = await this.horizonServer.loadAccount(
        this.config.walletAddress
      );

      const hasTrustline = account.balances.some(
        (balance) =>
          'asset_code' in balance &&
          'asset_issuer' in balance &&
          balance.asset_code === this.config.pyusdAssetCode &&
          balance.asset_issuer === this.config.pyusdIssuer
      );

      return hasTrustline;
    } catch (error) {
      // Log the error for debugging but don't throw
      if (
        error instanceof Error &&
        error.message.includes('Request failed with status code 404')
      ) {
        // Account doesn't exist, so no trustline
        return false;
      }
      // For other errors, assume no trustline to be safe
      return false;
    }
  }

  /**
   * Create PYUSD trustline
   */
  async createPyusdTrustline(): Promise<string> {
    try {
      const account = await this.horizonServer.loadAccount(
        this.keypair.publicKey()
      );
      const pyusdAsset = new Asset(
        this.config.pyusdAssetCode,
        this.config.pyusdIssuer
      );

      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: this.config.networkPassphrase,
      })
        .addOperation(Operation.changeTrust({ asset: pyusdAsset }))
        .setTimeout(30)
        .build();

      transaction.sign(this.keypair);
      const response = await this.horizonServer.submitTransaction(transaction);

      return response.hash;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create trustline: ${error.message}`);
      }
      throw error;
    }
  }
}
