/**
 * SupplyChainIQ - MongoDB Atlas / Local Connection & Data Access Layer
 * Uses Mongoose models as primary storage with automatic local connection
 */

import mongoose from 'mongoose';
import {
  ProductModel,
  TransactionModel,
  QuarantineLogModel,
  ForecastModel,
  PurchaseOrderModel
} from './schemas.js';

let isMongoConnected = false;

// Fallback in-memory state if Mongo is disconnected
export const memoryStore = {
  products: new Map(),
  transactions: [],
  quarantineLogs: new Map(),
  forecasts: new Map(),
  purchaseOrders: new Map(),
  dataQualityMetrics: {
    totalUploadedRows: 1420,
    validRows: 1378,
    quarantinedRows: 42,
    resolvedRows: 38
  }
};

/**
 * Initialize MongoDB connection
 */
export async function initDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/supplychainiq';

  try {
    console.log(`🔌 [MongoDB] Connecting to: ${uri.replace(/\/\/[^@]+@/, '//***:***@')}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isMongoConnected = true;
    console.log('🍃 [MongoDB] Successfully connected to MongoDB Server & Database: "supplychainiq"');
  } catch (err) {
    console.warn(`⚠️ [MongoDB] Connection error (${err.message}). Using resilient in-memory fallback.`);
    isMongoConnected = false;
  }
}

export function isUsingMongo() {
  return isMongoConnected && mongoose.connection.readyState === 1;
}

// ----------------- Unified DB API ----------------- //

export const db = {
  // PRODUCTS
  async getAllProducts() {
    if (isUsingMongo()) {
      return await ProductModel.find({}).sort({ skuCode: 1 }).lean();
    }
    return Array.from(memoryStore.products.values());
  },

  async getProductBySku(skuCode) {
    if (isUsingMongo()) {
      return await ProductModel.findOne({ skuCode: skuCode.toUpperCase() }).lean();
    }
    return memoryStore.products.get(skuCode.toUpperCase()) || null;
  },

  async saveProduct(product) {
    if (isUsingMongo()) {
      return await ProductModel.findOneAndUpdate(
        { skuCode: product.skuCode },
        product,
        { upsert: true, new: true }
      ).lean();
    }
    memoryStore.products.set(product.skuCode, { ...product });
    return product;
  },

  async updateProductStock(skuCode, newStock) {
    if (isUsingMongo()) {
      await ProductModel.updateOne(
        { skuCode: skuCode.toUpperCase() },
        { $set: { currentStock: newStock } }
      );
      return;
    }
    const p = memoryStore.products.get(skuCode);
    if (p) {
      p.currentStock = newStock;
      memoryStore.products.set(skuCode, p);
    }
  },

  // TRANSACTIONS
  async getAllTransactions(filter = {}) {
    if (isUsingMongo()) {
      const query = {};
      if (filter.skuCode) query.skuCode = filter.skuCode;
      if (filter.type) query.type = filter.type;
      if (filter.startDate || filter.endDate) {
        query.date = {};
        if (filter.startDate) query.date.$gte = filter.startDate;
        if (filter.endDate) query.date.$lte = filter.endDate;
      }
      return await TransactionModel.find(query).sort({ date: 1 }).lean();
    }

    let result = [...memoryStore.transactions];
    if (filter.skuCode) result = result.filter(t => t.skuCode === filter.skuCode);
    if (filter.type) result = result.filter(t => t.type === filter.type);
    if (filter.startDate) result = result.filter(t => new Date(t.date) >= new Date(filter.startDate));
    if (filter.endDate) result = result.filter(t => new Date(t.date) <= new Date(filter.endDate));
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  async insertTransactions(records) {
    if (records.length === 0) return 0;

    const formatted = records.map(rec => ({
      skuCode: rec.skuCode,
      type: rec.type,
      date: rec.date.includes('T') ? rec.date.split('T')[0] : rec.date,
      quantity: Number(rec.quantity),
      unitPrice: Number(rec.unitPrice),
      leadTimeDays: rec.leadTimeDays ? Number(rec.leadTimeDays) : null,
      wasStockoutDay: Boolean(rec.wasStockoutDay),
      promotionalFlag: Boolean(rec.promotionalFlag)
    }));

    if (isUsingMongo()) {
      await TransactionModel.insertMany(formatted, { ordered: false });

      // Update current stocks in Mongo
      for (const rec of formatted) {
        const delta = rec.type === 'BUY' ? rec.quantity : -rec.quantity;
        await ProductModel.updateOne(
          { skuCode: rec.skuCode },
          { $inc: { currentStock: delta } }
        );
      }
      return formatted.length;
    }

    for (const item of formatted) {
      memoryStore.transactions.push({
        id: `TX-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        ...item
      });
      const prod = memoryStore.products.get(item.skuCode);
      if (prod) {
        if (item.type === 'BUY') prod.currentStock += item.quantity;
        else if (item.type === 'SELL') prod.currentStock = Math.max(0, prod.currentStock - item.quantity);
        memoryStore.products.set(prod.skuCode, prod);
      }
    }
    return formatted.length;
  },

  // QUARANTINE LOGS
  async getAllQuarantineLogs(statusFilter) {
    if (isUsingMongo()) {
      const query = statusFilter ? { status: statusFilter } : {};
      const logs = await QuarantineLogModel.find(query).sort({ createdAt: -1 }).lean();
      return logs.map(l => ({ ...l, id: l._id.toString() }));
    }

    const logs = Array.from(memoryStore.quarantineLogs.values());
    if (statusFilter) return logs.filter(l => l.status === statusFilter);
    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getQuarantineLogById(id) {
    if (isUsingMongo()) {
      const log = await QuarantineLogModel.findById(id).lean().catch(() => null);
      return log ? { ...log, id: log._id.toString() } : null;
    }
    return memoryStore.quarantineLogs.get(id) || null;
  },

  async insertQuarantineLog(log) {
    if (isUsingMongo()) {
      const created = await QuarantineLogModel.create({
        uploadBatchId: log.uploadBatchId || `BATCH-${Date.now()}`,
        rawRowData: log.rawRowData,
        errorType: log.errorType,
        errorDescription: log.errorDescription,
        suggestedFix: log.suggestedFix,
        status: log.status || 'PENDING'
      });
      return { ...created.toObject(), id: created._id.toString() };
    }

    const id = log.id || `QL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const record = { id, ...log, status: log.status || 'PENDING', createdAt: new Date().toISOString() };
    memoryStore.quarantineLogs.set(id, record);
    return record;
  },

  async resolveQuarantineLog(id, resolvedData) {
    if (isUsingMongo()) {
      const updated = await QuarantineLogModel.findByIdAndUpdate(
        id,
        {
          $set: {
            status: 'RESOLVED',
            resolvedData,
            resolvedAt: new Date().toISOString()
          }
        },
        { new: true }
      ).lean();
      return updated ? { ...updated, id: updated._id.toString() } : null;
    }

    const existing = memoryStore.quarantineLogs.get(id);
    if (!existing) return null;
    existing.status = 'RESOLVED';
    existing.resolvedAt = new Date().toISOString();
    existing.resolvedData = resolvedData;
    memoryStore.quarantineLogs.set(id, existing);
    memoryStore.dataQualityMetrics.resolvedRows += 1;
    return existing;
  },

  // PURCHASE ORDERS
  async getAllPurchaseOrders() {
    if (isUsingMongo()) {
      return await PurchaseOrderModel.find({}).sort({ createdAt: -1 }).lean();
    }
    return Array.from(memoryStore.purchaseOrders.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createPurchaseOrder(po) {
    const poNumber = po.poNumber || `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const doc = {
      poNumber,
      skuCode: po.skuCode,
      productName: po.productName,
      supplierName: po.supplierName,
      recommendedQty: Number(po.recommendedQty),
      finalOrderedQty: Number(po.finalOrderedQty),
      unitCost: Number(po.unitCost),
      totalAmount: Number(po.totalAmount),
      status: po.status || 'DRAFT',
      expectedDeliveryDate: po.expectedDeliveryDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    };

    if (isUsingMongo()) {
      const created = await PurchaseOrderModel.create(doc);
      return created.toObject();
    }

    memoryStore.purchaseOrders.set(poNumber, doc);
    return doc;
  },

  async updatePurchaseOrderStatus(poNumber, status) {
    if (isUsingMongo()) {
      return await PurchaseOrderModel.findOneAndUpdate(
        { poNumber },
        { $set: { status } },
        { new: true }
      ).lean();
    }

    const po = memoryStore.purchaseOrders.get(poNumber);
    if (!po) return null;
    po.status = status;
    memoryStore.purchaseOrders.set(poNumber, po);
    return po;
  },

  // DATA QUALITY METRICS
  getQualityScore() {
    const total = memoryStore.dataQualityMetrics.totalUploadedRows;
    if (total === 0) return 99.7;
    const valid = memoryStore.dataQualityMetrics.validRows + memoryStore.dataQualityMetrics.resolvedRows;
    const score = (valid / total) * 100;
    return Number(Math.min(100, Math.max(0, score)).toFixed(1));
  },

  recordBatchMetrics(total, valid, quarantined) {
    memoryStore.dataQualityMetrics.totalUploadedRows += total;
    memoryStore.dataQualityMetrics.validRows += valid;
    memoryStore.dataQualityMetrics.quarantinedRows += quarantined;
  }
};
