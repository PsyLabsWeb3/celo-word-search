// Verify which address the current PRIVATE_KEY corresponds to
const hre = require('hardhat');

async function main() {
  try {
    const [deployer] = await hre.viem.getWalletClients();
    const address = deployer.account.address;
    
    console.log('========================================');
    console.log('Current PRIVATE_KEY derives to address:');
    console.log(address);
    console.log('========================================');
    console.log('');
    console.log('Expected address: 0xA35Dc36B55D9A67c8433De7e790074ACC939f39e');
    console.log('');
    
    if (address.toLowerCase() === '0xA35Dc36B55D9A67c8433De7e790074ACC939f39e'.toLowerCase()) {
      console.log('✅ PRIVATE_KEY is CORRECT!');
    } else {
      console.log('❌ PRIVATE_KEY is INCORRECT!');
      console.log('Please update the PRIVATE_KEY in .env file');
    }
    
    // Also check balance
    const publicClient = await hre.viem.getPublicClient();
    const balanceWei = await publicClient.getBalance({ address });
    const balanceCelo = Number(balanceWei) / 1e18;
    console.log('');
    console.log(`Current balance: ${balanceCelo.toFixed(4)} CELO`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
