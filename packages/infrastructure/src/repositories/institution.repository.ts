import { AcademicInstitution } from "@core/entities";
import { Model, Schema, model } from 'mongoose';

interface IInstitutionDocument extends AcademicInstitution, Document {}

const InstitutionSchema = new Schema<IInstitutionDocument>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  publicKey: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  domains: { type: [String], default: [] }
});

export const InstitutionModel = model<IInstitutionDocument>('Institution', InstitutionSchema);