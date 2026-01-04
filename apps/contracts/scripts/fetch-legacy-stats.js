
const { createPublicClient, http, parseAbiItem, formatEther } = require('viem');
const { celo } = require('viem/chains');

async function fetchLegacyStats() {
  const client = createPublicClient({
    chain: celo,
    transport: http("https://forno.celo.org"),
  });

  const legacyAddresses = [
    "0xdC2a624dFFC1f6343F62A02001906252e3cA8fD2",
    "0x9057D09e0C9cBb863C002FC0E1Af1098df5B7648"
  ];

  console.log("Fetching legacy stats...");

  let totalCompletions = 0;
  let totalPrizeDistributions = 0;
  let totalCrosswordsCreated = 0;
  let totalCeloDistributed = 0n;
  let uniqueUsers = new Set();

  for (const address of legacyAddresses) {
    console.log(`Fetching for ${address}...`);
    // Legacy contracts are old, so we scan from a reasonably old block or 0 if needed. 
    // Optimization: 0xdC2a... is older. 
    // Let's use a safe starting block. The route.ts used 52500000n for legacy.
    const fromBlock = 40000000n; 

    const completedEvents = await client.getLogs({
      address: address,
      event: parseAbiItem("event CrosswordCompleted(bytes32 indexed crosswordId, address indexed user, uint256 timestamp, uint256 durationMs)"),
      fromBlock: fromBlock,
      toBlock: "latest",
    });

    const prizeEvents = await client.getLogs({
      address: address,
      event: parseAbiItem("event PrizeDistributed(bytes32 indexed crosswordId, address indexed winner, uint256 amount, uint256 rank)"),
      fromBlock: fromBlock,
      toBlock: "latest",
    });

    const createdEvents = await client.getLogs({
      address: address,
      event: parseAbiItem("event CrosswordCreated(bytes32 indexed crosswordId, address indexed token, uint256 prizePool, address creator)"),
      fromBlock: fromBlock,
      toBlock: "latest",
    });

    console.log(`  Completions: ${completedEvents.length}`);
    console.log(`  Prizes: ${prizeEvents.length}`);
    console.log(`  Created: ${createdEvents.length}`);

    totalCompletions += completedEvents.length;
    totalPrizeDistributions += prizeEvents.length;
    totalCrosswordsCreated += createdEvents.length;
    
    prizeEvents.forEach(e => {
        totalCeloDistributed += (e.args.amount || 0n);
    });
    
    completedEvents.forEach(e => {
        if(e.args.user) uniqueUsers.add(e.args.user);
    });
  }

  console.log("------------------------------------------------");
  console.log("FINAL LEGACY TOTALS TO HARDCODE:");
  console.log(`totalCompletions: ${totalCompletions}`);
  console.log(`totalPrizeDistributions: ${totalPrizeDistributions}`);
  console.log(`totalCrosswordsCreated: ${totalCrosswordsCreated}`);
  console.log(`totalCeloDistributed: ${formatEther(totalCeloDistributed)}`);
  console.log(`uniqueUsersCount: ${uniqueUsers.size}`);
  console.log("------------------------------------------------");
}

fetchLegacyStats();
