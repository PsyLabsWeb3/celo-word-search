// Script to verify admin status of an address on the CrosswordBoard contract
const hre = require("hardhat");

async function main() {
  // The wallet address to check admin status for
  const walletToCheck = "0x66299C18c60CE709777Ec79C73b131cE2634f58e";

  // Check the network
  const networkName = hre.network.name;
  console.log("Checking admin status on network:", networkName);

  // Get deployed contract address from environment variable  
  const CROSSWORD_BOARD_ADDRESS = process.env.CROSSWORD_BOARD_ADDRESS || "YOUR_CROSSWORD_BOARD_ADDRESS";

  if (!CROSSWORD_BOARD_ADDRESS || CROSSWORD_BOARD_ADDRESS === "YOUR_CROSSWORD_BOARD_ADDRESS") {
    console.error("ERROR: Please set CROSSWORD_BOARD_ADDRESS environment variable with your deployed contract address");
    console.log("Usage: CROSSWORD_BOARD_ADDRESS=0x... npx hardhat run scripts/check-admin-status.js --network <network>");
    return;
  }

  console.log("CrosswordBoard contract address:", CROSSWORD_BOARD_ADDRESS);
  console.log("Checking admin status for wallet:", walletToCheck);

  // Verify contract exists at this address
  console.log("\n--- Verifying contract existence ---");
  const publicClient = await hre.viem.getPublicClient();

  try {
    const bytecodeBoard = await publicClient.getBytecode({ address: CROSSWORD_BOARD_ADDRESS });
    if (!bytecodeBoard || bytecodeBoard === '0x') {
      console.error("ERROR: No contract found at CrosswordBoard address:", CROSSWORD_BOARD_ADDRESS);
      return;
    }
    console.log("✅ CrosswordBoard contract verified at address:", CROSSWORD_BOARD_ADDRESS);
  } catch (error) {
    console.error("Error verifying CrosswordBoard contract:", error.message);
    return;
  }

  // Get contract instance
  const crosswordBoard = await hre.viem.getContractAt("CrosswordBoard", CROSSWORD_BOARD_ADDRESS);

  console.log("\n--- Checking admin permissions ---");

  try {
    // Get role hashes
    const ADMIN_ROLE = await crosswordBoard.read.ADMIN_ROLE();
    const DEFAULT_ADMIN_ROLE = await crosswordBoard.read.DEFAULT_ADMIN_ROLE();
    const OPERATOR_ROLE = await crosswordBoard.read.OPERATOR_ROLE();
    
    console.log("ADMIN_ROLE hash:", ADMIN_ROLE);
    console.log("DEFAULT_ADMIN_ROLE hash:", DEFAULT_ADMIN_ROLE);
    console.log("OPERATOR_ROLE hash:", OPERATOR_ROLE);

    // Check each type of permission
    const hasAdminRole = await crosswordBoard.read.hasRole([ADMIN_ROLE, walletToCheck]);
    const hasDefaultAdminRole = await crosswordBoard.read.hasRole([DEFAULT_ADMIN_ROLE, walletToCheck]);
    const hasOperatorRole = await crosswordBoard.read.hasRole([OPERATOR_ROLE, walletToCheck]);
    const isLegacyAdmin = await crosswordBoard.read.isAdminAddress([walletToCheck]);
    const isContractOwner = (await crosswordBoard.read.owner()) === walletToCheck;

    console.log("\n--- Admin Status Results ---");
    console.log("Is Contract Owner:", isContractOwner);
    console.log("Has DEFAULT_ADMIN_ROLE:", hasDefaultAdminRole);
    console.log("Has ADMIN_ROLE:", hasAdminRole);
    console.log("Has OPERATOR_ROLE:", hasOperatorRole);
    console.log("Is Legacy Admin:", isLegacyAdmin);

    // Overall admin status
    const isAdmin = isContractOwner || hasDefaultAdminRole || hasAdminRole || isLegacyAdmin;
    console.log("\n✅ Overall Admin Status:", isAdmin ? "YES - Has admin permissions" : "NO - Does not have admin permissions");

    if (isAdmin) {
      console.log("\n🎉 This wallet has full admin access and can access the /admin page!");
    } else {
      console.log("\n❌ This wallet does not have admin permissions.");
    }

    // Additional useful information
    console.log("\n--- Additional Contract Info ---");
    const allAdmins = await crosswordBoard.read.getAdmins();
    console.log("All legacy admins:", allAdmins);
    
  } catch (error) {
    console.error("Error checking admin status:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });