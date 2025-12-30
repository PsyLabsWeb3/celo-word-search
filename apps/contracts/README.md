# Celo Crossword - Blockchain-Based Learning Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Celo](https://img.shields.io/badge/Celo-Blockchain-blue)](https://celo.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-Development-yellow)](https://hardhat.org/)

> An innovative blockchain-based crossword puzzle platform that gamifies language learning with rewards on the Celo blockchain.

## 🎯 Overview

Celo Crossword is a decentralized application that combines the fun of crossword puzzles with blockchain technology to create an engaging language learning experience. Users can solve crosswords, compete for prizes, and earn rewards while improving their language skills. The platform supports both native CELO and ERC-20 token rewards, making it accessible to a wide range of users.

## ✨ Key Features

- **Modular Architecture**: Flexible contract design supporting both unified and modular deployment patterns
- **Prize Distribution**: Automated prize distribution to top solvers with configurable reward percentages
- **Multi-Token Support**: Supports native CELO and various ERC-20 tokens as rewards
- **User Profiles**: On-chain user profiles with customizable usernames and avatars
- **Configurable Settings**: Dynamic configuration management for UI and game parameters
- **Admin Controls**: Role-based access control with admin and operator permissions
- **Crossword Management**: Create, activate, and manage crossword puzzles with deadlines
- **Leaderboard System**: Track top solvers and their completion times
- **Security First**: Reentrancy guards, access controls, and comprehensive validation

## 🏗️ Architecture

The platform consists of several interconnected contracts:

### Core Contracts
- **CrosswordBoard**: Main coordinator contract that manages the entire system
- **CrosswordCore**: Handles crossword creation, completion tracking, and verification
- **CrosswordPrizes**: Manages prize pools, winner determination, and reward distribution
- **UserProfiles**: Stores user profile information and preferences
- **ConfigManager**: Dynamic configuration management for UI and game settings
- **AdminManager**: Role-based access control for administrative functions
- **PublicCrosswordManager**: Public interface for crossword creation and management

### Deployment Patterns
The platform supports two deployment patterns:
- **Unified**: Single contract containing all functionality
- **Modular**: Separate contracts for each function, coordinated by CrosswordBoard

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- pnpm package manager
- Celo blockchain account with testnet/mainnet funds

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd celo-crossword/apps/contracts

# Install dependencies
pnpm install

# Compile contracts
pnpm compile

# Run tests
pnpm test
```

### Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Fill in your private key and API keys:
   ```env
   PRIVATE_KEY=your_private_key_without_0x_prefix
   CELOSCAN_API_KEY=your_celoscan_api_key
   ```

### Deployment

```bash
# Deploy unified contract to local network
pnpm deploy

# Deploy to Celo Sepolia testnet
pnpm deploy:celoSepolia

# Deploy to Celo mainnet
pnpm deploy:celo

# Deploy modularized contracts
pnpm deploy:modular
```

## 🌐 Network Support

### Celo Mainnet
- **Chain ID**: 42220
- **RPC URL**: https://forno.celo.org
- **Explorer**: https://celoscan.io

### Celo Sepolia Testnet
- **Chain ID**: 11142220
- **RPC URL**: https://rpc.ankr.com/celo_sepolia
- **Explorer**: https://sepolia.celoscan.io
- **Faucet**: https://faucet.celo.org/celo-sepolia

## 📋 Available Scripts

### Development
- `pnpm build` - Compile contracts with optimization
- `pnpm compile` - Compile smart contracts
- `pnpm test` - Run contract tests
- `pnpm typechain` - Generate TypeScript bindings

### Deployment
- `pnpm deploy` - Deploy to local network
- `pnpm deploy:celoSepolia` - Deploy to Celo Sepolia testnet
- `pnpm deploy:celo` - Deploy to Celo mainnet
- `pnpm deploy:modular` - Deploy modularized contracts
- `pnpm deploy:fast` - Fast deployment script

### Utilities
- `pnpm verify` - Verify contracts on block explorer
- `pnpm clean` - Clean artifacts and cache
- `pnpm add-admin` - Add admin to contracts
- `pnpm update-configs` - Update configuration values

## 🔐 Security Features

- **Reentrancy Protection**: All value transfer functions protected against reentrancy attacks
- **Access Control**: Role-based permissions using OpenZeppelin's AccessControl
- **Input Validation**: Comprehensive validation for all user inputs
- **Pause Mechanism**: Emergency pause functionality for all contracts
- **Gas Optimization**: Optimized for efficient gas usage on Celo network
- **Segregated Balances**: Separate tracking of native CELO balances per crossword

## 🧪 Testing

Run the full test suite:
```bash
pnpm test
```

For gas reporting (if enabled):
```bash
REPORT_GAS=true pnpm test
```

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Add tests** for your changes
5. **Run tests** (`pnpm test`)
6. **Commit your changes** (`git commit -m 'Add amazing feature'`)
7. **Push to the branch** (`git push origin feature/amazing-feature`)
8. **Open a Pull Request**

### Development Guidelines
- Follow Solidity style guide conventions
- Write comprehensive tests for all new functionality
- Document new functions with NatSpec comments
- Ensure all tests pass before submitting PRs
- Keep pull requests focused on a single feature or bug fix

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for secure smart contract building blocks
- [Celo](https://celo.org/) for the sustainable blockchain platform
- [Hardhat](https://hardhat.org/) for the development environment
- The blockchain community for continuous innovation and support

## 🐛 Issues & Support

If you encounter any issues or have questions, please [open an issue](https://github.com/your-repo/issues) on GitHub.

## 📚 Learn More

- [Hardhat Documentation](https://hardhat.org/docs)
- [Celo Developer Documentation](https://docs.celo.org)
- [Celo Smart Contract Best Practices](https://docs.celo.org/developer/contractkit)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Solidity Documentation](https://docs.soliditylang.org/)
