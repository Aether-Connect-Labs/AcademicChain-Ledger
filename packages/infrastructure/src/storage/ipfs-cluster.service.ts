import { create } from 'ipfs-http-client';
import { injectable } from 'inversify';

@injectable()
export class IPFSClusterService {
  private ipfs: any;
  private cluster: any;

  constructor() {
    this.ipfs = create({
      url: process.env.IPFS_API_URL || 'http://localhost:5001'
    });

    this.cluster = create({
      url: process.env.IPFS_CLUSTER_URL || 'http://localhost:9094'
    });
  }

  async uploadWithReplication(data: any, replicationFactor = 3): Promise<string> {
    const { cid } = await this.ipfs.add(JSON.stringify(data));
    
    await this.cluster.pin.add(cid, {
      replicationFactorMin: replicationFactor,
      replicationFactorMax: replicationFactor
    });

    return cid.toString();
  }

  async ensurePinned(cid: string): Promise<boolean> {
    const status = await this.cluster.pin.status(cid);
    return status.replicationFactor >= status.replicationFactorMin;
  }
}