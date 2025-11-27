const hre = require("hardhat");

// Helper function for a simple delay
const delay = ms => new Promise(res => setTimeout(res, ms));

async function main() {
  const crosswordBoardAddress = "0x0c946a7fb339b4ca130e230f5aa5a8ee0d2cfa74";
  const correctPrizesAddress = "0x80021E63D0B023AB65aD6d815aDbB009Fc58f5A9";

  console.log("Linking CrosswordBoard to the correct CrosswordPrizes contract...");
  console.log(`CrosswordBoard Address: ${crosswordBoardAddress}`);
  console.log(`Correct CrosswordPrizes Address: ${correctPrizesAddress}`);

  // Get CrosswordBoard contract instance
  const crosswordBoard = await hre.viem.getContractAt("CrosswordBoard", crosswordBoardAddress);

  // Get the deployer/owner account
  const [owner] = await hre.viem.getWalletClients();
  console.log(`Using owner account: ${owner.account.address}`);

  console.log("Calling setPrizesContract...");

  const tx = await crosswordBoard.write.setPrizesContract([correctPrizesAddress], {
    account: owner.account
  });

  console.log(`Transaction sent with hash: ${tx}`);
  console.log("Waiting for transaction confirmation...");

  const publicClient = await hre.viem.getPublicClient();
  const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });

  if (receipt.status === 'success') {
    console.log("✅ Transaction confirmed successfully!");
    
    console.log("Waiting for 10 seconds for RPC to sync...");
    await delay(10000);

    console.log("Reading prizesContract address again after delay...");
    const newPrizesAddress = await crosswordBoard.read.prizesContract();
    console.log(`New prizesContract address in CrosswordBoard: ${newPrizesAddress}`);
    if (newPrizesAddress.toLowerCase() === correctPrizesAddress.toLowerCase()) {
      console.log("✅ Contracts linked successfully!");
    } else {
      console.error("❌ ERROR: Contract linking failed. The address was not updated.");
    }
  } else {
    console.error("❌ Transaction failed. Please check the transaction hash on a block explorer.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });