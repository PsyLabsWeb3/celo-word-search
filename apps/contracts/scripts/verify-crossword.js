// Verification script to check crossword data after creation
const hre = require('hardhat');
const { formatEther } = require('viem');
const crypto = require('crypto');

async function main() {
  console.log('Verifying crossword creation...');

  const contract = await hre.viem.getContractAt('CrosswordBoard', '0x7C2120CbFe182510350d984F531F557Fc5aEA31d');

  // Crossword ID from the transaction
  const crosswordId = '0xa7d265534ee91e54b24be70341d8ea7c03466f68ded3061d20f2ec60842d5743';
  console.log('Checking crossword ID:', crosswordId);

  try {
    // Check the crossword details more specifically
    const crosswordDetails = await contract.read.getCrosswordDetails([crosswordId]);
    
    console.log('\n🔍 Crossword Details:');
    console.log('Token address:', crosswordDetails[0]);
    console.log('Total prize pool (raw):', crosswordDetails[1].toString());
    console.log('Total prize pool (formatted):', formatEther(crosswordDetails[1]), 'CELO');
    console.log('Winner percentages (raw):', crosswordDetails[2]);
    console.log('Winner percentages (formatted):', crosswordDetails[2].map(p => Number(p)));
    console.log('Activation time:', Number(crosswordDetails[4]));
    console.log('End time:', Number(crosswordDetails[5]));
    console.log('State:', Number(crosswordDetails[6])); // 0=Inactive, 1=Active, 2=Complete
    
    // Check completions count
    const completionsCount = await contract.read.getCompletionsCountPrizes([crosswordId]);
    console.log('Number of completions (prizes):', Number(completionsCount));

    // Check current crossword (if it matches)
    const currentCrossword = await contract.read.getCurrentCrossword();
    console.log('\n📋 Current crossword:');
    console.log('Current crossword ID:', currentCrossword[0]);
    console.log('Current crossword data preview:', currentCrossword[1].substring(0, 100) + '...');
    console.log('Updated at:', Number(currentCrossword[2]));

    // Check if IDs match
    const idsMatch = currentCrossword[0] === crosswordId;
    console.log('Crossword IDs match:', idsMatch);

    if (idsMatch) {
      console.log('\n🎉 SUCCESS: Crossword was created and set as current crossword!');
    } else {
      console.log('\n⚠️  WARNING: Crossword was created but not set as current crossword');
    }

    // Check max winners configuration
    const maxWinners = await contract.read.getMaxWinners();
    console.log('\n⚙️  Max winners config:', Number(maxWinners));

  } catch (error) {
    console.error('❌ Error verifying crossword:', error);
    console.error('Error details:', error.shortMessage || error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Verification failed:', error);
    process.exit(1);
  });