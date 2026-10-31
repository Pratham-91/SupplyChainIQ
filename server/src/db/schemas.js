/**
 * SupplyChainIQ - MongoDB Mongoose Schemas (Blueprint Compliance)
 */
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// 1. Product Schema (Item Master)
export const ProductSchema = new Schema({
  skuCode: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  baseUnit: { type: String, default: 'Piece' },
  packConversionRatio: { type: Number, default: 1 }, // e.g. 1 Box = 10 Pieces
  currentStock: { type: Number, default: 0 },
  avgBuyCost: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  supplierName: { type: String, required: true },
  avgLeadTimeDays: { type: Number, default: 7 },
  abcCategory: { type: String, enum: ['A', 'B', 'C'], default: 'B' },
  velocityCategory: { type: String, enum: ['Fast', 'Steady', 'Slow'], default: 'Steady' },
  status: {
    type: String,
    enum: ['Healthy', 'Reorder Now', 'Stockout Risk', 'Overstocked'],
    default: 'Healthy'
  }
}, { timestamps: true });

// 2. Transaction Schema (Unified Buy & Sell Time-Series)
export const TransactionSchema = new Schema({
  skuCode: { type: String, required: true, index: true },
  type: { type: String, enum: ['BUY', 'SELL'], required: true },
  date: { type: String, required: true, index: true }, // YYYY-MM-DD
  quantity: { type: Number, required: true }, // Normalized to base unit
  unitPrice: { type: Number, required: true },
  leadTimeDays: { type: Number, default: null }, // for BUY records
  wasStockoutDay: { type: Boolean, default: false },
  promotionalFlag: { type: Boolean, default: false }
}, { timestamps: true });

// 3. Quarantine Log Schema (Validation Errors)
export const QuarantineLogSchema = new Schema({
  uploadBatchId: { type: String, required: true, index: true },
  rawRowData: { type: Schema.Types.Mixed, required: true },
  errorType: {
    type: String,
    enum: [
      'NEGATIVE_QTY',
      'MISSING_DATE',
      'PRICE_OUTLIER',
      'PRICE_BELOW_COST',
      'INVALID_SKU',
      'NON_NUMERIC'
    ],
    required: true
  },
  errorDescription: { type: String, required: true },
  suggestedFix: { type: String },
  status: { type: String, enum: ['PENDING', 'RESOLVED', 'DISCARDED'], default: 'PENDING' },
  resolvedData: { type: Schema.Types.Mixed }
}, { timestamps: true });

// 4. Forecast Schema (Cached Predictions)
export const ForecastSchema = new Schema({
  skuCode: { type: String, required: true, index: true },
  generatedAt: { type: Date, default: Date.now },
  bestModelUsed: { type: String, required: true },
  mapeAccuracy: { type: Number, required: true },
  dailyForecastArray: [{
    date: { type: String, required: true },
    predictedSales: { type: Number, required: true },
    lowerBound: { type: Number, required: true },
    upperBound: { type: Number, required: true }
  }],
  safetyStock: { type: Number, required: true },
  reorderPoint: { type: Number, required: true },
  projectedStockoutDate: { type: String }
}, { timestamps: true });

// 5. Purchase Order Schema (Replenishment Actions)
export const PurchaseOrderSchema = new Schema({
  poNumber: { type: String, required: true, unique: true },
  skuCode: { type: String, required: true, index: true },
  productName: { type: String, required: true },
  supplierName: { type: String, required: true },
  recommendedQty: { type: Number, required: true },
  finalOrderedQty: { type: Number, required: true },
  unitCost: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['DRAFT', 'ORDERED', 'RECEIVED'], default: 'DRAFT' },
  expectedDeliveryDate: { type: String }
}, { timestamps: true });

export const ProductModel = mongoose.models.Product || model('Product', ProductSchema);
export const TransactionModel = mongoose.models.Transaction || model('Transaction', TransactionSchema);
export const QuarantineLogModel = mongoose.models.QuarantineLog || model('QuarantineLog', QuarantineLogSchema);
export const ForecastModel = mongoose.models.Forecast || model('Forecast', ForecastSchema);
export const PurchaseOrderModel = mongoose.models.PurchaseOrder || model('PurchaseOrder', PurchaseOrderSchema);
