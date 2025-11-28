// Test script to create a crossword with native CELO prize pool
const hre = require('hardhat');
const { formatEther, parseEther } = require('viem');
const crypto = require('crypto');

async function main() {
  console.log('Testing crossword creation with native CELO prize pool...');

  // Get contract instance
  const [deployer] = await hre.viem.getWalletClients();
  const contract = await hre.viem.getContractAt('CrosswordBoard', '0x7C2120CbFe182510350d984F531F557Fc5aEA31d');

  // Check deployer address
  console.log('Deployer address:', deployer.account.address);

  // Generate crossword ID and data
  const crosswordData = JSON.stringify({
    gridSize: { rows: 8, cols: 10 },
    clues: [{
      number: 1,
      clue: "Test clue for validation",
      answer: "TESTING",
      row: 0,
      col: 0,
      direction: "across"
    }]
  });

  // Generate crossword ID using crypto
  const crosswordId = '0x' + crypto.createHash('sha256').update(crosswordData).digest('hex');

  console.log('Crossword ID:', crosswordId);
  console.log('Crossword data:', crosswordData);

  // Set parameters
  const newMaxWinners = 2n;
  const prizePool = parseEther('0.01'); // 0.01 CELO
  const winnerPercentages = [5000n, 5000n]; // 50% each for 2 winners
  const endTime = 0n; // No deadline

  console.log('\nTransaction parameters:');
  console.log('- Crossword ID:', crosswordId);
  console.log('- Crossword data length:', crosswordData.length);
  console.log('- New max winners:', Number(newMaxWinners));
  console.log('- Prize pool:', formatEther(prizePool), 'CELO');
  console.log('- Winner percentages:', winnerPercentages.map(p => Number(p)));
  console.log('- End time:', Number(endTime));

  try {
    console.log('\nAttempting to create crossword with native CELO prize pool...');

    // Create crossword with native CELO prize pool
    const txHash = await contract.write.createCrosswordWithNativeCELOPrizePool([
      crosswordId,
      crosswordData,
      newMaxWinners,
      prizePool,
      winnerPercentages,
      endTime
    ], {
      value: prizePool,  // Send the CELO along with the transaction
    });

    console.log('✅ Transaction submitted successfully!');
    console.log('Transaction hash:', txHash);

    // Wait for transaction to be mined
    const publicClient = await hre.viem.getPublicClient();
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    console.log('✅ Transaction mined successfully!');
    console.log('Block number:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed);

    // Check if the crossword was created successfully
    const crosswordDetails = await contract.read.getCrosswordDetails([crosswordId]);
    console.log('\n✅ Crossword created successfully!');
    console.log('Token:', crosswordDetails[0]);
    console.log('Total prize pool:', formatEther(crosswordDetails[1]), 'CELO');
    console.log('Winner percentages:', crosswordDetails[2].map(p => Number(p)));
    console.log('Number of completions:', Number(await contract.read.getCompletionsCountPrizes([crosswordId])));

  } catch (error) {
    console.error('❌ Error creating crossword:', error);
    console.error('Error details:', error.shortMessage || error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });