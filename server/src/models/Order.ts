import { Schema, model, Types } from 'mongoose';

export type OrderStatus = 'pending' | 'confirmed' | 'cancelled' | 'fulfilled';

interface OrderItem {
  product: Types.ObjectId;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface CustomerInfo {
  name: string;
  company: string;
  phone: string;
  email: string;
  notes: string;
}

export interface OrderDocument {
  _id: Types.ObjectId;
  orderNumber: string;
  status: OrderStatus;
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<OrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, default: '', trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const CustomerSchema = new Schema<CustomerInfo>(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, default: '', trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    notes: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<OrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'fulfilled'],
      default: 'pending',
      index: true,
    },
    customer: { type: CustomerSchema, required: true },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

OrderSchema.index({ createdAt: -1 });

export const Order = model<OrderDocument>('Order', OrderSchema);
