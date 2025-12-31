const { createWalletClient, createPublicClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { celoAlfajores } = require('viem/chains');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Define Celo Sepolia chain
const celoSepolia = {
  id: 11142220,
  name: 'Celo Sepolia Testnet',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc.ankr.com/celo_sepolia'],
    },
  },
  blockExplorers: {
    default: { name: 'Celo Explorer', url: 'https://sepolia.celoscan.io' },
  },
  testnet: true,
};

// Get contract artifacts
function getContractArtifact(contractName) {
  const artifactPath = path.join(
    __dirname,
    'artifacts',
    'contracts',
    `${contractName}.sol`,
    `${contractName}.json`
  );
  return JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
}

async function main() {
  console.log('🚀 Deploying modular crossword contracts to Celo Sepolia using Viem...\n');

  // Setup account
  const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`);
  console.log(`Deployer address: ${account.address}\n`);

  // List of RPCs to try
  const rpcUrls = [
    'https://alfajores-forno.celo-testnet.org', // Often more stable even for Sepolia unrelated requests? No, let's stick to Sepolia ones.
    'https://celo-sepolia.drpc.org',
    'https://forno.celo-sepolia.celo-testnet.org', 
    'https://sepolia.celo.org',
    'https://rpc.ankr.com/celo_sepolia',
    'wss://rpc.ankr.com/celo_sepolia/ws/v3/app', // Try WSS? Viem supports it.
  ];

  let publicClient;
  let walletClient;
  let activeRpc;

  // Try to connect to an RPC
  console.log('🔄 Finding a working RPC...');
  for (const rpc of rpcUrls) {
    try {
      console.log(`   Trying ${rpc}...`);
      const transport = rpc.startsWith('http') 
        ? http(rpc, { timeout: 20000 }) 
        : http(rpc, { timeout: 20000 }); // Fallback to http transport function even for wss string if needed, but viem handles it differently. Let's stick to HTTP for simplicity first or use specific transport.

      const pc = createPublicClient({
        chain: celoSepolia,
        transport: http(rpc, { timeout: 20000 }), // Force HTTP for consistency first
      });

      const blockNumber = await pc.getBlockNumber();
      console.log(`   ✅ Connected to ${rpc} (Block: ${blockNumber})`);
      
      activeRpc = rpc;
      publicClient = pc;
      walletClient = createWalletClient({
        account,
        chain: celoSepolia,
        transport: http(rpc, { timeout: 60000, retryCount: 5, retryDelay: 2000 }),
      });
      
      // Update public client with more robust settings once verified
      publicClient = createPublicClient({
        chain: celoSepolia,
        transport: http(rpc, { timeout: 60000, retryCount: 5, retryDelay: 2000 }),
      });
      
      break;
    } catch (e) {
      console.log(`   ❌ Failed to connect to ${rpc}: ${e.message}`);
    }
  }

  if (!activeRpc) {
    console.error('❌ Could not connect to any RPC endpoint. Please check your internet connection or try again later.');
    process.exit(1);
  }

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Deployer balance: ${Number(balance) / 1e18} CELO\n`);

  if (balance === 0n) {
    console.error('❌ Deployer has no CELO! Please fund the account before deployment.');
    process.exit(1);
  }

  // Deploy function
  async function deployContract(name, constructorArgs = []) {
    console.log(`Deploying ${name}...`);
    const artifact = getContractArtifact(name);

    try {
      const hash = await walletClient.deployContract({
        abi: artifact.abi,
        bytecode: artifact.bytecode,
        args: constructorArgs,
      });

      console.log(`  Transaction hash: ${hash}`);
      console.log(`  Waiting for confirmation...`);

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        timeout: 120000 // 2 minutes
      });

      console.log(`✅ ${name} deployed at: ${receipt.contractAddress}\n`);
      return { address: receipt.contractAddress, abi: artifact.abi };
    } catch (error) {
      console.error(`❌ Failed to deploy ${name}:`, error.message);
      throw error;
    }
  }

  try {
    // Deploy individual contracts
    const crosswordCore = await deployContract('CrosswordCore', [account.address]);
    const crosswordPrizes = await deployContract('CrosswordPrizes', [account.address]);
    const userProfiles = await deployContract('UserProfiles', [account.address]);
    const configManager = await deployContract('ConfigManager', [account.address]);
    const adminManager = await deployContract('AdminManager', [account.address]);
    const publicCrosswordManager = await deployContract('PublicCrosswordManager', [account.address]);

    // Deploy CrosswordBoard
    const crosswordBoard = await deployContract('CrosswordBoard', [
      crosswordCore.address,
      crosswordPrizes.address,
      userProfiles.address,
      configManager.address,
      adminManager.address,
      publicCrosswordManager.address,
    ]);

    // Log deployment summary
    console.log('📋 Complete Deployment Summary:');
    console.log(`CrosswordCore:           ${crosswordCore.address}`);
    console.log(`CrosswordPrizes:         ${crosswordPrizes.address}`);
    console.log(`UserProfiles:            ${userProfiles.address}`);
    console.log(`ConfigManager:           ${configManager.address}`);
    console.log(`AdminManager:            ${adminManager.address}`);
    console.log(`PublicCrosswordManager:  ${publicCrosswordManager.address}`);
    console.log(`CrosswordBoard:          ${crosswordBoard.address}\n`);

    // Configuration steps
    console.log('🔧 Configuring contracts after deployment...\n');

    // Helper function to send transaction
    async function sendTx(contractAddress, abi, functionName, args = []) {
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi,
        functionName,
        args,
      });
      await publicClient.waitForTransactionReceipt({ hash, timeout: 120000 });
      return hash;
    }

    // 1. Add deployer as admin to AdminManager
    console.log('   a) Adding deployer as admin to AdminManager...');
    await sendTx(adminManager.address, adminManager.abi, 'addAdmin', [account.address]);
    console.log('   ✅ Deployer added as admin\n');

    // 2. Grant admin role on CrosswordPrizes
    console.log('   b) Granting admin roles...');
    const adminRoleBytes = await publicClient.readContract({
      address: crosswordPrizes.address,
      abi: crosswordPrizes.abi,
      functionName: 'DEFAULT_ADMIN_ROLE',
    });
    await sendTx(crosswordPrizes.address, crosswordPrizes.abi, 'grantRole', [adminRoleBytes, account.address]);
    console.log('   ✅ Admin role granted\n');

    // 3. Grant OPERATOR role to CrosswordBoard
    console.log('   c) Granting OPERATOR role to CrosswordBoard...');
    const operatorRoleBytes = await publicClient.readContract({
      address: crosswordPrizes.address,
      abi: crosswordPrizes.abi,
      functionName: 'OPERATOR_ROLE',
    });
    await sendTx(crosswordPrizes.address, crosswordPrizes.abi, 'grantRole', [operatorRoleBytes, crosswordBoard.address]);
    console.log('   ✅ OPERATOR role granted\n');

    // 4. Allow native CELO
    console.log('   d) Allowing native CELO...');
    await sendTx(crosswordPrizes.address, crosswordPrizes.abi, 'setAllowedToken', [
      '0x0000000000000000000000000000000000000000',
      true,
    ]);
    console.log('   ✅ Native CELO allowed\n');

    // 5. Set max winners
    console.log('   e) Configuring max winners...');
    const currentMaxWinners = await publicClient.readContract({
      address: crosswordPrizes.address,
      abi: crosswordPrizes.abi,
      functionName: 'getMaxWinners',
    });
    console.log(`   Current max winners: ${currentMaxWinners}`);
    if (Number(currentMaxWinners) < 10) {
      await sendTx(crosswordPrizes.address, crosswordPrizes.abi, 'setMaxWinners', [10]);
      console.log('   ✅ Max winners updated to 10\n');
    }

    // 6. Set signer
    console.log('   f) Setting signer for CrosswordCore...');
    await sendTx(crosswordCore.address, crosswordCore.abi, 'setSigner', [account.address]);
    console.log('   ✅ Signer set\n');

    console.log('✅ All contracts deployed and configured!\n');

    // Update frontend configuration
    console.log('🔄 Updating frontend configuration...');
    const frontendConfigPath = path.join(__dirname, '..', 'web', 'src', 'lib', 'contracts.ts');
    let configContent = fs.readFileSync(frontendConfigPath, 'utf8');

    const addresses = {
      CrosswordBoard: crosswordBoard.address,
      CrosswordCore: crosswordCore.address,
      CrosswordPrizes: crosswordPrizes.address,
      UserProfiles: userProfiles.address,
      ConfigManager: configManager.address,
      AdminManager: adminManager.address,
      PublicCrosswordManager: publicCrosswordManager.address,
    };

    // Update addresses in celoSepolia section
    for (const [contractName, address] of Object.entries(addresses)) {
      const regex = new RegExp(
        `(\\[celoSepolia\\.id\\]:[\\s\\S]*?${contractName}:[\\s\\S]*?address:\\s*["\'])0x[a-fA-F0-9]+(["\'])`,
        'g'
      );
      configContent = configContent.replace(regex, `$1${address}$2`);
    }

    fs.writeFileSync(frontendConfigPath, configContent);
    console.log('✅ Frontend configuration updated!\n');

    // Copy ABIs
    console.log('🔄 Copying ABIs to frontend...');
    const abiTargetDir = path.join(__dirname, '..', 'web', 'src', 'lib', 'abis');
    if (!fs.existsSync(abiTargetDir)) {
      fs.mkdirSync(abiTargetDir, { recursive: true });
    }

    for (const [contractName, contract] of Object.entries({
      CrosswordBoard: crosswordBoard,
      CrosswordCore: crosswordCore,
      CrosswordPrizes: crosswordPrizes,
      UserProfiles: userProfiles,
      ConfigManager: configManager,
      AdminManager: adminManager,
      PublicCrosswordManager: publicCrosswordManager,
    })) {
      const targetPath = path.join(abiTargetDir, `${contractName}.json`);
      fs.writeFileSync(targetPath, JSON.stringify({ abi: contract.abi }, null, 2));
      console.log(`   ✅ Copied ${contractName}.json`);
    }

    console.log('\n✅ All ABIs copied!\n');

    // Save deployment info
    const deploymentInfo = {
      network: 'celoSepolia',
      chainId: 11142220,
      deployer: account.address,
      timestamp: new Date().toISOString(),
      contracts: addresses,
    };

    const deploymentInfoPath = path.join(__dirname, 'celo-sepolia-deployment.json');
    fs.writeFileSync(deploymentInfoPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`✅ Deployment info saved\n`);

    console.log('🎉 Deployment complete!');
    console.log('\n📋 Final Summary:');
    console.log(`CrosswordCore:           ${crosswordCore.address}`);
    console.log(`CrosswordPrizes:         ${crosswordPrizes.address}`);
    console.log(`UserProfiles:            ${userProfiles.address}`);
    console.log(`ConfigManager:           ${configManager.address}`);
    console.log(`AdminManager:            ${adminManager.address}`);
    console.log(`PublicCrosswordManager:  ${publicCrosswordManager.address}`);
    console.log(`CrosswordBoard:          ${crosswordBoard.address}`);

  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
