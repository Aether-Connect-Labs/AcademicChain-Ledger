// packages/core/src/services/versioning.service.ts
import { injectable } from 'inversify';

@injectable()
export class VersioningService {
  private currentVersion = '1.0.0';
  private versionSchemas: Record<string, any> = {
    '1.0.0': {
      fields: {
        studentId: { type: 'string', required: true },
        degree: { type: 'string', required: true },
        issueDate: { type: 'date', required: true }
      }
    },
    '1.1.0': {
      fields: {
        studentId: { type: 'string', required: true },
        degree: { type: 'string', required: true },
        major: { type: 'string', required: false },
        issueDate: { type: 'date', required: true },
        expirationDate: { type: 'date', required: false }
      }
    }
  };

  async upgradeCredential(credential: Credential, targetVersion: string): Promise<Credential> {
    if (!this.versionSchemas[targetVersion]) {
      throw new Error(`Target version ${targetVersion} not supported`);
    }

    const currentSchema = this.versionSchemas[credential.version || '1.0.0'];
    const targetSchema = this.versionSchemas[targetVersion];

    // Convertir campos
    const upgradedData = { ...credential.data };
    
    // Añadir nuevos campos con valores por defecto si es necesario
    for (const [field, config] of Object.entries(targetSchema.fields)) {
      if (!(field in upgradedData) && config.required) {
        upgradedData[field] = this.getDefaultValue(config.type);
      }
    }

    return {
      ...credential,
      version: targetVersion,
      data: upgradedData,
      previousVersion: credential.version || '1.0.0',
      upgradedAt: new Date()
    };
  }

  private getDefaultValue(type: string): any {
    switch (type) {
      case 'string': return '';
      case 'number': return 0;
      case 'date': return new Date().toISOString();
      case 'boolean': return false;
      default: return null;
    }
  }

  validateAgainstSchema(credential: Credential): boolean {
    const schema = this.versionSchemas[credential.version || '1.0.0'];
    if (!schema) return false;

    for (const [field, config] of Object.entries(schema.fields)) {
      if (config.required && !(field in credential.data)) {
        return false;
      }
    }

    return true;
  }
}
