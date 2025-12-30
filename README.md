# Celo Crossword Learning App

A decentralized crossword game built on the Celo blockchain for educational purposes with reward distribution.

## Features

- **On-chain Crosswords**: Crosswords stored in smart contracts for all users to see
- **Prize Distribution**: Token rewards for top solvers
- **Celo Integration**: Full wallet support (Valora, MetaMask)
- **Leaderboard**: Supabase-backed rankings
- **Admin Panel**: Control over crossword content
- **Farcaster Integration**: Ready for Farcaster frames

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
│ • Celo Sepolia Testnet              │
│ • Contract: CrosswordBoard          │
│ • ABI dynamic (imported in hooks)   │
└─────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│         Infrastructure              │
├─────────────────────────────────────┤
│ • Hardhat (development)              │
│ • Viem (contract interaction)        │
│ • Wagmi (wallet integration)         │
└─────────────────────────────────────┘
```

### Technology Stack:
- **Frontend**: Next.js 14+, React 18+, TypeScript
- **Blockchain**: Celo Sepolia, Solidity 0.8.28
- **Web3**: Wagmi, Viem 2.x, Hardhat
- **Styling**: Tailwind CSS, shadcn/ui
- **Infrastructure**: Celo Forum Nodes

### Smart Contract: `CrosswordBoard.sol`

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

### Key Public Functions:

#### `setCrossword(bytes32 crosswordId, string memory crosswordData)`

**Required Role**: `ADMIN_ROLE`
**Purpose**: Sets the active crossword for all users
**Parameters**:
- `crosswordId`: Unique identifier for the crossword (keccak256 hash)
- `crosswordData`: JSON string with crossword configuration
**Event emitted**: `CrosswordUpdated`

#### `createCrosswordWithNativeCELO(bytes32 crosswordId, uint256 prizePool, uint256[] memory winnerPercentages, uint256 endTime)`

**Required Role**: `ADMIN_ROLE`
**Purpose**: Creates a new crossword with native CELO rewards
**Parameters**:
- `crosswordId`: Crossword ID
- `prizePool`: Total prize amount (wei)
- `winnerPercentages`: Array of percentages by position (in basis points)
- `endTime`: Deadline timestamp for completions or 0 for no limit
**Required Payment**: `msg.value == prizePool`
**Event emitted**: `CrosswordCreated`, `CrosswordActivated`

#### `completeCrossword(uint256 durationMs, string username, string displayName, string pfpUrl)`

**Access**: Public
**Purpose**: Completes a crossword and awards automatic prize if eligible
**Parameters**:
- `durationMs`: Duration in milliseconds
- `username`: Username (Farcaster)
- `displayName`: Display name
- `pfpUrl`: Profile image URL
**Functionality**:
- Records completion in global state
- Automatically calls `recordCompletion` for potential prizes
- Emits `CrosswordCompleted`
**Requirements**:
- User must not have completed this crossword before
- Crossword must be active
- Duration must be > 0

#### `recordCompletion(bytes32 crosswordId, address user) external onlyRole(OPERATOR_ROLE) returns (bool rewarded)`

**Required Role**: `OPERATOR_ROLE`
**Purpose**: Records completion and distributes automatic prizes
**Internal access**: Called from `completeCrossword` using try-catch
**Logic**:
- Verifies crossword is active
- Verifies prize limits (no more than `winnerPercentages.length`)
- Prevents duplicates
- Calculates prize: `(totalPrizePool * winnerPercentages[rank - 1]) / MAX_PERCENTAGE`
- Transfers prize (native CELO or ERC20)
- Marks as claimed: `crossword.hasClaimed[user] = true`

#### `claimPrize(bytes32 crosswordId)`

**Access**: Public
**Purpose**: Allow manual prize claiming (for UX feedback)
**Logic**:
- Verifies crossword has prizes
- Verifies user completed (`hasCompletedCrossword`)
- Finds user position in `completions` array
- Verifies not claimed before (`crossword.hasClaimed`)
- Important: If already claimed, allows transaction for feedback but no double payment
- Emits `PrizeDistributed`
**Common errors**:
- "no prize pool available" - Crossword has no prizes
- "not a verified winner" - User did not complete
- "completion record not found" - User not in `completions` array

#### `hasClaimedPrize(bytes32 crosswordId, address user) external view returns (bool)`

**Access**: Public (view)
**Purpose**: Direct verification of claim status
**Return**: `true` if user already claimed for this crossword
**Usage**: Verification by frontend to show correct status

### Crossword States and Validations:

#### Crossword States:

```solidity
enum CrosswordState {
    Inactive, // Not active
    Active,   // Active for completion
    Complete  // Prizes distributed
}
```

#### Security Validations:
- Access control using `AccessControl`
- Reentrancy protection with `ReentrancyGuard`
- Pausable with `Pausable`
- Percentage validation total ≤ 10000 (100%)
- Balance verification before transfers
- Duplicate prevention with `hasClaimed` mapping

## Development Setup

### Prerequisites
- Node.js 18+
- pnpm package manager
- Celo wallet (Valora, MetaMask)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
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

### Running Locally

1. **Start the frontend**
```bash
cd apps/web
pnpm dev
```

2. **The app will be available at** `http://localhost:3000`

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

## Deployment

### Deploying Contracts to Celo Sepolia

