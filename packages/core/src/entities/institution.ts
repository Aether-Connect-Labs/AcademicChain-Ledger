export class AcademicInstitution {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly address: string,
    public readonly publicKey: string,
    public readonly isActive: boolean = true,
    public readonly domains: string[] = []
  ) {}

  validateEmailDomain(email: string): boolean {
    const domain = email.split('@')[1];
    return this.domains.includes(domain);
  }
}