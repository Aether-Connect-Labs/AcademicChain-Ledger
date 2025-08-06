import { InstitutionRating } from '../../core/src/entities/rating';

// Placeholder for RatingModel - assuming it's a Mongoose model or similar
const RatingModel = {
  find: (query: any) => ({
    sort: (sortQuery: any) => [] // Placeholder for find and sort
  }),
  aggregate: (pipeline: any) => [] as any[], // Placeholder for aggregate
  create: (data: any) => {} // Placeholder for create
};

export class RatingRepository {
  async findByInstitution(institutionId: string): Promise<InstitutionRating[]> {
    return RatingModel.find({ institutionId }).sort({ date: -1 });
  }

  async calculateAverage(institutionId: string): Promise<number> {
    const result = await RatingModel.aggregate([
      { $match: { institutionId } },
      { $group: { _id: null, average: { $avg: "$score" } } }
    ]);
    
    return result[0]?.average || 0;
  }

  async create(rating: InstitutionRating): Promise<void> {
    await RatingModel.create(rating);
  }
}