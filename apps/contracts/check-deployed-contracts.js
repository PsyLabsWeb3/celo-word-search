const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking deployed contract addresses...\n");

  // Contract addresses from the frontend configuration
  const contractAddresses = {
    CrosswordBoard: "0xA84d5f024f5EC2B9e892c48C30De45C0F6b85625",
    CrosswordCore: "0xcCfD51a9ee142Cb3a68e1cB07B60cAd569b2b309",
    CrosswordPrizes: "0x69b6eFb2D48430c4FDC8f363e36359029C437d11",
    UserProfiles: "0x4C3A7A93209668D77Cc4d734E1cF9B0700Aa779F",
    ConfigManager: "0x30EB569228DC341A7e1c7B70920a268464Bf3483",
    AdminManager: "0x0BBeEe782b15854Dbfa022f7b9958471FD970b02",
    PublicCrosswordManager: "0x0af0685D18C1C8687943e8F8F6b60EDA96398913"
  };

  console.log("Checking bytecode for each contract...\n");

  const publicClient = await hre.viem.getPublicClient();

  for (const [name, address] of Object.entries(contractAddresses)) {
    console.log(`Checking ${name} at ${address}...`);
    
    try {
      const code = await publicClient.getBytecode({ address });
      const codeLength = code ? code.length : 0;
      const hasCode = code && code !== "0x" && codeLength > 2;

      console.log(`  Bytecode length: ${codeLength}`);
      console.log(`  Has bytecode: ${hasCode}`);
      
      if (hasCode) {
        console.log(`  ✅ ${name} contract is deployed correctly`);
      } else {
        console.log(`  ❌ ${name} contract is NOT deployed or has no bytecode!`);
      }
      
      console.log("");
    } catch (error) {
      console.log(`  ❌ Error checking ${name}: ${error.message}\n`);
    }
  }

  // Also check the addresses from modularized deployment
  console.log("Checking addresses from modularized deployment file...\n");
  
  const modularAddresses = {
    CrosswordBoard: "0x8ca2028c6fbb885af4070f907b26c0f51eaf9fd2",
    CrosswordCore: "0xa9e2201e966a8afaa62579340ac06065ccd0543c",
    CrosswordPrizes: "0xe438eb3be956923d0803ff96c42a91ea057717c8",
    UserProfiles: "0x503bb7bae0edc3dc1d0d72e42cbdbd2fc168d51d",
    ConfigManager: "0xd2dcd2423ddec663b8d3c9115df689757457137b",
    AdminManager: "0xc45a98bd3251dd77172c48fd85399698cf4acfef",
    PublicCrosswordManager: "0x53a68ee5b843e311b251af18d33a857a804c7ddb"
  };

  for (const [name, address] of Object.entries(modularAddresses)) {
    console.log(`Checking ${name} at ${address}...`);
    
    try {
      const code = await publicClient.getBytecode({ address });
      const codeLength = code ? code.length : 0;
      const hasCode = code && code !== "0x" && codeLength > 2;

      console.log(`  Bytecode length: ${codeLength}`);
      console.log(`  Has bytecode: ${hasCode}`);
      
      if (hasCode) {
        console.log(`  ✅ ${name} contract is deployed correctly`);
      } else {
        console.log(`  ❌ ${name} contract is NOT deployed or has no bytecode!`);
      }
      
      console.log("");
    } catch (error) {
      console.log(`  ❌ Error checking ${name}: ${error.message}\n`);
    }
  }

  // Also check the addresses from sepolia deployment
  console.log("Checking addresses from sepolia deployment file...\n");
  
  const sepoliaAddresses = {
    CrosswordBoard: "0x6e15f23e7f410E250BD221cdB2FB43840354C908"
  };

  for (const [name, address] of Object.entries(sepoliaAddresses)) {
    console.log(`Checking ${name} at ${address}...`);
    
    try {
      const code = await publicClient.getBytecode({ address });
      const codeLength = code ? code.length : 0;
      const hasCode = code && code !== "0x" && codeLength > 2;

      console.log(`  Bytecode length: ${codeLength}`);
      console.log(`  Has bytecode: ${hasCode}`);
      
      if (hasCode) {
        console.log(`  ✅ ${name} contract is deployed correctly`);
      } else {
        console.log(`  ❌ ${name} contract is NOT deployed or has no bytecode!`);
      }
      
      console.log("");
    } catch (error) {
      console.log(`  ❌ Error checking ${name}: ${error.message}\n`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });