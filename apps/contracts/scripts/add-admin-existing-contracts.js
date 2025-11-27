const hre = require("hardhat");

async function main() {
  console.log("Adding admin address to existing contracts...\n");

  // The address to add as admin
  const adminAddress = "0x66299C18c60CE709777Ec79C73b131cE2634f58e";
  console.log("Admin address to add:", adminAddress);

  // Get the wallet client
  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();
  
  console.log("Using deployer address:", deployer.account.address);

  // These are the deployed contract addresses for localhost
  const CROSSWORD_BOARD_ADDRESS = "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0";
  const CROSSWORD_PRIZES_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

  // Load the contracts
  const crosswordBoard = await hre.viem.getContractAt("CrosswordBoard", CROSSWORD_BOARD_ADDRESS);
  const crosswordPrizes = await hre.viem.getContractAt("CrosswordPrizes", CROSSWORD_PRIZES_ADDRESS);

  console.log("CrosswordBoard contract:", CROSSWORD_BOARD_ADDRESS);
  console.log("CrosswordPrizes contract:", CROSSWORD_PRIZES_ADDRESS);

  try {
    // Add admin to CrosswordBoard
    console.log("\nAdding admin to CrosswordBoard...");
    const addAdminTx = await crosswordBoard.write.addAdmin([adminAddress], { account: deployer.account });
    console.log("✅ Successfully added admin to CrosswordBoard");
    console.log("Transaction hash:", addAdminTx);

    // Grant admin role on CrosswordPrizes
    console.log("\nGranting admin role on CrosswordPrizes...");
    const { keccak256, toBytes } = require("viem");
    const adminRole = keccak256(toBytes("ADMIN_ROLE"));
    const grantRoleTx = await crosswordPrizes.write.grantRole([adminRole, adminAddress], { account: deployer.account });
    console.log("✅ Successfully granted admin role on CrosswordPrizes");
    console.log("Transaction hash:", grantRoleTx);

    console.log("\n🎉 Admin address successfully added to both contracts!");
    console.log("The address", adminAddress, "now has admin permissions to access the /admin page.");
  } catch (error) {
    console.error("❌ Error adding admin:", error);
    throw error;
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });