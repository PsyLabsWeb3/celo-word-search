const hre = require("hardhat");

async function main() {
  console.log("🔧 Setting the current crossword to the public crossword...\n");

  // Get deployer
  const [deployer] = await hre.viem.getWalletClients();
  console.log(`Deployer address: ${deployer.account.address}\n`);

  // Get the deployed contract
  const crosswordBoardAddress = "0x560e42112b88b8daa91f7310e7e7ae903572733c";
  const crosswordBoard = await hre.viem.getContractAt("CrosswordBoard", crosswordBoardAddress);

  // The crossword ID we created earlier
  const crosswordId = "0x3333333333333333333333333333333333333333333333333333333333333333";
  
  // Get the crossword details to get the crossword data
  try {
    console.log(`Getting details for crossword ID: ${crosswordId}`);
    const details = await crosswordBoard.read.getPublicCrosswordDetails([crosswordId]);
    const crosswordData = details[2]; // crosswordData is at index 2
    
    console.log(`Crossword data length: ${crosswordData.length} characters`);
    console.log(`Crossword name: ${details[0]}`);
    console.log(`Sponsored by: ${details[1]}`);
    
    // Set this crossword as the current crossword in the game
    console.log(`\nSetting crossword as current crossword...`);
    const txHash = await crosswordBoard.write.setCrossword([crosswordId, crosswordData], {
      account: deployer.account,
    });
    
    console.log(`✅ Transaction submitted: ${txHash}`);
    
    // Wait for transaction to be mined
    const publicClient = await hre.viem.getPublicClient();
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
    
    // Verify the current crossword was set
    const [currentId, currentData, updateTime] = await crosswordBoard.read.getCurrentCrossword();
    console.log(`\n✅ Current crossword ID: ${currentId}`);
    console.log(`✅ Current crossword data length: ${currentData.length} characters`);
    console.log(`✅ Last update time: ${new Date(Number(updateTime) * 1000).toISOString()}`);
    
    console.log("\n🎉 The crossword is now set as the current crossword in the game!");
    console.log("Users should now be able to play this crossword from the frontend.");
    
  } catch (error) {
    console.log(`❌ Operation failed: ${error.message}`);
    console.log("This might be expected if the crossword ID doesn't exist or you don't have permission.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Operation failed:", error);
    process.exit(1);
  });