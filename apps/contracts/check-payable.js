const fs = require('fs');
const abi = JSON.parse(fs.readFileSync('./artifacts/contracts/CrosswordBoard.sol/CrosswordBoard.json', 'utf8')).abi;
const payableFunctions = abi.filter(item => item.type === 'function' && item.stateMutability === 'payable');
console.log('Payable functions in CrosswordBoard:');
payableFunctions.forEach(f => {
  console.log(`- ${f.name}:`, f.inputs.map(i => `${i.type} ${i.name}`).join(', '));
});