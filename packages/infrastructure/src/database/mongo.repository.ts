// packages/infrastructure/src/database/mongo.repository.ts
import { AcademicCredential } from "@core/entities";
import { Model, Schema, connect, model } from 'mongoose';

interface ICredentialDocument extends AcademicCredential, Document {}
type CredentialModel = Model<ICredentialDocument>;

const CredentialSchema = new Schema<ICredentialDocument>({
  id: { type: String, required: true, unique: true },
  studentId: { type: String, required: true },
  institutionId: { type: String, required: true },
  type: { type: String, enum: ['DEGREE', 'DIPLOMA', 'CERTIFICATE'], required: true },
  metadataUri: { type: String, required: true },
  issueDate: { type: Date, default: Date.now },
  revoked: { type: Boolean, default: false },
  nftId: { type: String, default: null }
});

export const CredentialModel = model<ICredentialDocument>('Credential', CredentialSchema);

export async function connectDB() {
  await connect(process.env.MONGO_URI!);
  console.log('Connected to MongoDB');
}