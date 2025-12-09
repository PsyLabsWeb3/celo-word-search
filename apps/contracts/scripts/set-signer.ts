import { viem } from "hardhat";

async function main() {
  const contractAddress = "0xED0F84f0ec54Bb0Bd6d59bf24AEbfec26bEa5c7C"; // Celo Sepolia
  const [deployer] = await viem.getWalletClients();

  console.log(`Setting signer on contract ${contractAddress} using account ${deployer.account.address}...`);

  const crosswordBoard = await viem.getContractAt("CrosswordBoard", contractAddress);

  // Set the signer to the deployer's address (since they share the same Private Key in this setup)
  const tx = await crosswordBoard.write.setSigner([deployer.account.address]);
  
  console.log(`Transaction sent: ${tx}`);
  
  // Wait for confirmation
  const publicClient = await viem.getPublicClient();
  await publicClient.waitForTransactionReceipt({ hash: tx });

  console.log("Signer set successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
