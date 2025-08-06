export class CredentialTemplate {
  constructor(
    public readonly id: string,
    public readonly institutionId: string,
    public readonly name: string,
    public readonly fields: TemplateField[],
    public readonly design: TemplateDesign,
    public readonly isActive: boolean = true
  ) {}

  validateData(inputData: Record<string, any>): boolean {
    return this.fields.every(field => {
      if (field.required && !inputData[field.name]) return false;
      if (field.type === 'date' && isNaN(Date.parse(inputData[field.name]))) return false;
      return true;
    });
  }

  applyDesign(data: Record<string, any>): CredentialDesign {
    return {
      ...this.design,
      content: this.design.content.replace(
        /\{\{(\w+)\}\}/g, 
        (_, key) => data[key] || ''
      )
    };
  }
}

interface TemplateField {
  name: string;
  label: string;
  type: 'text' | 'date' | 'number';
  required: boolean;
}

interface TemplateDesign {
  background: string;
  logo?: string;
  content: string;
  styles: Record<string, string>;
}

interface CredentialDesign {
  background: string;
  logo?: string;
  content: string;
  styles: Record<string, string>;
}