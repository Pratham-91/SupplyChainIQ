/**
 * SupplyChainIQ - Express REST API Routes
 * Implements the 6 core endpoints + helper endpoints for the Capstone requirements.
 */

import express from 'express';
import { db } from '../db/dataStore.js';
import { validateAndStandardizeBatch } from '../services/validationService.js';
import { getProductTimeSeriesAndForecast, getDashboardFinancialSummary } from '../services/timeSeriesService.js';
import { generateMessySampleCSV, seedInitialData } from '../db/seedData.js';

const router = express.Router();

/**
 * 1. POST /api/upload/parse-and-validate
 * Accepts uploaded CSV JSON, standardizes UoM & dates, runs Zod validation rules,
 * inserts valid rows into transactions, and saves bad rows to quarantine_logs.
 */
router.post('/upload/parse-and-validate', async (req, res) => {
  try {
    const { rows, batchId } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Payload must contain a non-empty "rows" array.' });
    }

    const currentBatchId = batchId || `BATCH-${Date.now()}`;
    const validationResult = await validateAndStandardizeBatch(rows, currentBatchId);

    // Save valid records into transactions
    if (validationResult.validRecords.length > 0) {
      await db.insertTransactions(validationResult.validRecords);
    }

    // Save bad records into quarantine_logs
    for (const badRow of validationResult.quarantinedRecords) {
      await db.insertQuarantineLog(badRow);
    }

    // Record metrics
    db.recordBatchMetrics(
      validationResult.totalRows,
      validationResult.validRecords.length,
      validationResult.quarantinedRecords.length
    );

    return res.status(200).json({
      message: 'Batch standardization and validation complete.',
      batchId: currentBatchId,
      totalRows: validationResult.totalRows,
      validCount: validationResult.validRecords.length,
      quarantinedCount: validationResult.quarantinedRecords.length,
      qualityScore: db.getQualityScore(),
      quarantinedRecords: validationResult.quarantinedRecords
    });
  } catch (error) {
    console.error('Error in /upload/parse-and-validate:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * 2. GET /api/quarantine/logs
 * Fetches all quarantined items (with optional status filter)
 */
router.get('/quarantine/logs', async (req, res) => {
  try {
    const { status } = req.query;
    const logs = await db.getAllQuarantineLogs(status || null);
    return res.json({
      logs,
      total: logs.length,
      pendingCount: logs.filter(l => l.status === 'PENDING').length,
      qualityScore: db.getQualityScore()
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 3. PATCH /api/quarantine/:id/resolve
 * Resolves an individual quarantined row with user inline fix
 */
router.patch('/quarantine/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { fixedData } = req.body;

    const log = await db.getQuarantineLogById(id);
    if (!log) {
      return res.status(404).json({ error: `Quarantine log ${id} not found.` });
    }

    // Re-validate fixed data using batch validator
    const reval = await validateAndStandardizeBatch([fixedData], log.uploadBatchId);
    if (reval.validRecords.length === 0) {
      return res.status(400).json({
        error: 'The submitted fix still contains validation errors.',
        details: reval.quarantinedRecords[0]?.errorDescription
      });
    }

    // Insert into transactions
    const validRec = reval.validRecords[0];
    await db.insertTransactions([validRec]);

    // Mark quarantine log as RESOLVED
    const updatedLog = await db.resolveQuarantineLog(id, validRec);

    return res.json({
      message: 'Quarantine record resolved and merged into transactions.',
      updatedLog,
      qualityScore: db.getQualityScore()
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 4. POST /api/quarantine/auto-fix-all
 * One-click Auto-Fix All bad rows:
 * - Negative quantities converted to absolute positive
 * - Missing/zero prices filled with catalog average price
 * - Missing dates assigned to today's date
 * - 10x volume spike typos scaled down
 */
router.post('/quarantine/auto-fix-all', async (req, res) => {
  try {
    const pendingLogs = await db.getAllQuarantineLogs('PENDING');
    if (pendingLogs.length === 0) {
      return res.json({ message: 'No pending quarantined records to fix.', fixedCount: 0 });
    }

    const allProducts = await db.getAllProducts();
    const productMap = new Map(allProducts.map(p => [p.skuCode.toUpperCase(), p]));

    const fixedTransactions = [];
    const resolvedIds = [];

    for (const log of pendingLogs) {
      const raw = { ...log.rawRowData };
      const sku = (raw.skuCode || raw.sku || raw.item_no || 'SKU-ELEC-001').toUpperCase();
      const product = productMap.get(sku) || allProducts[0];

      // Fix quantity: absolute value and remove extra-zero typo if outlier
      let qty = Math.abs(Number(raw.quantity ?? raw.qty ?? 10)) || 10;
      if (log.errorType === 'PRICE_OUTLIER' && qty > 500) {
        qty = Math.round(qty / 10); // Fix extra zero
      }

      // Fix price: use product average selling or buy price
      let price = Number(raw.unitPrice ?? raw.price ?? 0);
      if (price <= 0 || log.errorType === 'PRICE_BELOW_COST' || log.errorType === 'NON_NUMERIC') {
        price = (raw.type === 'BUY' ? product.avgBuyCost : product.sellingPrice);
      }

      // Fix date
      const date = raw.date || new Date().toISOString().split('T')[0];

      const validRecord = {
        skuCode: product.skuCode,
        type: (raw.type || 'SELL').toUpperCase() === 'BUY' ? 'BUY' : 'SELL',
        date,
        quantity: qty,
        unitPrice: price,
        leadTimeDays: product.avgLeadTimeDays,
        wasStockoutDay: false,
        promotionalFlag: false
      };

      fixedTransactions.push(validRecord);
      resolvedIds.push(log.id);
      await db.resolveQuarantineLog(log.id, validRecord);
    }

    await db.insertTransactions(fixedTransactions);

    return res.json({
      message: `Successfully auto-fixed and merged ${fixedTransactions.length} records.`,
      fixedCount: fixedTransactions.length,
      qualityScore: db.getQualityScore()
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 5. GET /api/dashboard/summary
 * Returns KPI totals, ABC matrix counts, and monthly Buy-vs-Sell cashflow trends
 */
router.get('/dashboard/summary', async (req, res) => {
  try {
    const summary = await getDashboardFinancialSummary();
    return res.json(summary);
  } catch (error) {
    console.error('Error in /dashboard/summary:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 6. GET /api/products
 * Returns all products in catalog
 */
router.get('/products', async (req, res) => {
  try {
    const products = await db.getAllProducts();
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 7. GET /api/products/:sku/timeseries-and-forecast
 * Returns product historical Buy/Sell series, stockout imputation,
 * 3-model forecasting tournament results, Safety Stock, ROP, and Sawtooth Curve.
 */
router.get('/products/:sku/timeseries-and-forecast', async (req, res) => {
  try {
    const { sku } = req.params;
    const result = await getProductTimeSeriesAndForecast(sku.toUpperCase());
    return res.json(result);
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
});

/**
 * 7b. GET /api/forecasting/status
 * Returns Python microservice connectivity, algorithms, and active ML libraries.
 */
router.get('/forecasting/status', async (req, res) => {
  try {
    const pythonBase = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const pyRes = await fetch(`${pythonBase}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (pyRes.ok) {
      const data = await pyRes.json();
      return res.json({
        available: true,
        service: 'Python FastAPI Microservice',
        url: pythonBase,
        ...data
      });
    }
    return res.json({ available: false, fallback: 'Pure JavaScript Engine Active' });
  } catch (err) {
    return res.json({ available: false, fallback: 'Pure JavaScript Engine Active', reason: err.message });
  }
});

/**
 * 7c. GET /api/forecasting/benchmark
 * Returns benchmark tournament results across all SKUs.
 */
router.get('/forecasting/benchmark', async (req, res) => {
  try {
    const pythonBase = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const pyRes = await fetch(`${pythonBase}/api/forecast/tournament/benchmark-all`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (pyRes.ok) {
      const data = await pyRes.json();
      return res.json(data);
    }
    return res.status(503).json({ error: 'Python benchmark service returned error.' });
  } catch (err) {
    return res.status(503).json({ error: 'Python benchmark service unavailable: ' + err.message });
  }
});

/**
 * 8. GET /api/inventory/workbench
 * Returns all products enriched with Days of Inventory (DoI),
 * run-rate demand, safety stock, and status badges.
 */
router.get('/inventory/workbench', async (req, res) => {
  try {
    const products = await db.getAllProducts();
    const enriched = [];

    for (const p of products) {
      // Calculate daily demand run-rate roughly based on stock & status
      const dailyDemand = Math.max(1, Math.round(p.currentStock > 100 ? p.currentStock / 25 : 12));
      const doi = Number((p.currentStock / dailyDemand).toFixed(1));
      const safetyStock = Math.round(dailyDemand * 3);
      const reorderPoint = Math.round((dailyDemand * (p.avgLeadTimeDays || 7)) + safetyStock);

      let status = p.status || 'Healthy';
      if (doi < 7 || p.currentStock <= safetyStock) {
        status = 'Stockout Risk';
      } else if (p.currentStock <= reorderPoint) {
        status = 'Reorder Now';
      } else if (doi > 60) {
        status = 'Overstocked';
      }

      enriched.push({
        ...p,
        dailyDemand,
        daysOfInventory: doi,
        safetyStock,
        reorderPoint,
        calculatedStatus: status,
        recommendedOrderQty: Math.max(50, Math.round(reorderPoint * 1.5))
      });
    }

    return res.json(enriched);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 9. POST /api/purchase-orders/create
 * Creates a replenishment PO from Workbench or What-If Simulator
 */
router.post('/purchase-orders/create', async (req, res) => {
  try {
    const { skuCode, recommendedQty, finalOrderedQty, supplierName, notes } = req.body;
    const product = await db.getProductBySku(skuCode);
    if (!product) {
      return res.status(404).json({ error: `Product ${skuCode} not found.` });
    }

    const orderQty = Number(finalOrderedQty || recommendedQty || 100);
    const unitCost = product.avgBuyCost || 50;
    const totalAmount = orderQty * unitCost;

    const newPO = await db.createPurchaseOrder({
      skuCode: product.skuCode,
      productName: product.name,
      supplierName: supplierName || product.supplierName || 'Primary Global Logistics Ltd.',
      recommendedQty: Number(recommendedQty || orderQty),
      finalOrderedQty: orderQty,
      unitCost,
      totalAmount,
      status: 'DRAFT',
      notes: notes || 'Automated replenishment via SupplyChainIQ Replenishment Workbench'
    });

    return res.status(201).json({
      message: 'Purchase Order generated successfully.',
      purchaseOrder: newPO
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 10. GET /api/purchase-orders
 */
router.get('/purchase-orders', async (req, res) => {
  try {
    const pos = await db.getAllPurchaseOrders();
    return res.json(pos);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 11. PATCH /api/purchase-orders/:id/status
 */
router.patch('/purchase-orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await db.updatePurchaseOrderStatus(id, status);
    if (!updated) {
      return res.status(404).json({ error: `PO ${id} not found.` });
    }
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 12. GET /api/demo/messy-csv
 * Returns 15 pre-loaded dirty rows for instant viva demo evaluation
 */
router.get('/demo/messy-csv', (req, res) => {
  const csvContent = generateMessySampleCSV();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="supplychain_messy_vendor_feed.csv"');
  return res.send(csvContent);
});

/**
 * 13. POST /api/seed/reset
 * Resets database and re-seeds with fresh 6-month historical data
 */
router.post('/seed/reset', async (req, res) => {
  try {
    await seedInitialData();
    return res.json({ message: 'Database successfully re-seeded with 30 SKUs and 6 months of historical transactions.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
