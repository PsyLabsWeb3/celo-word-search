import hre from "hardhat";
import { parseEther } from "viem";

async function main() {
  console.log("Deploying contracts...");

  // Get wallet clients
  const [owner, admin, user1, user2, user3] = await hre.viem.getWalletClients();

  console.log("Deploying contracts with the account:", owner.account.address);

  // Deploy Config contract
  const configContract = await hre.viem.deployContract("Config", [owner.account.address]);
  console.log("Config contract deployed to:", configContract.address);

  // Deploy CrosswordPrizes contract
  const prizesContract = await hre.viem.deployContract("CrosswordPrizes", [owner.account.address]);
  console.log("CrosswordPrizes contract deployed to:", prizesContract.address);

  // Deploy CrosswordBoard contract
  const boardContract = await hre.viem.deployContract("CrosswordBoard", [
    owner.account.address,
    prizesContract.address,
    configContract.address
  ]);
  console.log("CrosswordBoard contract deployed to:", boardContract.address);

  // Get public client to send transactions
  const publicClient = await hre.viem.getPublicClient();

  // Grant admin roles
  console.log("\nSetting up admin roles...");

  // Get contract instances with full ABI for encoding function data
  const prizesContractInstance = await hre.ethers.getContractAt("CrosswordPrizes", prizesContract.address);
  const boardContractInstance = await hre.ethers.getContractAt("CrosswordBoard", boardContract.address);

  // Grant admin role on CrosswordPrizes
  const ADMIN_ROLE = await prizesContract.read.ADMIN_ROLE();
  const grantRoleTx = await owner.sendTransaction({
    to: prizesContract.address,
    data: prizesContractInstance.interface.encodeFunctionData("grantRole", [ADMIN_ROLE, admin.account.address])
  });
  await publicClient.waitForTransactionReceipt({ hash: grantRoleTx });
  console.log("Granted admin role on CrosswordPrizes to:", admin.account.address);

  // Add admin to CrosswordBoard
  const boardAdminTx = await owner.sendTransaction({
    to: boardContract.address,
    data: boardContractInstance.interface.encodeFunctionData("addAdmin", [admin.account.address])
  });
  await publicClient.waitForTransactionReceipt({ hash: boardAdminTx });
  console.log("Added admin to CrosswordBoard:", admin.account.address);

  console.log("\nDeployment completed successfully!");
  console.log("Contracts are ready for use:");
  console.log("- Config:", configContract.address);
  console.log("- CrosswordPrizes:", prizesContract.address);
  console.log("- CrosswordBoard:", boardContract.address);

  console.log("\nNext steps:");
  console.log("1. Admin needs to set allowed tokens via setAllowedToken()");
  console.log("2. Admin creates crosswords with prizes via createCrossword()");
  console.log("3. Users solve crosswords and prizes are distributed automatically");
  console.log("4. Admin can configure settings via the admin panel");

  // Display initial configuration
  const maxWinners = await boardContract.read.getMaxWinnersConfig();
  console.log("\nInitial max winners setting:", maxWinners.toString());
  
  const returnHomeVisible = await boardContract.read.isReturnHomeButtonVisible();
  console.log("Return home button visible:", returnHomeVisible);

  // Now let's simulate the complete flow:
  console.log("\n--- Simulating Complete Flow ---");
  
  // Step 1: Admin allows a token
  console.log("Step 1: Admin allowing CELO token...");
  const mockTokenAddress = "0x471EcE3750Da237f93B8E339c536989b8978a438"; // CELO address on testnet
  const allowTokenTx = await admin.sendTransaction({
    to: prizesContract.address,
    data: prizesContractInstance.interface.encodeFunctionData("setAllowedToken", [mockTokenAddress, true])
  });
  await publicClient.waitForTransactionReceipt({ hash: allowTokenTx });
  console.log("Allowed token:", mockTokenAddress);

  // Step 2: Admin creates a crossword with prizes
  console.log("Step 2: Admin creating crossword with prizes...");
  const crosswordId = "0x1234567890123456789012345678901234567890123456789012345678901234";
  const winnerPercentages = [5000n, 3000n, 2000n]; // 50%, 30%, 20%
  const prizePool = parseEther("10"); // 10 tokens in prize pool
  
  // This would require sending tokens to the contract - for testing we'll just show the function call
  console.log("Crossword ID:", crosswordId);
  console.log("Prize pool:", prizePool.toString(), "wei (10 tokens)");
  console.log("Winner percentages:", winnerPercentages);

  console.log("\n--- Configuration Tests ---");
  
  // Test configuration updates
  console.log("Current max winners:", await boardContract.read.getMaxWinnersConfig());
  
  // Update max winners to 5 - using ethers instance for encoding
  const setMaxWinnersTx = await admin.sendTransaction({
    to: boardContract.address,
    data: boardContractInstance.interface.encodeFunctionData("setMaxWinnersConfig", [5n])
  });
  await publicClient.waitForTransactionReceipt({ hash: setMaxWinnersTx });
  console.log("Updated max winners to 5");
  console.log("New max winners:", await boardContract.read.getMaxWinnersConfig());
  
  // Test return home button visibility
  console.log("Return home button visible:", await boardContract.read.isReturnHomeButtonVisible());
  
  // Update visibility to false
  const setVisibilityTx = await admin.sendTransaction({
    to: boardContract.address,
    data: boardContractInstance.interface.encodeFunctionData("setReturnHomeButtonVisible", [false])
  });
  await publicClient.waitForTransactionReceipt({ hash: setVisibilityTx });
  console.log("Updated return home button visibility to false");
  console.log("New visibility:", await boardContract.read.isReturnHomeButtonVisible());
  
  console.log("\n--- Complete Flow Simulation Completed Successfully! ---");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});