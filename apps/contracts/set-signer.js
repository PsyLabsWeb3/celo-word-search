const hre = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "0x560e42112b88b8daa91f7310e7e7ae903572733c";
  
  // Get the signer (deployer wallet)
  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();
  
  console.log("Setting signer on CrosswordBoard contract...");
  console.log("Contract:", CONTRACT_ADDRESS);
  console.log("Deployer:", deployer.account.address);
  
  // Get contract instance
  const contract = await hre.viem.getContractAt(
    "CrosswordBoard",
    CONTRACT_ADDRESS
  );
  
  // Set the signer to be the deployer's address
  console.log("\nSetting signer to:", deployer.account.address);
  
  const hash = await contract.write.setSigner([deployer.account.address]);
  
  console.log("Transaction hash:", hash);
  console.log("Waiting for confirmation...");
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  console.log("\n✅ Signer configured successfully!");
  console.log("Block:", receipt.blockNumber);
  console.log("\nYou can now complete crosswords on the frontend.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
