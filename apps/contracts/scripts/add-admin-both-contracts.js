// Script to add admin address to both CrosswordBoard and CrosswordPrizes contracts
// This script now includes network selection and verification
const hre = require("hardhat");

async function main() {
  // The wallet address to add as admin
  const walletToAdd = "0x66299c18c60ce709777ec79c73b131ce2634f58e";

  // Check the network and get the deployer wallet
  const networkName = hre.network.name;
  console.log("Running on network:", networkName);

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
    console.log("Usage: CROSSWORD_BOARD_ADDRESS=0x... CROSSWORD_PRIZES_ADDRESS=0x... npx hardhat run scripts/add-admin-both-contracts.js --network <network>");
    return;
  }

  if (!CROSSWORD_PRIZES_ADDRESS || CROSSWORD_PRIZES_ADDRESS === "YOUR_CROSSWORD_PRIZES_ADDRESS") {
    console.error("ERROR: Please set CROSSWORD_PRIZES_ADDRESS environment variable with your deployed contract address");
    console.log("Usage: CROSSWORD_BOARD_ADDRESS=0x... CROSSWORD_PRIZES_ADDRESS=0x... npx hardhat run scripts/add-admin-both-contracts.js --network <network>");
    return;
  }

  console.log("CrosswordBoard contract address:", CROSSWORD_BOARD_ADDRESS);
  console.log("CrosswordPrizes contract address:", CROSSWORD_PRIZES_ADDRESS);

  // Verify contracts exist at these addresses
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

  try {
    const bytecodePrizes = await publicClient.getBytecode({ address: CROSSWORD_PRIZES_ADDRESS });
    if (!bytecodePrizes || bytecodePrizes === '0x') {
      console.error("ERROR: No contract found at CrosswordPrizes address:", CROSSWORD_PRIZES_ADDRESS);
      return;
    }
    console.log("✅ CrosswordPrizes contract verified at address:", CROSSWORD_PRIZES_ADDRESS);
  } catch (error) {
    console.error("Error verifying CrosswordPrizes contract:", error.message);
    return;
  }

  // Get contract instances
  const crosswordBoard = await hre.viem.getContractAt("CrosswordBoard", CROSSWORD_BOARD_ADDRESS);
  const crosswordPrizes = await hre.viem.getContractAt("CrosswordPrizes", CROSSWORD_PRIZES_ADDRESS);

  // Add admin to CrosswordBoard contract
  console.log("\n--- Adding admin to CrosswordBoard contract ---");

  try {
    // Check if deployer is already an admin for CrosswordBoard
    let boardIsAdmin = false;
    try {
      boardIsAdmin = await crosswordBoard.read.isAdminAddress([deployer.account.address]);
      console.log("Deployer is CrosswordBoard admin:", boardIsAdmin);
    } catch (error) {
      console.log("Could not check CrosswordBoard admin status, trying owner check...");
      try {
        const ownerAddr = await crosswordBoard.read.owner();
        console.log("Contract owner is:", ownerAddr);
        boardIsAdmin = (ownerAddr.toLowerCase() === deployer.account.address.toLowerCase());
        console.log("Deployer is contract owner:", boardIsAdmin);
      } catch (ownerError) {
        console.error("Could not check contract owner:", ownerError.message);
        return;
      }
    }

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
    let hasDefaultAdminRole = false;
    try {
      const DEFAULT_ADMIN_ROLE = await crosswordPrizes.read.DEFAULT_ADMIN_ROLE();
      hasDefaultAdminRole = await crosswordPrizes.read.hasRole([DEFAULT_ADMIN_ROLE, deployer.account.address]);
      console.log("Deployer has DEFAULT_ADMIN_ROLE:", hasDefaultAdminRole);
    } catch (error) {
      console.log("Could not check DEFAULT_ADMIN_ROLE, checking if deployer is owner...");
      try {
        const ownerAddr = await crosswordPrizes.read.owner();
        console.log("Contract owner is:", ownerAddr);
        hasDefaultAdminRole = (ownerAddr.toLowerCase() === deployer.account.address.toLowerCase());
        console.log("Deployer is contract owner:", hasDefaultAdminRole);
      } catch (ownerError) {
        console.error("Could not check contract owner:", ownerError.message);
      }
    }

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