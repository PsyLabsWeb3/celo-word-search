import { viem } from "hardhat";

async function main() {
  console.log("Deploying contracts...");

  // Get wallet clients
  const [owner, admin, user1, user2, user3] = await viem.getWalletClients();

  console.log("Deploying contracts with the account:", owner.account.address);

  // Deploy Config contract
  const configContract = await viem.deployContract("Config", [owner.account.address]);
  console.log("Config contract deployed to:", configContract.address);

  // Deploy CrosswordPrizes contract
  const prizesContract = await viem.deployContract("CrosswordPrizes", [owner.account.address]);
  console.log("CrosswordPrizes contract deployed to:", prizesContract.address);

  // Deploy CrosswordBoard contract
  const boardContract = await viem.deployContract("CrosswordBoard", [
    owner.account.address,
    prizesContract.address,
    configContract.address
  ]);
  console.log("CrosswordBoard contract deployed to:", boardContract.address);

  // Get public client to send transactions
  const publicClient = await viem.getPublicClient();

  // Grant admin roles
  console.log("\nSetting up admin roles...");
  
  // Grant admin role on CrosswordPrizes
  const ADMIN_ROLE = await prizesContract.read.ADMIN_ROLE();
  const grantRoleTx = await owner.sendTransaction({
    to: prizesContract.address,
    data: prizesContract.encodeFunctionData("grantRole", [ADMIN_ROLE, admin.account.address])
  });
  await publicClient.waitForTransactionReceipt({ hash: grantRoleTx });
  console.log("Granted admin role on CrosswordPrizes to:", admin.account.address);

  // Add admin to CrosswordBoard
  const boardAdminTx = await owner.sendTransaction({
    to: boardContract.address,
    data: boardContract.encodeFunctionData("addAdmin", [admin.account.address])
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
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});