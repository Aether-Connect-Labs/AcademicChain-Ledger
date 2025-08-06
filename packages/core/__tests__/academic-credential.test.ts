import { AcademicCredential, CredentialType } from '../src/entities';

describe('AcademicCredential', () => {
  const mockCredential = {
    studentId: 'student-123',
    institutionId: 'institution-456',
    type: CredentialType.DEGREE,
    metadataUri: 'ipfs://Qm...'
  };

  it('should create a valid credential', () => {
    const credential = new AcademicCredential(
      mockCredential.studentId,
      mockCredential.institutionId,
      mockCredential.type,
      mockCredential.metadataUri
    );
    
    expect(credential.id).toBeDefined();
    expect(credential.revoked).toBe(false);
    expect(credential.nftId).toBeNull();
  });

  it('should mark as revoked correctly', () => {
    const credential = new AcademicCredential(
      mockCredential.studentId,
      mockCredential.institutionId,
      mockCredential.type,
      mockCredential.metadataUri
    );
    
    credential.markAsRevoked();
    expect(credential.revoked).toBe(true);
  });

  it('should assign NFT only once', () => {
    const credential = new AcademicCredential(
      mockCredential.studentId,
      mockCredential.institutionId,
      mockCredential.type,
      mockCredential.metadataUri
    );
    
    credential.assignNFT('nft-123');
    expect(credential.nftId).toBe('nft-123');
    
    expect(() => credential.assignNFT('nft-456')).toThrow('NFT already assigned');
  });
});