1. **Configure Sepolia in hardhat.config.ts**
2. **Set up environment variables** with your private key
3. **Deploy contracts**
```bash
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

4. **Automatic frontend update**: The deployment script will automatically save the deployed addresses and ABIs to the frontend configuration files.

5. **Manual verification**: Check the saved files in `apps/web/contracts/` to confirm all addresses and ABIs are properly configured

### Deploying Frontend

The frontend can be deployed to:
- Vercel (recommended for Next.js)
- Netlify
- Any static hosting service

## Deployed Contract Addresses (Celo Sepolia)

### Deployment Information:
- **Deployer Wallet**: `0xA35Dc36B55D9A67c8433De7e790074ACC939f39e` (automatic admin)
- **Admin Whitelist**: `0x0c9Adb5b5483130F88F10DB4978772986B1E953B` (to be added after deployment)

### Latest Deployment:
- **Deployment Date**: Monday, December 29, 2025
- **CrosswordBoard (Coordinator)**: `0xe83fbe75d46ad64f045b996de0365b47b6f634af`
- **CrosswordCore**: `0xbef1cab73361fb01a440ab937d4c7ae3a5eea481`
- **CrosswordPrizes**: `0x817a51755be9b6b0dc408bde7edf796706ceb4cb`
- **UserProfiles**: `0x6bf6930d5567c4b3e010f498154cd34cb94bf49e`
- **ConfigManager**: `0xec06773b5da4aa2632af4fe2e181f7a191a570e8`
- **AdminManager**: `0xfaaf90fc471663aa98aa49c3fc1af1e3deee6526`
- **PublicCrosswordManager**: `0x4a6f2c2b2609ddfdaac9306a4a94696658eb1fac`

### Previous Deployments:
- **CrosswordBoard Contract**: `0x5fbdb2315678afecb367f032d93f642f64180aa3` (Local)
- **CrosswordPrizes Contract**: `0xe7f1725e7734ce288f8367e1bb143e90bb3f0512` (Local)

## How It Works

1. **Admin** sets crossword via admin panel (writes to CrosswordBoard contract)
2. **All users** see the same crossword (reads from CrosswordBoard contract)
3. **Users** solve crossword and submit to Supabase leaderboard
4. **Admin** distributes prizes to top solvers via CrosswordPrizes contract
5. **Winners** claim their rewards from the prize pool

## User Completion Flow

### Complete User Winner Flow:

1. **User accesses crossword**
   - Reads crossword from `currentCrosswordId` of contract
   - Displays data in JSON format through UI
2. **User completes quickly**
   - Interface verifies completeness
   - Calculates duration (time to complete)
   - Prepares user data (Farcaster profile)
3. **Calls `completeCrossword()`**
   - Transaction with duration and user metadata
   - Contract records completion in `hasCompletedCrossword`
   - Contract internally calls `recordCompletion`
4. **Automatic prize if eligible**
   - If within top X finishers → receives immediate prize
   - Contract marks `hasClaimed[user] = true`
   - Token/CELO transfer executed
5. **Redirect to leaderboard**
   - User appears as "Winner" and "Claimed!"
6. **State persists after reload**
   - Frontend queries `hasClaimedPrize` from contract
   - Button shows "Claimed!" based on actual contract state

### Non-Winner Completion Flow:

1. **User completes after slots filled**
2. **Receives completion confirmation** but no prize
3. **Appears on leaderboard** but without winner status
4. **Cannot claim prize** (not in top winners)

### Manual Claim Flow (special case):

1. **User was winner but did not receive automatic payment**
2. **"Claim Prize" button visible** with eligibility verification
3. **Calls `claimPrize()`** with validation in contract
4. **Receives prize** if eligible and not claimed

## Admin Functions

### To become an admin:
- The deployer (`0xA35Dc36B55D9A67c8433De7e790074ACC939f39e`) is automatically an admin
- Additional admins (like `0x0c9Adb5b5483130F88F10DB4978772986B1E953B`) can be added via `addAdmin()` function

### Admin capabilities:
- Set new crosswords via admin panel
- Manage token whitelist for prizes
- Distribute rewards to winners
- Pause/unpause contracts in emergencies

## Token Rewards

The system supports:
- cUSD, cEUR, and other Celo stablecoins
- Configurable percentage splits for winners
- Up to 10 winners per crossword
- Recovery of unclaimed prizes after 30 days

## Leaderboard System

- Supabase-powered leaderboard
- Wallet verification prevents bot submissions
- Time-based rankings
- Historical data tracking

## Testing

Comprehensive test suites are available:
- `scripts/manual-test.js` - Core functionality
- `scripts/crossword-specific-test.js` - Workflow testing
- `scripts/security-edge-test.js` - Security and edge cases

Run with:
```bash
cd apps/contracts
npx hardhat run scripts/manual-test.js --network localhost
```

## Configuration

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

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `NEXT_PUBLIC_CROSSWORD_BOARD_ADDRESS` - Board contract address
- `NEXT_PUBLIC_CROSSWORD_PRIZES_ADDRESS` - Prizes contract address
- `NEXT_PUBLIC_FARCASTER_HEADER/PAYLOAD/SIGNATURE` - Farcaster integration

### Admin Management
- The deployer automatically becomes a contract admin
- Additional admins can be added using the `addAdmin()` function
- Admins can set new crosswords via the admin panel
- Use the `scripts/add-admin.js` script to add new admins:
```bash
# Add a new admin wallet
CROSSWORD_BOARD_ADDRESS=your_contract_address npx hardhat run scripts/add-admin.js --network sepolia
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository.