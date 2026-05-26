import { Schema, model, InferSchemaType } from 'mongoose';

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: '' },
    color: { type: String, default: '#6366f1' },
    icon: { type: String, default: 'package' },
  },
  { timestamps: true }
);

export type CategoryDoc = InferSchemaType<typeof categorySchema> & {
  _id: string;
};

export const Category = model('Category', categorySchema);
