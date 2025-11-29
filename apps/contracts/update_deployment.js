const fs = require('fs');
const path = require('path');

const artifactPath = path.join(__dirname, 'artifacts/contracts/CrosswordBoard.sol/CrosswordBoard.json');
const deploymentPath = path.join(__dirname, 'web/contracts/sepolia-deployment.json');

const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

deployment.contracts.CrosswordBoard.address = '0x62ADF6a2E788Fbbd66B5da641cAD08Fd96115B8B';
deployment.contracts.CrosswordBoard.abi = artifact.abi;

fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
console.log('Updated sepolia-deployment.json');
