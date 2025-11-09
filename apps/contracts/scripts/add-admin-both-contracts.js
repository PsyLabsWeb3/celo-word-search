// Script to add admin address to both CrosswordBoard and CrosswordPrizes contracts
const hre = require("hardhat");

async function main() {
  // The wallet address to add as admin
  const walletToAdd = "0x0c9Adb5b5483130F88F10DB4978772986B1E953B";

  // Get the deployer wallet (must be run from an admin account)
  const [deployer] = await hre.viem.getWalletClients();

  if (!deployer) {
    console.error("No deployer account available. Make sure you have set your PRIVATE_KEY in the .env file.");
    process.exit(1);
  }

  console.log("Managing admin access from wallet:", deployer.account.address);
  console.log("Adding wallet as admin:", walletToAdd);

  // Get deployed contract addresses from environment variables or default
  const CROSSWORD_BOARD_ADDRESS = process.env.CROSSWORD_BOARD_ADDRESS || "YOUR_CROSSWORD_BOARD_ADDRESS";
  const CROSSWORD_PRIZES_ADDRESS = process.env.CROSSWORD_PRIZES_ADDRESS || "YOUR_CROSSWORD_PRIZES_ADDRESS";

  if (!CROSSWORD_BOARD_ADDRESS || CROSSWORD_BOARD_ADDRESS === "YOUR_CROSSWORD_BOARD_ADDRESS") {
    console.error("ERROR: Please set CROSSWORD_BOARD_ADDRESS environment variable with your deployed contract address");
    console.log("Usage: CROSSWORD_BOARD_ADDRESS=0x... CROSSWORD_PRIZES_ADDRESS=0x... npm run add-admin-both");
    return;
  }

  if (!CROSSWORD_PRIZES_ADDRESS || CROSSWORD_PRIZES_ADDRESS === "YOUR_CROSSWORD_PRIZES_ADDRESS") {
    console.error("ERROR: Please set CROSSWORD_PRIZES_ADDRESS environment variable with your deployed contract address");
    console.log("Usage: CROSSWORD_BOARD_ADDRESS=0x... CROSSWORD_PRIZES_ADDRESS=0x... npm run add-admin-both");
    return;
  }

  console.log("CrosswordBoard contract address:", CROSSWORD_BOARD_ADDRESS);
  console.log("CrosswordPrizes contract address:", CROSSWORD_PRIZES_ADDRESS);

  // Get contract instances
  const crosswordBoard = await hre.viem.getContractAt("CrosswordBoard", CROSSWORD_BOARD_ADDRESS);
  const crosswordPrizes = await hre.viem.getContractAt("CrosswordPrizes", CROSSWORD_PRIZES_ADDRESS);

  // Get public client for transaction confirmation
  const publicClient = await hre.viem.getPublicClient();

  // Add admin to CrosswordBoard contract
  console.log("\n--- Adding admin to CrosswordBoard contract ---");

  try {
    // Check if deployer is already an admin for CrosswordBoard
    const boardIsAdmin = await crosswordBoard.read.isAdminAddress([deployer.account.address]);
    console.log("Deployer is CrosswordBoard admin:", boardIsAdmin);

    if (!boardIsAdmin) {
      console.error("ERROR: Current wallet is not an admin for CrosswordBoard. Cannot add new admins.");
      return;
    }

    // Check if address is already an admin
    const isAlreadyAdmin = await crosswordBoard.read.isAdminAddress([walletToAdd]);
    if (isAlreadyAdmin) {
      console.log("Wallet is already an admin for CrosswordBoard. Skipping...");
    } else {
      console.log("Attempting to add admin to CrosswordBoard...");
      
      // Add the wallet as admin to CrosswordBoard
      const tx = await crosswordBoard.write.addAdmin([walletToAdd], {
        account: deployer.account,
      });

      console.log("Transaction submitted:", tx);

      // Wait for transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
      });

      console.log("Transaction confirmed:", receipt.transactionHash);
      console.log("✅ Wallet successfully added as admin to CrosswordBoard!");
    }

    // Verify the admin was added
    const newAdminStatus = await crosswordBoard.read.isAdminAddress([walletToAdd]);
    console.log("Verification - New wallet is CrosswordBoard admin:", newAdminStatus);

  } catch (error) {
    console.error("Error adding admin to CrosswordBoard:", error);
    throw error;
  }

  // Add admin role to CrosswordPrizes contract
  console.log("\n--- Adding admin role to CrosswordPrizes contract ---");

  try {
    // Check if deployer has DEFAULT_ADMIN_ROLE for CrosswordPrizes
    const DEFAULT_ADMIN_ROLE = await crosswordPrizes.read.DEFAULT_ADMIN_ROLE();
    const hasDefaultAdminRole = await crosswordPrizes.read.hasRole([DEFAULT_ADMIN_ROLE, deployer.account.address]);
    
    console.log("Deployer has DEFAULT_ADMIN_ROLE:", hasDefaultAdminRole);

    // CrosswordPrizes uses AccessControl, so we need to grant the ADMIN_ROLE
    const ADMIN_ROLE = await crosswordPrizes.read.ADMIN_ROLE();
    console.log("ADMIN_ROLE hash:", ADMIN_ROLE);

    // Check if address already has the role
    const hasRole = await crosswordPrizes.read.hasRole([ADMIN_ROLE, walletToAdd]);
    if (hasRole) {
      console.log("Wallet already has ADMIN_ROLE for CrosswordPrizes. Skipping...");
    } else {
      console.log("Attempting to grant ADMIN_ROLE to wallet...");
      
      // Grant the ADMIN_ROLE to the wallet
      const tx = await crosswordPrizes.write.grantRole([ADMIN_ROLE, walletToAdd], {
        account: deployer.account,
      });

      console.log("Transaction submitted:", tx);

      // Wait for transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
      });

      console.log("Transaction confirmed:", receipt.transactionHash);
      console.log("✅ ADMIN_ROLE successfully granted to wallet for CrosswordPrizes!");
    }

    // Verify the role was granted
    const roleGranted = await crosswordPrizes.read.hasRole([ADMIN_ROLE, walletToAdd]);
    console.log("Verification - New wallet has ADMIN_ROLE:", roleGranted);

    // Also grant OPERATOR_ROLE for full functionality
    const OPERATOR_ROLE = await crosswordPrizes.read.OPERATOR_ROLE();
    console.log("OPERATOR_ROLE hash:", OPERATOR_ROLE);

    const hasOperatorRole = await crosswordPrizes.read.hasRole([OPERATOR_ROLE, walletToAdd]);
    if (hasOperatorRole) {
      console.log("Wallet already has OPERATOR_ROLE for CrosswordPrizes. Skipping...");
    } else {
      console.log("Attempting to grant OPERATOR_ROLE to wallet...");
      
      // Grant the OPERATOR_ROLE to the wallet
      const tx = await crosswordPrizes.write.grantRole([OPERATOR_ROLE, walletToAdd], {
        account: deployer.account,
      });

      console.log("Transaction submitted:", tx);

      // Wait for transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
      });

      console.log("Transaction confirmed:", receipt.transactionHash);
      console.log("✅ OPERATOR_ROLE successfully granted to wallet for CrosswordPrizes!");
    }

    // Verify the OPERATOR_ROLE was granted
    const operatorRoleGranted = await crosswordPrizes.read.hasRole([OPERATOR_ROLE, walletToAdd]);
    console.log("Verification - New wallet has OPERATOR_ROLE:", operatorRoleGranted);

  } catch (error) {
    console.error("Error adding admin role to CrosswordPrizes:", error);
    throw error;
  }

  console.log("\n✅ Successfully added admin to both contracts!");
  console.log("Wallet", walletToAdd, "now has admin privileges for:");
  console.log("- CrosswordBoard: Full crossword management rights");
  console.log("- CrosswordPrizes: ADMIN_ROLE and OPERATOR_ROLE for prize management");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });