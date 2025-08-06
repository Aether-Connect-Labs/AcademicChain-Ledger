// packages/sdk/src/index.ts
import axios from 'axios';

export class AcademicChainSDK {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, sandbox = false) {
    this.apiKey = apiKey;
    this.baseUrl = sandbox 
      ? 'https://sandbox.api.academicchain.com/v1'
      : 'https://api.academicchain.com/v1';
  }

  async verifyCredential(credentialId: string): Promise<VerificationResult> {
    const response = await axios.get(`${this.baseUrl}/credentials/${credentialId}/verify`, {
      headers: { 'X-API-KEY': this.apiKey }
    });
    return response.data;
  }

  async issueCredential(options: IssueCredentialOptions): Promise<Credential> {
    const response = await axios.post(`${this.baseUrl}/credentials`, options, {
      headers: { 'X-API-KEY': this.apiKey }
    });
    return response.data;
  }

  async listInstitutionCredentials(institutionId: string, filters = {}): Promise<Credential[]> {
    const response = await axios.get(`${this.baseUrl}/institutions/${institutionId}/credentials`, {
      params: filters,
      headers: { 'X-API-KEY': this.apiKey }
    });
    return response.data;
  }

  // ... más métodos
}

// Tipos exportados para los usuarios del SDK
export interface VerificationResult {
  valid: boolean;
  credential: Credential;
  issuer: Institution;
  timestamp: string;
}

export interface Credential {
  id: string;
  type: string;
  issuedDate: string;
  studentId: string;
  metadataUrl: string;
  nftId?: string;
}

export interface IssueCredentialOptions {
  studentId: string;
  credentialType: string;
  metadata: any;
  institutionId: string;
}
