import { Schema, model, Types, InferSchemaType } from 'mongoose';

const stockMovementSchema = new Schema(
  {
    product: { type: Types.ObjectId, ref: 'Product', required: true, index: true },
    type: {
      type: String,
      enum: ['entrada', 'saida', 'ajuste', 'fabricacao'],
      required: true,
    },
    quantity: { type: Number, required: true, min: 0 },
    reason: { type: String, default: '' },
    reference: { type: String, default: '' },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    user: { type: String, default: 'sistema' },
  },
  { timestamps: true }
);

stockMovementSchema.index({ createdAt: -1 });

export type StockMovementDoc = InferSchemaType<typeof stockMovementSchema> & {
  _id: string;
};

export const StockMovement = model('StockMovement', stockMovementSchema);
