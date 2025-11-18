const fs = require('fs');
const path = require('path');
const solc = require('solc');
const { ethers } = require('ethers');
require('dotenv').config();

async function compile() {
  const contractPath = path.join(__dirname, '..', 'ERC721Academic.sol');
  const source = fs.readFileSync(contractPath, 'utf8');
  const input = {
    language: 'Solidity',
    sources: { 'ERC721Academic.sol': { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } }
    }
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const contract = output.contracts['ERC721Academic.sol']['ERC721Academic'];
  if (!contract) throw new Error('Compilation failed');
  return contract;
}

async function main() {
  const rpcUrl = process.env.HEDERA_RPC_URL;
  const privateKey = process.env.HEDERA_EVM_PRIVATE_KEY;
  if (!rpcUrl || !privateKey) throw new Error('HEDERA_RPC_URL and HEDERA_EVM_PRIVATE_KEY are required');

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = await compile();
  const factory = new ethers.ContractFactory(contract.abi, contract.evm.bytecode.object, wallet);

  const name = process.env.ERC721_NAME || 'AcademicChain Credential';
  const symbol = process.env.ERC721_SYMBOL || 'ACCRED';
  console.log('Deploying ERC721Academic...', { name, symbol });
  const instance = await factory.deploy(name, symbol);
  const receipt = await instance.deploymentTransaction().wait();
  console.log('Deployed at:', instance.target);
  console.log('Tx:', receipt.hash);

  fs.writeFileSync(path.join(__dirname, '..', 'build.json'), JSON.stringify({ address: instance.target, abi: contract.abi }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});