import { TokenInfoQuery } from '@hashgraph/sdk';
import HederaClient from './client';

export const verifyCredential = async (tokenId) => {
  const client = HederaClient.getClient();

  const info = await new TokenInfoQuery().setTokenId(tokenId).execute(client);

  const response = await fetch(`https://ipfs.io/ipfs/${info.memo}`);
  const metadata = await response.json();

  return metadata;
};