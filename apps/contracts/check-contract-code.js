const hre = require("hardhat");

async function main() {
  const address = "0x9057D09e0C9cBb863C002FC0E1Af1098df5B7648";
  
  console.log("Checking contract at:", address);
  console.log("Network:", hre.network.name);
  
  const publicClient = await hre.viem.getPublicClient();
  const code = await publicClient.getBytecode({ address });
  
  const codeLength = code ? code.length : 0;
  const hasCode = code && code !== "0x" && codeLength > 2;
  
  console.log("Bytecode length:", codeLength);
  console.log("Has code:", hasCode);
  if (code && codeLength > 100) {
    console.log("First 100 chars:", code.substring(0, 100));
  }
  
  if (!hasCode) {
    console.log("\n❌ ERROR: Contract has no bytecode!");
    console.log("This means the contract was not deployed successfully.");
  } else {
    console.log("\n✅ Contract has bytecode - it's deployed!");
    console.log("The verification API issue is on CeloScan's side.");
    console.log("\nTry verifying again in 5-10 minutes, or verify manually on CeloScan.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
