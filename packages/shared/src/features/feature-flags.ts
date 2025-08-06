import { injectable } from 'inversify';
import axios from 'axios';

@injectable()
export class FeatureFlags {
  private flags: Record<string, boolean> = {};
  private lastUpdated: Date | null = null;

  constructor() {
    this.loadFlags();
    setInterval(() => this.loadFlags(), 300000); // Actualizar cada 5 minutos
  }

  private async loadFlags() {
    try {
      const response = await axios.get(process.env.FEATURE_FLAG_SERVICE_URL!);
      this.flags = response.data;
      this.lastUpdated = new Date();
    } catch (error) {
      console.error('Error loading feature flags:', error);
    }
  }

  isEnabled(feature: string): boolean {
    return this.flags[feature] || false;
  }

  getFlags(): Record<string, boolean> {
    return { ...this.flags };
  }
}