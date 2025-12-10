// Debug script to test contract function calls directly
const hre = require("hardhat");

async function main() {
  // Wallet address to test
  const walletAddress = "0xA35Dc36B55D9A67c8433De7e790074ACC939f39e";
  
  // Contract address
  const contractAddress = "0xC65D88d46Df1D68e2EcB3a0bb32d81D159D753f1";

  // Check the network
  const networkName = hre.network.name;
  console.log("Testing on network:", networkName);

  console.log("Contract address:", contractAddress);
  console.log("Testing wallet address:", walletAddress);

  // Verify contract exists
  const publicClient = await hre.viem.getPublicClient();
  try {
    const bytecode = await publicClient.getBytecode({ address: contractAddress });
    if (!bytecode || bytecode === '0x') {
      console.error("❌ No contract found at address");
      return;
    }
    console.log("✅ Contract verified at address");
  } catch (error) {
    console.error("❌ Error verifying contract:", error.message);
    return;
  }

  // Get contract instance
  const crosswordBoard = await hre.viem.getContractAt("CrosswordBoard", contractAddress);

  console.log("\n--- Testing all access control functions ---");

  try {
    // Test 1: Check owner
    const owner = await crosswordBoard.read.owner();
    console.log("Contract owner:", owner);
    console.log("Is test wallet the owner?", owner.toLowerCase() === walletAddress.toLowerCase());

    // Test 2: Check ADMIN_ROLE
    const ADMIN_ROLE = await crosswordBoard.read.ADMIN_ROLE();
    console.log("\nADMIN_ROLE:", ADMIN_ROLE);
    const hasAdminRole = await crosswordBoard.read.hasRole([ADMIN_ROLE, walletAddress]);
    console.log("Has ADMIN_ROLE:", hasAdminRole);

    // Test 3: Check DEFAULT_ADMIN_ROLE
    const DEFAULT_ADMIN_ROLE = await crosswordBoard.read.DEFAULT_ADMIN_ROLE();
    console.log("\nDEFAULT_ADMIN_ROLE:", DEFAULT_ADMIN_ROLE);
    const hasDefaultAdminRole = await crosswordBoard.read.hasRole([DEFAULT_ADMIN_ROLE, walletAddress]);
    console.log("Has DEFAULT_ADMIN_ROLE:", hasDefaultAdminRole);

    // Test 4: Check legacy admin status
    const isLegacyAdmin = await crosswordBoard.read.isAdminAddress([walletAddress]);
    console.log("\nIs legacy admin:", isLegacyAdmin);

    // Summary
    console.log("\n--- SUMMARY ---");
    const isAdmin = hasAdminRole || hasDefaultAdminRole || 
                   (owner.toLowerCase() === walletAddress.toLowerCase()) || 
                   isLegacyAdmin;
    console.log("Overall admin status:", isAdmin ? "✅ YES" : "❌ NO");
    
    console.log("\nFor admin access, ANY of these must be true:");
    console.log(`- Is owner: ${owner.toLowerCase() === walletAddress.toLowerCase()}`);
    console.log(`- Has ADMIN_ROLE: ${hasAdminRole}`);
    console.log(`- Has DEFAULT_ADMIN_ROLE: ${hasDefaultAdminRole}`);
    console.log(`- Is legacy admin: ${isLegacyAdmin}`);
    
  } catch (error) {
    console.error("❌ Error during testing:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });