import { injectable } from 'inversify';
import { groth16 } from 'snarkjs';

interface ZKPProof {
  proof: any;
  publicSignals: any;
  solidityCalldata: string;
}

@injectable()
export class ZKPService {
  async generateProof(input: any, wasmPath: string, zkeyPath: string): Promise<ZKPProof> {
    const { proof, publicSignals } = await groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    );

    return {
      proof,
      publicSignals,
      solidityCalldata: await groth16.exportSolidityCallData(proof, publicSignals)
    };
  }

  async verifyProof(verificationKey: any, proof: ZKPProof): Promise<boolean> {
    return groth16.verify(
      verificationKey,
      proof.publicSignals,
      proof.proof
    );
  }

  async generateAgeProof(credential: any, minAge: number): Promise<ZKPProof> {
    // Implementar circuito específico para verificación de edad
    // Placeholder for now
    return {} as ZKPProof;
  }
}