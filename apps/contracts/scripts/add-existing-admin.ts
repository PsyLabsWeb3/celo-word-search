import hre from "hardhat";

async function main() {
  console.log("Adding admin to existing Crossword contracts...");

  // Get wallet clients
  const [owner] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  // Use the deployed addresses
  const crosswordBoardAddress = "0xeC4Fa060BCE3f1021517b9dD4e7f942cF59d5622";
  const crosswordPrizesAddress = "0x80021E63D0B023AB65aD6d815aDbB009Fc58f5A9";
  const configAddress = "0x386749aCfdf00F3c01e0429633fE2a26aB35A3Ec";
  
  // Address to add as admin
  const addressToAddAsAdmin = "0xA35Dc36B55D9A67c8433De7e790074ACC939f39e";

  console.log("Using deployed contracts:");
  console.log("- CrosswordBoard:", crosswordBoardAddress);
  console.log("- CrosswordPrizes:", crosswordPrizesAddress);
  console.log("- Config:", configAddress);
  console.log("- Adding as admin:", addressToAddAsAdmin);

  // Get contract instances with full ABI for encoding function data
  const prizesContractInstance = await hre.ethers.getContractAt("CrosswordPrizes", crosswordPrizesAddress);
  const boardContractInstance = await hre.ethers.getContractAt("CrosswordBoard", crosswordBoardAddress);

  // Get ADMIN_ROLE
  console.log("\nGetting admin roles...");
  const ADMIN_ROLE = await prizesContractInstance.ADMIN_ROLE();
  console.log("ADMIN_ROLE:", ADMIN_ROLE);

  // Check if address already has admin role
  const hasRole = await prizesContractInstance.hasRole(ADMIN_ROLE, addressToAddAsAdmin);
  console.log("Address already has admin role?", hasRole);

  if (!hasRole) {
    console.log(`\nGranting admin role to address: ${addressToAddAsAdmin}...`);
    
    // Grant admin role on CrosswordPrizes
    const grantRoleTx = await owner.sendTransaction({
      to: crosswordPrizesAddress,
      data: prizesContractInstance.interface.encodeFunctionData("grantRole", [ADMIN_ROLE, addressToAddAsAdmin])
    });
    
    await publicClient.waitForTransactionReceipt({ hash: grantRoleTx });
    console.log("✅ Granted admin role on CrosswordPrizes to:", addressToAddAsAdmin);
  } else {
    console.log("Address already has admin role, no need to grant");
  }

  // Check if address is already admin on board
  const boardContractRead = await hre.viem.getContractAt("CrosswordBoard", crosswordBoardAddress);
  const isBoardAdmin = await boardContractRead.read.isAdminAddress([addressToAddAsAdmin]);
  console.log("Address already admin on Board?", isBoardAdmin);

  if (!isBoardAdmin) {
    console.log(`\nAdding address as admin to CrosswordBoard: ${addressToAddAsAdmin}...`);

    const boardAdminTx = await owner.sendTransaction({
      to: crosswordBoardAddress,
      data: boardContractInstance.interface.encodeFunctionData("addAdmin", [addressToAddAsAdmin])
    });
    
    await publicClient.waitForTransactionReceipt({ hash: boardAdminTx });
    console.log("✅ Added admin to CrosswordBoard:", addressToAddAsAdmin);
  } else {
    console.log("Address already admin on Board, no need to add");
  }

  console.log("\n✅ Admin addition process completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });