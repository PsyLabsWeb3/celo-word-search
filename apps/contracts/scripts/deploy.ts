import { ethers } from "hardhat";

async function main() {
  // Get the signers
  const [owner, admin, user1, user2, user3] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", owner.address);

  // Deploy Config contract
  const Config = await ethers.getContractFactory("Config");
  const configContract = await Config.deploy(owner.address);
  console.log("Config contract deployed to:", await configContract.getAddress());

  // Deploy CrosswordPrizes contract
  const CrosswordPrizes = await ethers.getContractFactory("CrosswordPrizes");
  const prizesContract = await CrosswordPrizes.deploy(owner.address);
  console.log("CrosswordPrizes contract deployed to:", await prizesContract.getAddress());

  // Deploy CrosswordBoard contract
  const CrosswordBoard = await ethers.getContractFactory("CrosswordBoard");
  const boardContract = await CrosswordBoard.deploy(
    owner.address,
    await prizesContract.getAddress(),
    await configContract.getAddress()
  );
  console.log("CrosswordBoard contract deployed to:", await boardContract.getAddress());

  // Wait for deployments to be mined
  await configContract.deploymentTransaction()?.wait();
  await prizesContract.deploymentTransaction()?.wait();
  await boardContract.deploymentTransaction()?.wait();

  // Grant admin roles
  console.log("\nSetting up admin roles...");

  // Grant admin role on CrosswordPrizes
  const ADMIN_ROLE = await prizesContract.ADMIN_ROLE();
  await prizesContract.grantRole(ADMIN_ROLE, admin.address);
  console.log("Granted admin role on CrosswordPrizes to:", admin.address);

  // Add admin to CrosswordBoard
  await boardContract.addAdmin(admin.address);
  console.log("Added admin to CrosswordBoard:", admin.address);

  // Add additional admin address
  const additionalAdmin = "0x66299C18c60CE709777Ec79C73b131cE2634f58e";

  // Add admin to CrosswordBoard
  await boardContract.addAdmin(additionalAdmin);
  console.log("Added admin to CrosswordBoard:", additionalAdmin);

  // Grant admin role on CrosswordPrizes
  const adminRole = await prizesContract.ADMIN_ROLE();
  await prizesContract.grantRole(adminRole, additionalAdmin);
  console.log("Granted admin role on CrosswordPrizes:", additionalAdmin);

  console.log("\nDeployment completed successfully!");
  console.log("Contracts are ready for use:");
  console.log("- Config:", await configContract.getAddress());
  console.log("- CrosswordPrizes:", await prizesContract.getAddress());
  console.log("- CrosswordBoard:", await boardContract.getAddress());

  console.log("\nNext steps:");
  console.log("1. Admin needs to set allowed tokens via setAllowedToken()");
  console.log("2. Admin creates crosswords with prizes via createCrossword()");
  console.log("3. Users solve crosswords and prizes are distributed automatically");
  console.log("4. Admin can configure settings via the admin panel");

  // Display initial configuration
  const maxWinners = await boardContract.getMaxWinnersConfig();
  console.log("\nInitial max winners setting:", maxWinners.toString());

  const returnHomeVisible = await boardContract.isReturnHomeButtonVisible();
  console.log("Return home button visible:", returnHomeVisible);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});