# Celo Crossword Learning App

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Celo](https://img.shields.io/badge/Powered%20by-Celo-green)](https://celo.org/)
[![Solidity](https://img.shields.io/badge/Language-Solidity-ff69b4)](https://soliditylang.org/)

A decentralized crossword game built on the Celo blockchain for educational purposes with reward distribution.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Development](#development)
- [Deployment](#deployment)
- [Deployed Contracts](#deployed-contracts)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)
- [Support](#support)

## Overview

Celo Crossword is a decentralized application (DApp) that enables users to solve crossword puzzles on the Celo blockchain with rewards based on completion speed. The system automatically awards prizes to the first X completers of each crossword, with on-chain verification and immediate prize distribution.

### Key Benefits
- **Educational**: Learn blockchain concepts through engaging crossword puzzles
- **Rewarding**: Earn tokens for quick puzzle completion
- **Decentralized**: Built on the Celo blockchain for transparency and security
- **Social**: Farcaster integration for community engagement

## Features

- **On-chain Crosswords**: Crosswords stored in smart contracts for all users to see
- **Prize Distribution**: Token rewards for top solvers
- **Celo Integration**: Full wallet support (Valora, MetaMask)
- **Leaderboard**: Supabase-backed rankings
- **Admin Panel**: Control over crossword content
- **Farcaster Integration**: Ready for Farcaster frames
- **Modular Architecture**: Separated contracts for better maintainability and security

## Architecture

Crossword Board is a DApp built on the Celo blockchain that enables users to complete crosswords with rewards based on completion speed. The system awards automatic prizes to the first X completers of each crossword, with on-chain verification and immediate prize distribution.

### System Architecture
```
┌─────────────────────────────────────┐
│              Frontend               │
├─────────────────────────────────────┤
│ • Next.js App Router (React)        │
│ • Wagmi + Viem Integration          │
│ • Farcaster Frame SDK               │
│ • Tailwind CSS + shadcn/ui          │
└─────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│           Blockchain Layer          │
├─────────────────────────────────────┤
│ • Celo Mainnet & Sepolia Testnet    │
│ • Modularized Contracts             │
│ • CrosswordBoard (Coordinator)      │
│ • CrosswordCore (Game Logic)        │
│ • CrosswordPrizes (Prize Logic)     │
│ • UserProfiles (User Data)          │
│ • ConfigManager (Configuration)     │
│ • AdminManager (Admin Functions)    │
│ • PublicCrosswordManager            │
└─────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│         Infrastructure              │
├─────────────────────────────────────┤
│ • Hardhat (development)              │
│ • Viem (contract interaction)        │
│ • Wagmi (wallet integration)         │
│ • Supabase (leaderboard)            │
└─────────────────────────────────────┘
```

### Technology Stack:
- **Frontend**: Next.js 14+, React 18+, TypeScript
- **Blockchain**: Celo Mainnet & Sepolia, Solidity 0.8.28
- **Web3**: Wagmi, Viem 2.x, Hardhat
- **Styling**: Tailwind CSS, shadcn/ui
- **Infrastructure**: Celo Forum Nodes
- **Database**: Supabase for leaderboard

### Modular Smart Contracts Architecture:

#### Main Contracts:
- **CrosswordBoard**: Main coordinator contract that connects all modules
- **CrosswordCore**: Handles crossword game logic and completions
- **CrosswordPrizes**: Manages prize distribution and token handling
- **UserProfiles**: Stores user profile information (username, display name, etc.)
- **ConfigManager**: Manages configuration parameters
- **AdminManager**: Handles admin role management
- **PublicCrosswordManager**: Manages public crossword creation

#### Main Data Structures:

```solidity
struct Crossword {
    address token;                    // Token ERC20 or address(0) for native CELO
    uint256 totalPrizePool;           // Total prize pool
    uint256[] winnerPercentages;      // Percentages for winners (basis points)
    CompletionRecord[] completions;   // List of completers with rank
    mapping(address => bool) hasClaimed; // Claim records
    uint256 activationTime;           // Activation time
    uint256 endTime;                  // Deadline (0 = no limit)
    CrosswordState state;             // Crossword state
    uint256 createdAt;                // Creation date
    uint256 claimedAmount;            // Total claimed amount
}

struct CompletionRecord {
    address user;                     // User who completed
    uint256 timestamp;                // Completion timestamp
    uint256 rank;                     // Completion rank
}
```

#### Access Roles:
- `DEFAULT_ADMIN_ROLE`: Contract owner
- `ADMIN_ROLE`: System administrators
- `OPERATOR_ROLE`: Operators who can register completions

## Installation

### Prerequisites
- Node.js 18+
- pnpm package manager
- Celo wallet (Valora, MetaMask)
- Git

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/your-username/celo-crossword.git
cd celo-crossword
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
# In apps/web/
cp .env.template .env.local
```

4. **Update environment variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_CROSSWORD_BOARD_ADDRESS=your_contract_address
NEXT_PUBLIC_CROSSWORD_PRIZES_ADDRESS=your_contract_address
NEXT_PUBLIC_FARCASTER_HEADER=your_farcaster_header
NEXT_PUBLIC_FARCASTER_PAYLOAD=your_farcaster_payload
NEXT_PUBLIC_FARCASTER_SIGNATURE=your_farcaster_signature
```

## Usage

### Running Locally

1. **Start the frontend**
```bash
cd apps/web
pnpm dev
```

2. **The app will be available at** `http://localhost:3000`

### Playing Crosswords

1. Connect your Celo-compatible wallet (Valora, MetaMask)
2. Browse available crosswords
3. Solve the crossword as quickly as possible
4. Submit your completion to compete for rewards
5. Check the leaderboard to see your ranking
6. Claim your rewards if you're among the top finishers

### Admin Functions

For administrators:

1. Access the admin panel (requires admin role)
2. Create new crosswords with reward pools
3. Set winner percentages and prize distribution
4. Manage active crosswords and their states

### Environment Configuration

The application requires several environment variables to function properly:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `NEXT_PUBLIC_CROSSWORD_BOARD_ADDRESS` - Deployed contract address
- `NEXT_PUBLIC_FARCASTER_HEADER/PAYLOAD/SIGNATURE` - Farcaster integration (optional)

### Crossword Format

Crosswords follow this JSON format:
```json
{
  "gridSize": { "rows": 6, "cols": 10 },
  "title": "Sample Crossword",
  "clues": [
    {
      "number": 1,
      "clue": "Sample clue",
      "answer": "ANSWER",
      "row": 0,
      "col": 0,
      "direction": "across"
    }
  ]
}
```

## Development

### Contract Development

1. **Navigate to contracts**
```bash
cd apps/contracts
```

2. **Compile contracts**
```bash
pnpm build
```

3. **Run tests**
```bash
pnpm test
```

4. **Deploy locally** (for development)
```bash
# Start local node
npx hardhat node

# In another terminal, deploy
npx hardhat run scripts/deploy-local.js --network localhost
```

### Running Tests

The project includes comprehensive tests for both frontend and smart contracts:

```bash
# Run all tests
pnpm test

# Run contract tests specifically
cd apps/contracts
pnpm test

# Run frontend tests
cd apps/web
# Add your frontend test command here
```

## Deployment

### Deploying Contracts to Celo Sepolia

1. **Configure Sepolia in hardhat.config.ts**
2. **Set up environment variables** with your private key
3. **Deploy contracts**
```bash
pnpm deploy:sepolia
```

### Deploying Contracts to Celo Mainnet

1. **Configure Mainnet in hardhat.config.ts**
2. **Set up environment variables** with your private key
3. **Deploy contracts**
```bash
pnpm deploy:mainnet
```

### Available Deployment Scripts

- `pnpm deploy:sepolia` - Deploy to Celo Sepolia testnet with automatic verification
- `pnpm deploy:mainnet` - Deploy to Celo Mainnet with automatic verification

Both scripts will:
- Compile contracts
- Deploy all modularized contracts
- Configure contracts with proper roles
- Update frontend configuration files
- Verify contracts on Sourcify
- Show contract addresses with explorer links

### Deploying Frontend

The frontend can be deployed to:
- Vercel (recommended for Next.js)
- Netlify
- Any static hosting service

## Deployed Contracts

### Celo Mainnet
- **CrosswordBoard**: `0x7b841c609d95cbafe0771d4a05d2c0415922737b` ([View on CeloScan](https://celoscan.io/address/0x7b841c609d95cbafe0771d4a05d2c0415922737b))
- **CrosswordCore**: `0x7b79e1cb9a344cf8856b4db1131bf65fb6a6fba2` ([View on CeloScan](https://celoscan.io/address/0x7b79e1cb9a344cf8856b4db1131bf65fb6a6fba2))
- **CrosswordPrizes**: `0x754b33d8aded1c6bf4821ea68158c42b434d781f` ([View on CeloScan](https://celoscan.io/address/0x754b33d8aded1c6bf4821ea68158c42b434d781f))
- **UserProfiles**: `0x4019cd85790a2706b0fc3bd9845c2c16742af0e5` ([View on CeloScan](https://celoscan.io/address/0x4019cd85790a2706b0fc3bd9845c2c16742af0e5))
- **ConfigManager**: `0x321dcef35e3da483304226ac679b8898c4ee0807` ([View on CeloScan](https://celoscan.io/address/0x321dcef35e3da483304226ac679b8898c4ee0807))
- **AdminManager**: `0x8944ffc503388174aff351cb1c6f87958d6e5bb3` ([View on CeloScan](https://celoscan.io/address/0x8944ffc503388174aff351cb1c6f87958d6e5bb3))
- **PublicCrosswordManager**: `0xdc2b0c154f48c7e235872208a6f3093647a236a7` ([View on CeloScan](https://celoscan.io/address/0xdc2b0c154f48c7e235872208a6f3093647a236a7))

### Celo Sepolia Testnet
- **CrosswordBoard**: `0xdf57dbd62dbbc4187536ebdd4555df07ae3b68b0` ([View on SepoliaScan](https://sepolia.celoscan.io/address/0xdf57dbd62dbbc4187536ebdd4555df07ae3b68b0))
- **CrosswordCore**: `0x26a749edcf8d44a4322e964b3bed619236425af7` ([View on SepoliaScan](https://sepolia.celoscan.io/address/0x26a749edcf8d44a4322e964b3bed619236425af7))
- **CrosswordPrizes**: `0xa17fe3bcb6e126e55ce7d1573191dba62b9c408e` ([View on SepoliaScan](https://sepolia.celoscan.io/address/0xa17fe3bcb6e126e55ce7d1573191dba62b9c408e))
- **UserProfiles**: `0x2712396e8c09f0a0a506773523f31b354322e650` ([View on SepoliaScan](https://sepolia.celoscan.io/address/0x2712396e8c09f0a0a506773523f31b354322e650))
- **ConfigManager**: `0x0cee101c98be2e855232e2cafc7c8f97108fa52e` ([View on SepoliaScan](https://sepolia.celoscan.io/address/0x0cee101c98be2e855232e2cafc7c8f97108fa52e))
- **AdminManager**: `0x86c634260bdc44a0357b674c6ce6d9e42af2b93c` ([View on SepoliaScan](https://sepolia.celoscan.io/address/0x86c634260bdc44a0357b674c6ce6d9e42af2b93c))
- **PublicCrosswordManager**: `0x67d0f17bff5286e408871f7a61ba616715036166` ([View on SepoliaScan](https://sepolia.celoscan.io/address/0x67d0f17bff5286e408871f7a61ba616715036166))

All contracts are verified on Sourcify for transparency and auditability.

## Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines

- Follow the existing code style
- Write clear commit messages
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting

### Reporting Issues

If you find a bug or have a feature request, please open an issue in the GitHub repository. Include as much detail as possible to help us address the issue quickly.

### Code of Conduct

Please follow our Code of Conduct to ensure a welcoming environment for all contributors.

## Security

### Security Considerations

- All smart contracts have been audited for common vulnerabilities
- Access control is implemented using OpenZeppelin's AccessControl
- Reentrancy protection is implemented where necessary
- Proper validation of inputs and state changes
- Modular architecture for better security isolation
- All contracts are verified on Sourcify for transparency

### Best Practices

- Never commit private keys or sensitive information to the repository
- Use environment variables for sensitive data
- Regularly update dependencies to patch security vulnerabilities
- Test all functionality thoroughly before deployment

### Reporting Security Issues

If you discover a security vulnerability, please contact us directly at [security@celo-crossword.org](mailto:security@celo-crossword.org) instead of creating a public issue.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please:

- Check the [Issues](https://github.com/your-username/celo-crossword/issues) page for existing discussions
- Open a new issue for bug reports or feature requests
- Join our community on [Discord](https://discord.gg/celo-crossword) (if available)
- Email us at [support@celo-crossword.org](mailto:support@celo-crossword.org)

## Acknowledgments

- Thanks to the Celo Foundation for supporting this project
- Special thanks to the OpenZeppelin team for secure smart contract libraries
- Community contributors who have helped improve this project

---

<p align="center">
  Made with ❤️ for the Celo ecosystem
</p>