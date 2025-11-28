// Script to check contract state for debugging
const hre = require('hardhat');

async function main() {
  console.log('Checking contract state on Sepolia...');

  // Get the contract instance
  const publicClient = await hre.viem.getPublicClient();
  const contract = await hre.viem.getContractAt('CrosswordBoard', '0xb4af85CD9FC906Cb4daB9b7DD9806CA8a98bB330');
  
  // Check if native CELO (address(0)) is allowed
  const isNativeCeloAllowed = await contract.read.allowedTokens(['0x0000000000000000000000000000000000000000']);
  console.log('✅ Is native CELO allowed:', isNativeCeloAllowed);
  
  // Check if contract is paused
  const isPaused = await contract.read.paused();
  console.log('⏸️  Is contract paused:', isPaused);
  
  // Check maxWinners value
  const maxWinners = await contract.read.maxWinners();
  console.log('🔢 Max winners:', Number(maxWinners));
  
  // Check owner
  const owner = await contract.read.owner();
  console.log('👑 Contract owner:', owner);
  
  // Check if the contract has the right roles set up
  const [deployer] = await hre.viem.getWalletClients();
  console.log('👤 Current deployer address:', deployer ? deployer.account.address : 'N/A');
  
  // Check if native CELO balance is sufficient (not relevant for checking during creation, but good to know)
  const nativeBalance = await publicClient.getBalance({
    address: '0xb4af85CD9FC906Cb4daB9b7DD9806CA8a98bB330'
  });
  console.log('💰 Contract native CELO balance:', nativeBalance.toString(), 'wei');
  
  console.log('\n🔍 Summary:');
  console.log('- Native CELO allowed:', isNativeCeloAllowed ? '✅' : '❌');
  console.log('- Contract paused:', isPaused ? '❌' : '✅');
  console.log('- Max winners set:', Number(maxWinners) > 0 ? '✅' : '❌');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });