const dotenv = require('dotenv');
dotenv.config();

const {
  Client,
  AccountId,
  PrivateKey,
  ContractId,
  ContractExecuteTransaction,
  ContractFunctionParameters
} = require('@hashgraph/sdk');

const crypto = require('crypto');

async function main() {
  const network = process.env.HEDERA_NETWORK || 'testnet';
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  const contractAddress = process.env.ACL_CONTRACT_ADDRESS;

  if (!accountId || !privateKey || !contractAddress) {
    console.error('Faltan variables de entorno: HEDERA_ACCOUNT_ID, HEDERA_PRIVATE_KEY, ACL_CONTRACT_ADDRESS');
    process.exit(1);
  }

  const client =
    network === 'mainnet'
      ? Client.forMainnet()
      : Client.forTestnet();

  const operatorId = AccountId.fromString(accountId);
  const operatorKey = PrivateKey.fromString(privateKey);
  client.setOperator(operatorId, operatorKey);

  const studentAddress = operatorId.toSolidityAddress();

  const uniqueHashBytes = crypto.createHash('sha256').update('Demo Cert ' + Date.now()).digest();
  const ipfsURI = 'ipfs://demo-cert-' + uniqueHashBytes.toString('hex').slice(0, 32);

  const estudiante = 'Alumno Demo ' + Math.floor(Math.random() * 100000);
  const institucion = 'Universidad Demo ' + Math.floor(Math.random() * 100000);
  const fechaEmision = new Date().toISOString().slice(0, 10);
  const hashXRP = crypto.randomBytes(32).toString('hex');
  const hashAlgo = crypto.randomBytes(32).toString('hex');

  const contractId = ContractId.fromSolidityAddress(contractAddress);

  const params = new ContractFunctionParameters()
    .addAddress(studentAddress)
    .addBytes32(uniqueHashBytes)
    .addString(ipfsURI)
    .addString(estudiante)
    .addString(institucion)
    .addString(fechaEmision)
    .addString(hashXRP)
    .addString(hashAlgo);

  const tx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(300000)
    .setFunction('mintTripleCredential', params)
    .freezeWith(client)
    .sign(operatorKey);

  const submit = await tx.execute(client);
  const receipt = await submit.getReceipt(client);

  console.log('Estado Hedera:', receipt.status.toString());
  console.log('uniqueHash:', '0x' + uniqueHashBytes.toString('hex'));
  console.log('estudiante:', estudiante);
  console.log('institucion:', institucion);
  console.log('fechaEmision:', fechaEmision);
  console.log('hashXRP:', hashXRP);
  console.log('hashAlgo:', hashAlgo);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
