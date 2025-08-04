// Un DID simple podría ser `did:academicchain:hedera-testnet-0.0.123456`
const generateDid = (hederaAccountId) => {
  const network = process.env.HEDERA_NETWORK || 'testnet';
  return `did:academicchain:${network}-${hederaAccountId}`;
};

const parseDid = (did) => {
  const parts = did.split(':');
  if (parts.length !== 3 || parts[0] !== 'did' || parts[1] !== 'academicchain') {
    return null;
  }
  const [network, accountId] = parts[2].split('-');
  return { network, accountId };
};

module.exports = { generateDid, parseDid };