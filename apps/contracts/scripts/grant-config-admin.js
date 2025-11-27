const hre = require("hardhat");

async function main() {
  const crosswordBoardAddress = "0x0c946a7fb339b4ca130e230f5aa5a8ee0d2cfa74";
  const configContractAddress = "0x386749aCfdf00F3c01e0429633fE2a26aB35A3Ec";

  console.log("Granting ADMIN_ROLE from Config to CrosswordBoard...");
  console.log(`Config Contract: ${configContractAddress}`);
  console.log(`Board Contract: ${crosswordBoardAddress}`);

  // Get Config contract instance
  const configContract = await hre.viem.getContractAt("Config", configContractAddress);

  // Get ADMIN_ROLE
  const ADMIN_ROLE = await configContract.read.ADMIN_ROLE();
  console.log("ADMIN_ROLE hash:", ADMIN_ROLE);

  // Check if CrosswordBoard already has the admin role
  const hasRole = await configContract.read.hasRole([ADMIN_ROLE, crosswordBoardAddress]);

  if (!hasRole) {
    console.log("CrosswordBoard does not have ADMIN_ROLE on Config contract. Granting...");
    const [owner] = await hre.viem.getWalletClients();
    const tx = await configContract.write.grantRole([ADMIN_ROLE, crosswordBoardAddress], { account: owner.account });
    console.log(`Transaction sent with hash: ${tx}`);
    
    const publicClient = await hre.viem.getPublicClient();
    await publicClient.waitForTransactionReceipt({ hash: tx });
    
    console.log("✅ ADMIN_ROLE granted successfully to CrosswordBoard on Config contract.");
  } else {
    console.log("✅ CrosswordBoard already has ADMIN_ROLE on Config contract.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
