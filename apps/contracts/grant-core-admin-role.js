const hre = require("hardhat");

async function main() {
  console.log("🔧 Granting admin role to CrosswordBoard on CrosswordCore...\n");

  // Get deployer
  const [deployer] = await hre.viem.getWalletClients();
  console.log(`Deployer address: ${deployer.account.address}\n`);

  // Get contract instances
  const crosswordBoardAddress = "0x560e42112b88b8daa91f7310e7e7ae903572733c";
  const crosswordCoreAddress = "0x80a70f71d8edbb0ecb951e4a78282a15ae2f1bc3";

  const crosswordCore = await hre.viem.getContractAt("CrosswordCore", crosswordCoreAddress);

  // The keccak256 hash of "ADMIN_ROLE" is pre-calculated
  const adminRole = "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775"; // Hash of "ADMIN_ROLE"
  console.log(`Admin role: ${adminRole}\n`);

  // Grant admin role to CrosswordBoard
  console.log(`Granting admin role to CrosswordBoard: ${crosswordBoardAddress}`);
  
  const txHash = await crosswordCore.write.grantRole([adminRole, crosswordBoardAddress], {
    account: deployer.account,
  });

  console.log(`✅ Transaction submitted: ${txHash}`);
  
  // Wait for transaction to be mined
  const publicClient = await hre.viem.getPublicClient();
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
  
  // Verify the role was granted
  const hasRole = await crosswordCore.read.hasRole([adminRole, crosswordBoardAddress]);
  console.log(`✅ CrosswordBoard has admin role: ${hasRole}`);

  console.log("\n🎉 CrosswordBoard now has admin role on CrosswordCore!");
  console.log("It should now be able to set the current crossword.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Operation failed:", error);
    process.exit(1);
  });