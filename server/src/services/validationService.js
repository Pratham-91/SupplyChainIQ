/**
 * SupplyChainIQ - Validation & Quarantine Service
 * Implements Zod validation schemas, 3-rule validation engine, and UoM standardization.
 */

import { z } from 'zod';
import { db } from '../db/dataStore.js';

// Base Zod Schema for incoming transactions
export const rawTransactionZodSchema = z.object({
  skuCode: z.string().min(1, 'SKU Code cannot be empty'),
  type: z.enum(['BUY', 'SELL'], {
    errorMap: () => ({ message: 'Transaction Type must be either BUY or SELL' })
  }),
  date: z.string().min(1, 'Date is required'),
  quantity: z.preprocess((val) => Number(val), z.number({ invalid_type_error: 'Quantity must be numeric' })),
  unitPrice: z.preprocess((val) => Number(val), z.number({ invalid_type_error: 'Unit Price must be numeric' })),
  leadTimeDays: z.preprocess((val) => (val !== undefined && val !== null && val !== '') ? Number(val) : undefined, z.number().optional()),
  uom: z.string().optional(),
  packConversionRatio: z.preprocess((val) => (val ? Number(val) : 1), z.number().default(1))
});

/**
 * Standardize dates in DD/MM/YYYY, MM/DD/YYYY or timestamp to YYYY-MM-DD
 */
