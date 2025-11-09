// Script to add your wallet as admin to the CrosswordBoard contract
// Using the known owner wallet (same as the deployed address in private key)

const { createWalletClient, http, getContract, createPublicClient, parseAbi } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

// Your wallet address to add as admin
const walletToAdd = '0x0c9Adb5b5483130F88F10DB4978772986B1E953B';

// Configuration for Celo Sepolia
const chain = {
  id: 11142220,
  name: 'Celo Sepolia Testnet',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://forno.celo-sepolia.celo-testnet.org'],
    },
  },
  blockExplorers: {
    default: { name: 'Celo Explorer', url: 'https://sepolia.celoscan.io' },
  },
  testnet: true,
};

async function main() {
  // Get the private key from environment variable
  const privateKey = '2bc2fb86828553f6c50d37c7dd75fa1028bc9d5569ceb038bd0b268c58f9e8f1';
  
  if (!privateKey) {
    console.error('ERROR: PRIVATE_KEY environment variable not set');
    return;
  }

  // Ensure the private key has '0x' prefix
  const fullPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  
  // Create account from private key
  const account = privateKeyToAccount(fullPrivateKey);
  
  console.log('Using account:', account.address);

  // Connect to the network
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(),
  });

  // The deployed contract address
  const contractAddress = '0xdc2a624dffc1f6343f62a02001906252e3ca8fd2';

  if (!contractAddress) {
    console.error('ERROR: CROSSWORD_BOARD_ADDRESS not set');
    return;
  }

  console.log('Contract address:', contractAddress);
  console.log('Adding wallet as admin:', walletToAdd);

  // ABI for the CrosswordBoard contract (just the functions we need)
  const contractAbi = parseAbi([
    'function addAdmin(address newAdmin) external',
    'function isAdminAddress(address addr) external view returns (bool)',
    'function owner() external view returns (address)'
  ]);

  // Create contract instance
  const crosswordBoard = getContract({
    address: contractAddress,
    abi: contractAbi,
    client: {
      public: publicClient,
      wallet: walletClient,
    },
  });

  try {
    // Check if the current wallet is the owner or an admin
    const owner = await crosswordBoard.read.owner();
    console.log('Contract owner:', owner);
    
    const isAdmin = await crosswordBoard.read.isAdminAddress([account.address]);
    console.log('Current wallet is admin:', isAdmin);

    if (account.address.toLowerCase() !== owner.toLowerCase() && !isAdmin) {
      console.error('ERROR: Current wallet is not the owner or an admin. Cannot add new admins.');
      return;
    }

    console.log('Attempting to add admin...');

    // Add the wallet as admin
    const hash = await crosswordBoard.write.addAdmin([walletToAdd], {
      account: account,
    });

    console.log('Transaction submitted:', hash);

    // Wait for transaction to be mined
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: hash,
    });

    console.log('Transaction confirmed:', receipt.transactionHash);
    console.log('✅ Wallet successfully added as admin!');

    // Verify the admin was added
    const newAdminStatus = await crosswordBoard.read.isAdminAddress([walletToAdd]);
    console.log('Verification - New wallet is admin:', newAdminStatus);

  } catch (error) {
    console.error('Error adding admin:', error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });