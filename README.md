# PYUSD Stellar Recipes

Quick, runnable examples for working with [PYUSD](https://www.paypal.com/us/digital-wallet/manage-money/crypto/pyusd) on [Stellar](https://stellar.org/) using [TypeScript](https://www.typescriptlang.org/) and the [Stellar SDK](https://stellar.github.io/js-stellar-sdk/).

These scripts are meant to help developers test basic PYUSD flows like checking balances and sending tokens on Stellar. Each script is standalone and demonstrates both classic Stellar operations and Stellar Asset Contract (SAC) interactions.

## Prerequisites

- **Node.js** 18 or higher
- **npm** (comes with Node.js)
- **Stellar CLI** - Install from https://developers.stellar.org/docs/tools/cli/install-cli
- A Stellar wallet with some XLM for transaction fees

## Network Support

| Network         | PYUSD Asset                                                      | SAC Contract                                               | Status         |
| --------------- | ---------------------------------------------------------------- | ---------------------------------------------------------- | -------------- |
| Stellar Testnet | `PYUSD:GBT2KJDKUZYZTQPCSR57VZT5NJHI4H7FOB5LT5FPRWSR7I5B4FS3UU7G` | `CACZL3MGXXP3O6ROMB4Q36ROFULRWD6QARPE3AKWPSWMYZVF2474CBXP` | ✅ Available   |
| Stellar Mainnet | `PYUSD:GDQE7IXJ4HUHV6RQHIUPRJSEZE4DRS5WY577O2FY6YQ5LVWZ7JZTU2V5` | `CAKBVGHJIK2HPP5JPT2UOP27O2IMKIUUCFGP3LOOMGCZLE3NP73Z44H6` | 🚀 Coming Soon |

## Available Scripts

We've put together simple TypeScript scripts to show interaction with PYUSD on Stellar. You can run these scripts directly in your terminal.

**TypeScript scripts using the [Stellar SDK](https://stellar.github.io/js-stellar-sdk/) for Stellar interactions:**

- **Create PYUSD trustline** - `createTrustline.ts`
- **Check PYUSD balance** - `checkBalance.ts`
- **Send PYUSD tokens** - `sendPyusd.ts`

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/mono-koto/pyusd-stellar-recipes.git
cd pyusd-stellar-recipes
npm install
```

### 2. Generate a Stellar Wallet

Generate a new testnet wallet with the Stellar CLI:

```bash
stellar keys generate test-wallet --fund --network testnet
```

Or use the [Stellar Laboratory](https://laboratory.stellar.org/#account-creator) to create and fund an account.

> 🧐 **Security Note**: These examples are for testing purposes only. We recommend using a wallet generated and stored in a more secure manner for production use.

### 3. Configure Environment

Copy the template and fill in your values:

```bash
cp .env.template .env
# Edit .env with your actual values
```


> 🧐 **Another Security Note**: You may notice we put a private key in a `.env` file? Don't do that with keys you need to use with mainnet.

## Getting Testnet Tokens

For testing on Stellar testnet, you'll need both XLM (for transaction fees) and PYUSD tokens.

### Get Testnet XLM (Required for transaction fees)

#### Option 1: Using Stellar CLI

```bash
stellar request-tokens --network testnet --public-key GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

#### Option 2: Using Stellar Laboratory

Visit [Stellar Laboratory](https://laboratory.stellar.org/#account-creator) to create and fund an account.

### Get Testnet PYUSD

**Paxos PYUSD Testnet Faucet**
Visit [https://faucet.paxos.com/](https://faucet.paxos.com/) to get testnet PYUSD tokens for your Stellar address.

## Running the Scripts

### 1. Create a PYUSD Trustline (Required First Step)

```bash
npm run create-trustline
```

### 2. Check Your PYUSD Balance

```bash
npm run check-balance
```

### 3. Send PYUSD to Another Account

```bash
npm run send-pyusd <destination_address> <amount> [memo]

# Example:
npm run send-pyusd GDKW...EXAMPLE 10.5000000 "Payment for services"
```

## Development

### Code Quality

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## Resources

- [Stellar Documentation](https://developers.stellar.org/)
- [Stellar SDK for JavaScript](https://stellar.github.io/js-stellar-sdk/)
- [PYUSD Information](https://www.paypal.com/us/digital-wallet/manage-money/crypto/pyusd)
- [Stellar Laboratory](https://laboratory.stellar.org/) - For testing and exploration
- [Stellar Expert](https://stellar.expert/) - Block explorer

## License

MIT License - see [LICENSE](LICENSE) file for details.
