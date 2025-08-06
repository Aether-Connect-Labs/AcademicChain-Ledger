export class InstitutionRating {
  constructor(
    public readonly id: string,
    public readonly institutionId: string,
    public readonly raterId: string,
    public readonly score: number, // 1-5
    public readonly comment: string,
    public readonly date: Date = new Date(),
    public readonly credentialId?: string // Opcional, si está relacionado
  ) {
    if (score < 1 || score > 5) {
      throw new Error('Rating score must be between 1 and 5');
    }
  }
}