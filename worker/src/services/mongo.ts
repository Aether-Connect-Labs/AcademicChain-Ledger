
export class MongoService {
  private apiKey?: string;
  private appId?: string;
  private clusterName?: string;
  private database: string;
  private collection: string;
  private dataSource: string;

  constructor(env: { MONGO_DATA_API_KEY?: string, MONGO_APP_ID?: string, MONGO_CLUSTER_NAME?: string }) {
    this.apiKey = env.MONGO_DATA_API_KEY;
    this.appId = env.MONGO_APP_ID;
    this.clusterName = env.MONGO_CLUSTER_NAME || 'AcademicChainCluster';
    this.database = 'academic-ledger';
    this.collection = 'certificates';
    this.dataSource = 'Cluster0';
  }

  async saveCertificate(record: any): Promise<{ success: boolean; id?: string; error?: string; mode: 'REAL' | 'MOCK' }> {
    // If no API key or placeholder, use Mock mode
    if (!this.apiKey || !this.appId || this.apiKey.includes('placeholder')) {
      console.warn('MongoDB Data API Key missing or placeholder, simulating save.');
      return { 
        success: true, 
        id: 'mongo-' + crypto.randomUUID(), 
        mode: 'MOCK' 
      };
    }

    try {
      const url = `https://data.mongodb-api.com/app/${this.appId}/endpoint/data/v1/action/insertOne`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Request-Headers': '*',
          'api-key': this.apiKey
        },
        body: JSON.stringify({
          collection: this.collection,
          database: this.database,
          dataSource: this.dataSource,
          document: record
        })
      });

      if (!response.ok) {
        throw new Error(`Mongo API Error: ${response.statusText}`);
      }

      const result: any = await response.json();
      return { 
        success: true, 
        id: result.insertedId,
        mode: 'REAL'
      };
    } catch (e: any) {
      console.error('Mongo Save Error:', e);
      return { success: false, error: e.message, mode: 'REAL' };
    }
  }
}
