// packages/core/src/entities/academic-credential.ts
import { v4 as uuidv4 } from 'uuid';

export enum CredentialType {
  DEGREE = 'DEGREE',
  DIPLOMA = 'DIPLOMA',
  CERTIFICATE = 'CERTIFICATE'
}

export class AcademicCredential {
  public readonly id: string;
  public readonly nftId: string | null;
  
  constructor(
    public readonly studentId: string,
    public readonly institutionId: string,
    public readonly type: CredentialType,
    public readonly metadataUri: string,
    public readonly issueDate: Date = new Date(),
    public revoked: boolean = false,
    id?: string
  ) {
    this.id = id || uuidv4();
    this.nftId = null;
  }

  markAsRevoked(): void {
    this.revoked = true;
  }

  assignNFT(nftId: string): void {
    if (this.nftId) {
      throw new Error('NFT already assigned');
    }
    this.nftId = nftId;
  }
}