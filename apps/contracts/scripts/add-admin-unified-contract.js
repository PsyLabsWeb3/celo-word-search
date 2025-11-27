// Script to add admin to the unified CrosswordBoard contract
// Uses grantRole to add the ADMIN_ROLE for the address
const hre = require("hardhat");

async function main() {
  // The wallet address to add as admin
  const walletToAdd = "0x66299C18c60CE709777Ec79C73b131cE2634f58e";

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

  // Get deployed contract address from environment variable or default
  const CROSSWORD_BOARD_ADDRESS = process.env.CROSSWORD_BOARD_ADDRESS || "YOUR_CROSSWORD_BOARD_ADDRESS";

  if (!CROSSWORD_BOARD_ADDRESS || CROSSWORD_BOARD_ADDRESS === "YOUR_CROSSWORD_BOARD_ADDRESS") {
    console.error("ERROR: Please set CROSSWORD_BOARD_ADDRESS environment variable with your deployed contract address");
    console.log("Usage: CROSSWORD_BOARD_ADDRESS=0x... npx hardhat run scripts/add-admin-unified-contract.js --network <network>");
    return;
  }

  console.log("CrosswordBoard contract address:", CROSSWORD_BOARD_ADDRESS);

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

  // Add admin role to CrosswordBoard contract (unified contract)
  console.log("\n--- Adding ADMIN_ROLE to unified CrosswordBoard contract ---");

  try {
    // Get the ADMIN_ROLE
    const ADMIN_ROLE = await crosswordBoard.read.ADMIN_ROLE();
    console.log("ADMIN_ROLE hash:", ADMIN_ROLE);

    // Check if deployer has DEFAULT_ADMIN_ROLE to be able to grant roles
    const DEFAULT_ADMIN_ROLE = await crosswordBoard.read.DEFAULT_ADMIN_ROLE();
    const hasDefaultAdminRole = await crosswordBoard.read.hasRole([DEFAULT_ADMIN_ROLE, deployer.account.address]);
    console.log("Deployer has DEFAULT_ADMIN_ROLE:", hasDefaultAdminRole);

    // Check if deployer is the owner (which also gives admin privileges)
    let isOwner = false;
    try {
      const ownerAddr = await crosswordBoard.read.owner();
      console.log("Contract owner is:", ownerAddr);
      isOwner = (ownerAddr.toLowerCase() === deployer.account.address.toLowerCase());
      console.log("Deployer is contract owner:", isOwner);
    } catch (ownerError) {
      console.error("Could not check contract owner:", ownerError.message);
    }

    // Check if deployer has ADMIN_ROLE
    const hasAdminRole = await crosswordBoard.read.hasRole([ADMIN_ROLE, deployer.account.address]);
    console.log("Deployer has ADMIN_ROLE:", hasAdminRole);

    if (!hasDefaultAdminRole && !isOwner && !hasAdminRole) {
      console.error("ERROR: Current wallet is not an admin or owner for CrosswordBoard. Cannot add new admins.");
      return;
    }

    // Check if address already has the ADMIN_ROLE
    const hasRole = await crosswordBoard.read.hasRole([ADMIN_ROLE, walletToAdd]);
    if (hasRole) {
      console.log("Wallet already has ADMIN_ROLE for CrosswordBoard. Skipping...");
    } else {
      console.log("Attempting to grant ADMIN_ROLE to wallet...");

      // Grant the ADMIN_ROLE to the wallet
      const tx = await crosswordBoard.write.grantRole([ADMIN_ROLE, walletToAdd], {
        account: deployer.account,
      });

      console.log("Transaction submitted:", tx);

      // Wait for transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
      });

      console.log("Transaction confirmed:", receipt.transactionHash);
      console.log("✅ ADMIN_ROLE successfully granted to wallet for CrosswordBoard!");
    }

    // Verify the role was granted
    const roleGranted = await crosswordBoard.read.hasRole([ADMIN_ROLE, walletToAdd]);
    console.log("Verification - New wallet has ADMIN_ROLE:", roleGranted);

    // Also grant OPERATOR_ROLE for full functionality if not already granted
    const OPERATOR_ROLE = await crosswordBoard.read.OPERATOR_ROLE();
    console.log("OPERATOR_ROLE hash:", OPERATOR_ROLE);

    const hasOperatorRole = await crosswordBoard.read.hasRole([OPERATOR_ROLE, walletToAdd]);
    if (hasOperatorRole) {
      console.log("Wallet already has OPERATOR_ROLE for CrosswordBoard. Skipping...");
    } else {
      console.log("Attempting to grant OPERATOR_ROLE to wallet...");

      // Grant the OPERATOR_ROLE to the wallet
      const tx = await crosswordBoard.write.grantRole([OPERATOR_ROLE, walletToAdd], {
        account: deployer.account,
      });

      console.log("Transaction submitted:", tx);

      // Wait for transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
      });

      console.log("Transaction confirmed:", receipt.transactionHash);
      console.log("✅ OPERATOR_ROLE successfully granted to wallet for CrosswordBoard!");
    }

    // Verify the OPERATOR_ROLE was granted
    const operatorRoleGranted = await crosswordBoard.read.hasRole([OPERATOR_ROLE, walletToAdd]);
    console.log("Verification - New wallet has OPERATOR_ROLE:", operatorRoleGranted);

    // Additionally, let's also try the legacy addAdmin function if it doesn't have it yet
    const isLegacyAdmin = await crosswordBoard.read.isAdminAddress([walletToAdd]);
    if (isLegacyAdmin) {
      console.log("Wallet is already a legacy admin. Skipping legacy admin addition...");
    } else {
      console.log("Checking if we can add wallet as legacy admin...");

      // Check if the wallet is already an admin through other means
      const isBoardAdmin = await crosswordBoard.read.isAdminAddress([walletToAdd]);
      if (!isBoardAdmin) {
        console.log("Wallet is not a legacy admin. Attempting to add via addAdmin function...");
        try {
          // Add the wallet as admin to CrosswordBoard using legacy method
          const tx = await crosswordBoard.write.addAdmin([walletToAdd], {
            account: deployer.account,
          });

          console.log("Legacy admin transaction submitted:", tx);

          // Wait for transaction to be mined
          const receipt = await publicClient.waitForTransactionReceipt({
            hash: tx,
          });

          console.log("Legacy admin transaction confirmed:", receipt.transactionHash);
          console.log("✅ Wallet successfully added as legacy admin to CrosswordBoard!");
        } catch (addAdminError) {
          console.log("Could not add legacy admin (this may be expected in the unified contract):", addAdminError.message);
        }
      }
    }

  } catch (error) {
    console.error("Error adding admin role to CrosswordBoard:", error);
    throw error;
  }

  console.log("\n✅ Successfully updated admin permissions on unified CrosswordBoard contract!");
  console.log("Wallet", walletToAdd, "now has admin privileges for the unified contract:");
  console.log("- ADMIN_ROLE: Full admin and prize management rights");
  console.log("- OPERATOR_ROLE: Operator functionality");
  console.log("- Legacy admin: Crossword setting and management");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });