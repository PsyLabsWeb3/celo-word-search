const hre = require("hardhat");

async function main() {
  console.log("Testing basic functionality to confirm access...\n");

  // Get the viem public client and wallet clients
  const publicClient = await hre.viem.getPublicClient();
  const [deployer, admin] = await hre.viem.getWalletClients();
  
  console.log("Using deployer account:", deployer.account.address);

  // Get deployed contracts
  const crosswordBoard = await hre.viem.getContractAt("CrosswordBoard", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");
  const crosswordPrizes = await hre.viem.getContractAt("CrosswordPrizes", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
  const config = await hre.viem.getContractAt("Config", "0x5FbDB2315678afecb367f032d93F642f64180aa3");

  // Check if deployer has DEFAULT_ADMIN_ROLE in CrosswordBoard
  const DEFAULT_ADMIN_ROLE = await crosswordBoard.read.DEFAULT_ADMIN_ROLE();
  const hasDefaultAdmin = await crosswordBoard.read.hasRole([DEFAULT_ADMIN_ROLE, deployer.account.address]);
  console.log("Deployer has DEFAULT_ADMIN_ROLE:", hasDefaultAdmin);

  // Check if deployer has ADMIN_ROLE in CrosswordBoard
  const ADMIN_ROLE = await crosswordBoard.read.ADMIN_ROLE();
  const hasAdmin = await crosswordBoard.read.hasRole([ADMIN_ROLE, deployer.account.address]);
  console.log("Deployer has ADMIN_ROLE:", hasAdmin);

  // Check if deployer has role in the other contracts too
  const prizesAdminRole = await crosswordPrizes.read.ADMIN_ROLE();
  const hasPrizesAdmin = await crosswordPrizes.read.hasRole([prizesAdminRole, deployer.account.address]);
  console.log("Deployer has ADMIN_ROLE in CrosswordPrizes:", hasPrizesAdmin);

  const configAdminRole = await config.read.ADMIN_ROLE();
  const hasConfigAdmin = await config.read.hasRole([configAdminRole, deployer.account.address]);
  console.log("Deployer has ADMIN_ROLE in Config:", hasConfigAdmin);

  // Test if the deployer can call setCrossword (the original function)
  console.log("\nTesting setCrossword function...");
  const testCrosswordId = "0xb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d3a2b1de21b5638";
  const testCrosswordData = JSON.stringify({
    gridSize: { rows: 2, cols: 2 },
    clues: []
  });

  try {
    const tx = await crosswordBoard.write.setCrossword([testCrosswordId, testCrosswordData], {
      account: deployer.account,
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });
    console.log("✓ setCrossword executed successfully");
  } catch (error) {
    console.log("✗ setCrossword failed:", error.message);
  }

  // Test if the deployer can call setMaxWinnersConfig (the original function)
  console.log("\nTesting setMaxWinnersConfig function...");
  try {
    const tx = await crosswordBoard.write.setMaxWinnersConfig([4n], {
      account: deployer.account,
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });
    console.log("✓ setMaxWinnersConfig executed successfully");
  } catch (error) {
    console.log("✗ setMaxWinnersConfig failed:", error.message);
  }

  // Now test the combined function again
  console.log("\nTesting setCrosswordAndMaxWinners function...");
  try {
    const tx = await crosswordBoard.write.setCrosswordAndMaxWinners([
      "0xc20e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d3a2b1de21b5639", 
      JSON.stringify({ gridSize: { rows: 3, cols: 3 }, clues: [] }),
      6n
    ], {
      account: deployer.account,
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });
    console.log("✓ setCrosswordAndMaxWinners executed successfully");
  } catch (error) {
    console.log("✗ setCrosswordAndMaxWinners failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });