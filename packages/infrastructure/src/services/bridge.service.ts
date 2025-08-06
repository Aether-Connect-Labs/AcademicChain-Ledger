// packages/infrastructure/src/services/bridge.service.ts
import { injectable } from 'inversify';
import { ethers } from 'ethers';
import { HederaService } from './hedera.service';

@injectable()
export class BridgeService {
  private readonly bridgeContracts: Record<string, any> = {
    ethereum: {
      address: process.env.ETH_BRIDGE_CONTRACT!,
      provider: new ethers.providers.JsonRpcProvider(process.env.ETH_RPC_URL!)
    },
    polygon: {
      address: process.env.POLYGON_BRIDGE_CONTRACT!,
      provider: new ethers.providers.JsonRpcProvider(process.env.POLYGON_RPC_URL!)
    }
  };

  constructor(private hederaService: HederaService) {}

  async lockAndMint(
    sourceChain: string,
    targetChain: string,
    tokenId: string,
    amount: number,
    recipient: string
  ): Promise<string> {
    // 1. Bloquear tokens en la cadena de origen
    const lockTx = await this.lockTokens(sourceChain, tokenId, amount, recipient);
    
    // 2. Esperar confirmaciones (optimista)
    await this.waitForConfirmations(sourceChain, lockTx, 10);
    
    // 3. Mintear tokens equivalentes en la cadena destino
    const mintTx = await this.mintOnTargetChain(targetChain, tokenId, amount, recipient);
    
    return mintTx;
  }

  private async lockTokens(
    chain: string,
    tokenId: string,
    amount: number,
    recipient: string
  ): Promise<string> {
    if (chain === 'hedera') {
      return this.hederaService.transferToken(
        recipient,
        this.bridgeContracts.hedera.lockerAccount,
        tokenId,
        amount
      );
    } else {
      const contract = new ethers.Contract(
        this.bridgeContracts[chain].address,
        ['function lockTokens(address token, uint256 amount, string memory recipient)'],
        this.bridgeContracts[chain].provider.getSigner()
      );
      
      const tx = await contract.lockTokens(tokenId, amount, recipient);
      return tx.hash;
    }
  }

  private async mintOnTargetChain(
    chain: string,
    tokenId: string,
    amount: number,
    recipient: string
  ): Promise<string> {
    if (chain === 'hedera') {
      return this.hederaService.mintToken(tokenId, amount, recipient);
    } else {
      const contract = new ethers.Contract(
        this.bridgeContracts[chain].address,
        ['function mintTokens(address token, uint256 amount, address recipient)'],
        this.bridgeContracts[chain].provider.getSigner()
      );
      
      const tx = await contract.mintTokens(tokenId, amount, recipient);
      return tx.hash;
    }
  }

  private async waitForConfirmations(chain: string, txHash: string, confirmations: number): Promise<void> {
    if (chain === 'hedera') {
      // Hedera tiene confirmaciones inmediatas
      return;
    }
    
    const provider = this.bridgeContracts[chain].provider;
    await provider.waitForTransaction(txHash, confirmations);
  }
}
