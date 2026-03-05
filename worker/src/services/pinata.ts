
export class PinataService {
  private jwt: string;
  private gateway: string;

  constructor(jwt: string, gateway: string = 'gateway.pinata.cloud') {
    this.jwt = jwt;
    this.gateway = gateway;
  }

  /**
   * Uploads a JSON object (metadata) to IPFS via Pinata.
   */
  async uploadJSON(data: any): Promise<{ success: boolean; cid?: string; url?: string; error?: string }> {
    if (!this.jwt || this.jwt.includes('placeholder')) {
      console.warn('Pinata JWT missing, returning mock CID');
      return { success: true, cid: 'QmMockCidHash123456789', url: `https://${this.gateway}/ipfs/QmMockCidHash123456789` };
    }

    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.jwt}`
        },
        body: JSON.stringify({
          pinataContent: data,
          pinataMetadata: {
            name: `Certificate-${Date.now()}`
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Pinata API Error: ${response.statusText}`);
      }

      const result: any = await response.json();
      return {
        success: true,
        cid: result.IpfsHash,
        url: `https://${this.gateway}/ipfs/${result.IpfsHash}`
      };
    } catch (e: any) {
      console.error('Pinata Upload Error:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Uploads a file (Blob/Buffer) to IPFS via Pinata.
   * Note: In Cloudflare Workers, use FormData with Blob.
   */
  async uploadFile(fileBlob: Blob, filename: string): Promise<{ success: boolean; cid?: string; url?: string; error?: string }> {
     if (!this.jwt || this.jwt.includes('placeholder')) {
      return { success: true, cid: 'QmMockFileCid987654321', url: `https://${this.gateway}/ipfs/QmMockFileCid987654321` };
    }

    try {
      const formData = new FormData();
      formData.append('file', fileBlob, filename);
      
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.jwt}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Pinata File API Error: ${response.statusText}`);
      }

      const result: any = await response.json();
      return {
         success: true,
         cid: result.IpfsHash,
         url: `https://${this.gateway}/ipfs/${result.IpfsHash}`
      };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}
