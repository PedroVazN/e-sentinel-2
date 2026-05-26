import { Schema, model, Types, InferSchemaType } from 'mongoose';

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    sku: { type: String, trim: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: '' },
    fragrance: { type: String, default: '' },
    format: { type: String, default: '' },
    netWeight: { type: String, default: '' },
    color: { type: String, default: '' },
    category: { type: Types.ObjectId, ref: 'Category', default: null },
    price: { type: Number, default: 0, min: 0 },
    cost: { type: Number, default: 0, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 0, min: 0 },
    images: { type: [imageSchema], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', fragrance: 'text' });

export type ProductDoc = InferSchemaType<typeof productSchema> & {
  _id: string;
};

export const Product = model('Product', productSchema);
