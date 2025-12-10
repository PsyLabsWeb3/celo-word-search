/**
 * Pre-Deployment Checklist Script for Mainnet
 * Verifies all requirements before deploying to Celo Mainnet
 */

const hre = require("hardhat");
const { formatEther } = require("viem");

const OWNER_ADDRESS = "0xA35Dc36B55D9A67c8433De7e790074ACC939f39e";
const MIN_BALANCE = "0.5"; // Minimum CELO balance required (in CELO)

async function main() {
  console.log("🔍 Pre-Deployment Checklist for Celo Mainnet\n");
  console.log("=".repeat(60));
  
  let allChecksPassed = true;
  
  // Check 1: Network Configuration
  console.log("\n✓ Check 1: Network Configuration");
  console.log("-".repeat(60));
  
  try {
    const network = hre.network.name;
    const chainId = hre.network.config.chainId;
    
    if (network !== "celo") {
      console.log("❌ FAIL: Not configured for Celo mainnet");
      console.log(`   Current network: ${network}`);
      console.log("   Expected: celo");
      allChecksPassed = false;
    } else if (chainId !== 42220) {
      console.log("❌ FAIL: Wrong chain ID");
      console.log(`   Current chain ID: ${chainId}`);
      console.log("   Expected: 42220");
      allChecksPassed = false;
    } else {
      console.log("✅ PASS: Network configured correctly");
      console.log(`   Network: ${network}`);
      console.log(`   Chain ID: ${chainId}`);
      console.log(`   RPC: ${hre.network.config.url}`);
    }
  } catch (error) {
    console.log("❌ FAIL: Error checking network configuration");
    console.log(`   Error: ${error.message}`);
    allChecksPassed = false;
  }
  
  // Check 2: Wallet Balance
  console.log("\n✓ Check 2: Wallet Balance");
  console.log("-".repeat(60));
  
  try {
    const [signer] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();
    
    const balance = await publicClient.getBalance({
      address: signer.account.address
    });
    
    const balanceInCelo = formatEther(balance);
    const { parseEther } = require("viem");
    const minBalanceWei = parseEther(MIN_BALANCE);
    
    console.log(`   Wallet: ${signer.account.address}`);
    console.log(`   Balance: ${balanceInCelo} CELO`);
    console.log(`   Minimum Required: ${MIN_BALANCE} CELO`);
    
    if (balance < minBalanceWei) {
      console.log("❌ FAIL: Insufficient balance for deployment");
      console.log(`   You need at least ${MIN_BALANCE} CELO for gas fees`);
      allChecksPassed = false;
    } else {
      console.log("✅ PASS: Sufficient balance for deployment");
    }
  } catch (error) {
    console.log("❌ FAIL: Error checking wallet balance");
    console.log(`   Error: ${error.message}`);
    allChecksPassed = false;
  }
  
  // Check 3: Owner Address
  console.log("\n✓ Check 3: Owner Address Configuration");
  console.log("-".repeat(60));
  
  try {
    const [signer] = await hre.viem.getWalletClients();
    
    console.log(`   Deployer: ${signer.account.address}`);
    console.log(`   Owner: ${OWNER_ADDRESS}`);
    
    if (signer.account.address.toLowerCase() === OWNER_ADDRESS.toLowerCase()) {
      console.log("✅ PASS: Deployer is the owner");
    } else {
      console.log("⚠️  WARNING: Deployer is not the owner");
      console.log("   Make sure this is intentional");
    }
  } catch (error) {
    console.log("❌ FAIL: Error checking owner address");
    console.log(`   Error: ${error.message}`);
    allChecksPassed = false;
  }
  
  // Check 4: Compilation
  console.log("\n✓ Check 4: Contract Compilation");
  console.log("-".repeat(60));
  
  try {
    // Try to get the contract artifact
    const artifact = await hre.artifacts.readArtifact("CrosswordBoard");
    
    console.log("✅ PASS: Contract compiled successfully");
    console.log(`   Contract: ${artifact.contractName}`);
    console.log(`   Compiler: ${artifact.metadata ? JSON.parse(artifact.metadata).compiler.version : 'unknown'}`);
  } catch (error) {
    console.log("❌ FAIL: Contract not compiled or compilation error");
    console.log(`   Error: ${error.message}`);
    console.log("   Run: npx hardhat compile");
    allChecksPassed = false;
  }
  
  // Check 5: Environment Variables
  console.log("\n✓ Check 5: Environment Variables");
  console.log("-".repeat(60));
  
  const requiredEnvVars = [
    { name: "PRIVATE_KEY", required: true },
    { name: "CELOSCAN_API_KEY", required: false },
    { name: "CELO_MAINNET_RPC", required: false }
  ];
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar.name]) {
      console.log(`✅ ${envVar.name}: Set`);
    } else {
      if (envVar.required) {
        console.log(`❌ ${envVar.name}: NOT SET (REQUIRED)`);
        allChecksPassed = false;
      } else {
        console.log(`⚠️  ${envVar.name}: Not set (optional)`);
      }
    }
  }
  
  // Check 6: Ignition Module
  console.log("\n✓ Check 6: Ignition Deployment Module");
  console.log("-".repeat(60));
  
  try {
    const fs = require("fs");
    const modulePath = "./ignition/modules/CrosswordBoard.ts";
    const paramsPath = "./ignition/parameters.json";
    
    if (fs.existsSync(modulePath)) {
      console.log("✅ Ignition module exists");
      console.log(`   Path: ${modulePath}`);
    } else {
      console.log("❌ FAIL: Ignition module not found");
      console.log(`   Expected: ${modulePath}`);
      allChecksPassed = false;
    }
    
    if (fs.existsSync(paramsPath)) {
      console.log("✅ Parameters file exists");
      console.log(`   Path: ${paramsPath}`);
      
      const params = JSON.parse(fs.readFileSync(paramsPath, 'utf8'));
      if (params.CrosswordBoardModule?.initialOwner) {
        console.log(`   Owner in params: ${params.CrosswordBoardModule.initialOwner}`);
      }
    } else {
      console.log("⚠️  Parameters file not found (using defaults)");
    }
  } catch (error) {
    console.log("❌ FAIL: Error checking Ignition files");
    console.log(`   Error: ${error.message}`);
    allChecksPassed = false;
  }
  
  // Final Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 CHECKLIST SUMMARY");
  console.log("=".repeat(60));
  
  if (allChecksPassed) {
    console.log("\n✅ ALL CHECKS PASSED - Ready for mainnet deployment!\n");
    console.log("To deploy, run:");
    console.log("   ./deploy-mainnet.sh");
    console.log("\nOr manually:");
    console.log("   npx hardhat ignition deploy ignition/modules/CrosswordBoard.ts --network celo --parameters ignition/parameters.json");
    return 0;
  } else {
    console.log("\n❌ SOME CHECKS FAILED - Please fix the issues above before deploying\n");
    return 1;
  }
}

main()
  .then((exitCode) => process.exit(exitCode))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
