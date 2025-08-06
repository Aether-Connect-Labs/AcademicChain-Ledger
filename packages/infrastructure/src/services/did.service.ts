// packages/infrastructure/src/services/did.service.ts
import { injectable } from 'inversify';
import { DID, DIDDocument, Resolver } from 'did-resolver';
import { getResolver } from 'hedera-did-resolver';

@injectable()
export class DIDService {
  private resolver: Resolver;

  constructor() {
    this.resolver = new Resolver({
      ...getResolver({
        client: new Client({
          network: { [process.env.HEDERA_NETWORK!]: process.env.HEDERA_NODE_ADDRESS! }
        })
      })
    });
  }

  async createDID(holder: string): Promise<DIDDocument> {
    const did = `did:hedera:${process.env.HEDERA_NETWORK}:${holder}`;
    const didDocument = {
      "@context": "https://w3id.org/did/v1",
      id: did,
      verificationMethod: [{
        id: `${did}#key-1`,
        type: "Ed25519VerificationKey2018",
        controller: did,
        publicKeyBase58: this.generateKeyPair().publicKey
      }]
    };

    await this.registerDIDOnHedera(did, didDocument);
    return didDocument;
  }

  async resolveDID(did: string): Promise<DIDDocument> {
    return this.resolver.resolve(did);
  }

  async issueVerifiableCredential(
    did: string,
    credentialData: any
  ): Promise<VerifiableCredential> {
    const didDocument = await this.resolveDID(did);
    const credential = {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://academicchain.org/credentials/v1"
      ],
      id: `urn:uuid:${crypto.randomUUID()}`,
      type: ["VerifiableCredential", "AcademicCredential"],
      issuer: process.env.ACADEMICCHAIN_DID!,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: did,
        ...credentialData
      }
    };

    const signedCredential = this.signCredential(credential);
    return signedCredential;
  }

  private async registerDIDOnHedera(did: string, document: DIDDocument): Promise<void> {
    // Implementar registro en Hedera
  }

  private signCredential(credential: any): VerifiableCredential {
    // Implementar firma de credencial
    return credential as VerifiableCredential;
  }

  private generateKeyPair(): any {
    // Placeholder for key generation
    return { publicKey: "placeholder" };
  }
}

interface VerifiableCredential {
  proof?: any;
  publicSignals?: any;
  revealedFields?: string[];
  solidityCalldata?: string;
}
