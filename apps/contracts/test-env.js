const fs = require('fs');
const dotenv = require('dotenv');

console.log('Reading .env file directly:');
const envContent = fs.readFileSync('.env', 'utf8');
console.log('Raw content:', JSON.stringify(envContent));
console.log('Content with line breaks shown:');
console.log(envContent);

console.log('\nParsing with dotenv:');
const parsed = dotenv.parse(envContent);
console.log('Parsed result:', parsed);

console.log('\nTrying to load with config:');
const result = dotenv.config();
console.log('Config result:', result);
console.log('process.env.PRIVATE_KEY:', process.env.PRIVATE_KEY ? 'SET' : 'NOT SET');