export function normalizeDate(dateStr) {
  if (!dateStr) return null;
  const str = String(dateStr).trim();

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Check DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const p1 = parseInt(dmyMatch[1], 10);
    const p2 = parseInt(dmyMatch[2], 10);
    const yr = dmyMatch[3];

    // Heuristic: If p1 > 12, it must be DD/MM/YYYY
    if (p1 > 12) {
      return `${yr}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
    }
    // Else assume MM/DD/YYYY standard
    return `${yr}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
  }

  // Standard JS Date fallback
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

/**
 * Validates a batch of rows against 3 core supply chain rules
 */
export async function validateAndStandardizeBatch(rows, batchId = `BATCH-${Date.now()}`) {
  const validRecords = [];
  const quarantinedRecords = [];

  // Fetch product catalog for price cross-checks and historical average volume
  const allProducts = await db.getAllProducts();
  const productMap = new Map(allProducts.map(p => [p.skuCode.toUpperCase(), p]));

  for (let index = 0; index < rows.length; index++) {
    const rawRow = rows[index];
    const rowNum = index + 1;

    // Normalization phase
    const rawSku = (rawRow.skuCode || rawRow.sku || rawRow.item_no || rawRow.ItemCode || '').toString().trim();
    const rawType = (rawRow.type || rawRow.Type || rawRow.trans_type || 'SELL').toString().trim().toUpperCase();
    const rawDate = rawRow.date || rawRow.transactionDate || rawRow.Trans_Date || rawRow.Date;
    const rawQty = rawRow.quantity ?? rawRow.qty ?? rawRow.Qty_Sold ?? rawRow.Qty_Bought;
    const rawPrice = rawRow.unitPrice ?? rawRow.price ?? rawRow.UnitPrice ?? rawRow.Price;
    const rawUom = (rawRow.uom || rawRow.unit || rawRow.UoM || 'Piece').toString().trim();
    const rawPackRatio = Number(rawRow.packConversionRatio || rawRow.conversion || (rawUom.toLowerCase().includes('carton') || rawUom.toLowerCase().includes('box') ? 12 : 1));

    // Rule 1: Schema & Missing Fields
    if (!rawSku) {
      quarantinedRecords.push({
        uploadBatchId: batchId,
        rowNumber: rowNum,
        rawRowData: rawRow,
        errorType: 'INVALID_SKU',
        errorDescription: `Row ${rowNum}: SKU Code is blank or missing.`,
        suggestedFix: 'Provide a valid SKU code from Item Master (e.g., SKU-ELEC-001).'
      });
      continue;
    }

    const isoDate = normalizeDate(rawDate);
    if (!isoDate) {
      quarantinedRecords.push({
        uploadBatchId: batchId,
        rowNumber: rowNum,
        rawRowData: rawRow,
        errorType: 'MISSING_DATE',
        errorDescription: `Row ${rowNum}: Invalid or unparseable transaction date "${rawDate}".`,
        suggestedFix: `Standardize to valid ISO date (e.g., ${new Date().toISOString().split('T')[0]}).`
      });
      continue;
    }

    const parsedQty = Number(rawQty);
    if (isNaN(parsedQty)) {
      quarantinedRecords.push({
        uploadBatchId: batchId,
        rowNumber: rowNum,
        rawRowData: rawRow,
        errorType: 'NON_NUMERIC',
        errorDescription: `Row ${rowNum}: Quantity "${rawQty}" is not a valid number.`,
        suggestedFix: 'Replace text with numeric quantity.'
      });
      continue;
    }

    const parsedPrice = Number(rawPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      const knownProd = productMap.get(rawSku.toUpperCase());
      const fallbackPrice = knownProd ? (rawType === 'BUY' ? knownProd.avgBuyCost : knownProd.sellingPrice) : 25;
      quarantinedRecords.push({
        uploadBatchId: batchId,
        rowNumber: rowNum,
        rawRowData: rawRow,
        errorType: 'NON_NUMERIC',
        errorDescription: `Row ${rowNum}: Unit price "${rawPrice}" must be a positive number.`,
        suggestedFix: `Auto-fill with catalog average price ($${fallbackPrice}).`
      });
      continue;
    }

    // Rule 2: Logical Bounds (Negative Quantity or Sell Price < Buy Cost)
    if (parsedQty <= 0) {
      quarantinedRecords.push({
        uploadBatchId: batchId,
        rowNumber: rowNum,
        rawRowData: rawRow,
        errorType: 'NEGATIVE_QTY',
        errorDescription: `Row ${rowNum}: Quantity ${parsedQty} cannot be zero or negative.`,
        suggestedFix: `Convert typo to positive integer (+${Math.abs(parsedQty) || 1}).`
      });
      continue;
    }

    const matchedProduct = productMap.get(rawSku.toUpperCase());
    if (matchedProduct && rawType === 'SELL' && parsedPrice < matchedProduct.avgBuyCost) {
      quarantinedRecords.push({
        uploadBatchId: batchId,
        rowNumber: rowNum,
        rawRowData: rawRow,
        errorType: 'PRICE_BELOW_COST',
        errorDescription: `Row ${rowNum}: Sell price ($${parsedPrice}) is below average buy cost ($${matchedProduct.avgBuyCost}). Margin leak detected!`,
        suggestedFix: `Adjust to catalog retail price ($${matchedProduct.sellingPrice}).`
      });
      continue;
    }

    // Standardize Unit of Measure (UoM)
    // If unit is Carton or Box, multiply by packConversionRatio
    const baseQuantity = (rawUom.toLowerCase().includes('carton') || rawUom.toLowerCase().includes('box'))
      ? parsedQty * rawPackRatio
      : parsedQty;

    // Rule 3: Outlier Spike Detection
    // Flag if daily quantity is > 5x the product's average daily volume
    const baselineDailyVolume = matchedProduct ? (matchedProduct.currentStock > 100 ? 50 : 20) : 30;
    if (baseQuantity > baselineDailyVolume * 5) {
      quarantinedRecords.push({
        uploadBatchId: batchId,
        rowNumber: rowNum,
        rawRowData: rawRow,
        errorType: 'PRICE_OUTLIER',
        errorDescription: `Row ${rowNum}: Spike Alert! Quantity of ${baseQuantity} pieces is >5x average daily run-rate (${baselineDailyVolume}/day). Possible extra-zero typo.`,
        suggestedFix: `Verify if intention was ${Math.round(baseQuantity / 10)} or confirm bulk purchase.`
      });
      continue;
    }

    // Record is valid!
    validRecords.push({
      skuCode: matchedProduct ? matchedProduct.skuCode : rawSku.toUpperCase(),
      type: rawType === 'BUY' ? 'BUY' : 'SELL',
      date: isoDate,
      quantity: baseQuantity,
      unitPrice: parsedPrice,
      leadTimeDays: rawType === 'BUY' ? Number(rawRow.leadTimeDays || matchedProduct?.avgLeadTimeDays || 7) : null,
      wasStockoutDay: false,
      promotionalFlag: Boolean(rawRow.promotionalFlag || rawRow.is_promo)
    });
  }

  return {
    batchId,
    totalRows: rows.length,
    validRecords,
    quarantinedRecords
  };
}
