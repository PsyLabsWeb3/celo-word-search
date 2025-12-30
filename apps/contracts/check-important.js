const fs = require('fs');
const abi = JSON.parse(fs.readFileSync('./artifacts/contracts/CrosswordBoard.sol/CrosswordBoard.json', 'utf8')).abi;
const nonPayableFunctions = abi.filter(item => item.type === 'function' && (item.stateMutability === 'nonpayable' || item.stateMutability === 'view'));
console.log('Important non-payable/view functions in CrosswordBoard:');
const importantFunctions = nonPayableFunctions.filter(f => 
  f.name.includes('Crossword') || 
  f.name.includes('Public') || 
  f.name.includes('Active') || 
  f.name.includes('All') ||
  f.name.includes('Complete') ||
  f.name.includes('Claim') ||
  f.name.includes('Winner') ||
  f.name.includes('Profile')
);
importantFunctions.forEach(f => {
  const mut = f.stateMutability;
  console.log(`- ${f.name} (${mut}):`, f.inputs.map(i => `${i.type} ${i.name}`).join(', '));
});