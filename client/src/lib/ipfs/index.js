import { create } from 'ipfs-http-client';

const client = create({ url: 'http://ipfs:5001/api/v0' });

const IPFSService = {
  uploadMetadata: async (metadata) => {
    const result = await client.add(JSON.stringify(metadata));
    return result.path;
  },
};

export default IPFSService;