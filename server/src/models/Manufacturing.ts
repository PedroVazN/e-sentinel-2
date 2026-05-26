import { Schema, model, Types, InferSchemaType } from 'mongoose';

const manufacturingSchema = new Schema(
  {
    product: { type: Types.ObjectId, ref: 'Product', required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    batchCode: { type: String, default: '' },
    productionDate: { type: Date, default: () => new Date() },
    expirationDate: { type: Date, default: null },
    notes: { type: String, default: '' },
    cost: { type: Number, default: 0, min: 0 },
    operator: { type: String, default: '' },
  },
  { timestamps: true }
);

manufacturingSchema.index({ createdAt: -1 });

export type ManufacturingDoc = InferSchemaType<typeof manufacturingSchema> & {
  _id: string;
};

export const Manufacturing = model('Manufacturing', manufacturingSchema);
