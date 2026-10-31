/**
 * SupplyChainIQ - Realistic Seed Data Generator
 * Generates:
 * - 30 realistic SKUs across Consumer Electronics, FMCG, and Apparel
 * - 6 months (180 days) of daily BUY and SELL records
 * - Intentional stockout intervals to showcase Stockout-Corrected Demand Imputation
 * - Pre-loaded dirty supplier CSV rows for viva evaluation
 */

import { memoryStore, db, isUsingMongo } from './dataStore.js';
import {
  ProductModel,
  TransactionModel,
  QuarantineLogModel,
  PurchaseOrderModel
} from './schemas.js';

export const CATALOG_PRODUCTS = [
  // Electronics (High Value, moderate velocity)
  { skuCode: 'SKU-ELEC-001', name: 'AeroSound Pro Wireless ANC Headphones', category: 'Consumer Electronics', baseUnit: 'Piece', packConversionRatio: 6, currentStock: 48, avgBuyCost: 65, sellingPrice: 129, supplierName: 'Shenzhen Apex Audio Ltd', avgLeadTimeDays: 14, abcCategory: 'A', velocityCategory: 'Fast', status: 'Reorder Now' },
  { skuCode: 'SKU-ELEC-002', name: 'HyperCharge 100W GaN Travel Adapter', category: 'Consumer Electronics', baseUnit: 'Piece', packConversionRatio: 12, currentStock: 18, avgBuyCost: 22, sellingPrice: 49, supplierName: 'VoltTech Microelectronics', avgLeadTimeDays: 10, abcCategory: 'A', velocityCategory: 'Fast', status: 'Stockout Risk' },
  { skuCode: 'SKU-ELEC-003', name: 'OmniHub 9-in-1 USB-C Docking Station', category: 'Consumer Electronics', baseUnit: 'Piece', packConversionRatio: 10, currentStock: 140, avgBuyCost: 38, sellingPrice: 79, supplierName: 'Shenzhen Apex Audio Ltd', avgLeadTimeDays: 12, abcCategory: 'A', velocityCategory: 'Steady', status: 'Healthy' },
  { skuCode: 'SKU-ELEC-004', name: 'VibeGlow RGB Mechanical Gaming Keyboard', category: 'Consumer Electronics', baseUnit: 'Piece', packConversionRatio: 8, currentStock: 210, avgBuyCost: 45, sellingPrice: 99, supplierName: 'KeyCraft Peripherals Corp', avgLeadTimeDays: 16, abcCategory: 'B', velocityCategory: 'Steady', status: 'Healthy' },
  { skuCode: 'SKU-ELEC-005', name: 'PrecisionPulse Ergonomic Wireless Mouse', category: 'Consumer Electronics', baseUnit: 'Piece', packConversionRatio: 12, currentStock: 520, avgBuyCost: 15, sellingPrice: 39, supplierName: 'KeyCraft Peripherals Corp', avgLeadTimeDays: 8, abcCategory: 'B', velocityCategory: 'Fast', status: 'Overstocked' },
  { skuCode: 'SKU-ELEC-006', name: 'CrystalLens 4K Ultra Webcam with Mic', category: 'Consumer Electronics', baseUnit: 'Piece', packConversionRatio: 6, currentStock: 32, avgBuyCost: 55, sellingPrice: 119, supplierName: 'OptiVision Technologies', avgLeadTimeDays: 15, abcCategory: 'A', velocityCategory: 'Steady', status: 'Reorder Now' },
  { skuCode: 'SKU-ELEC-007', name: 'VoltSafe Smart Surge Protector Strip', category: 'Consumer Electronics', baseUnit: 'Piece', packConversionRatio: 10, currentStock: 95, avgBuyCost: 12, sellingPrice: 28, supplierName: 'VoltTech Microelectronics', avgLeadTimeDays: 7, abcCategory: 'C', velocityCategory: 'Steady', status: 'Healthy' },
  { skuCode: 'SKU-ELEC-008', name: 'AeroCharge MagSafe Wireless Car Mount', category: 'Consumer Electronics', baseUnit: 'Piece', packConversionRatio: 12, currentStock: 12, avgBuyCost: 18, sellingPrice: 38, supplierName: 'VoltTech Microelectronics', avgLeadTimeDays: 9, abcCategory: 'B', velocityCategory: 'Fast', status: 'Stockout Risk' },
  { skuCode: 'SKU-ELEC-009', name: 'BassPounder Portable Bluetooth Speaker', category: 'Consumer Electronics', baseUnit: 'Piece', packConversionRatio: 6, currentStock: 88, avgBuyCost: 30, sellingPrice: 69, supplierName: 'Shenzhen Apex Audio Ltd', avgLeadTimeDays: 12, abcCategory: 'B', velocityCategory: 'Steady', status: 'Healthy' },
  { skuCode: 'SKU-ELEC-010', name: 'StudioMic Cardioid Condenser USB Mic', category: 'Consumer Electronics', baseUnit: 'Piece', packConversionRatio: 6, currentStock: 64, avgBuyCost: 42, sellingPrice: 89, supplierName: 'OptiVision Technologies', avgLeadTimeDays: 14, abcCategory: 'B', velocityCategory: 'Slow', status: 'Healthy' },

  // FMCG / Food & Beverage (High Velocity, lower margin, strict replenishment)
  { skuCode: 'SKU-FMCG-011', name: 'ColdBrew Roast Organic Coffee Blend 1kg', category: 'FMCG & Groceries', baseUnit: 'Pack', packConversionRatio: 12, currentStock: 24, avgBuyCost: 14, sellingPrice: 28, supplierName: 'Andes Direct Harvest Co', avgLeadTimeDays: 6, abcCategory: 'A', velocityCategory: 'Fast', status: 'Stockout Risk' },
  { skuCode: 'SKU-FMCG-012', name: 'PureOat Unsweetened Barista Oat Milk 1L', category: 'FMCG & Groceries', baseUnit: 'Bottle', packConversionRatio: 24, currentStock: 750, avgBuyCost: 1.8, sellingPrice: 3.9, supplierName: 'Nordic Agro Foods', avgLeadTimeDays: 5, abcCategory: 'A', velocityCategory: 'Fast', status: 'Healthy' },
  { skuCode: 'SKU-FMCG-013', name: 'GoldenMatcha Ceremonial Grade Green Tea 100g', category: 'FMCG & Groceries', baseUnit: 'Tin', packConversionRatio: 20, currentStock: 35, avgBuyCost: 18, sellingPrice: 36, supplierName: 'Kyoto Heritage Botanicals', avgLeadTimeDays: 21, abcCategory: 'B', velocityCategory: 'Steady', status: 'Reorder Now' },
  { skuCode: 'SKU-FMCG-014', name: 'ElectroHydrate Electrolyte Drink Mix 30pk', category: 'FMCG & Groceries', baseUnit: 'Box', packConversionRatio: 10, currentStock: 160, avgBuyCost: 11, sellingPrice: 24, supplierName: 'BioSport Nutraceuticals', avgLeadTimeDays: 7, abcCategory: 'A', velocityCategory: 'Fast', status: 'Healthy' },
  { skuCode: 'SKU-FMCG-015', name: 'RawCrunch Artisanal Mixed Nuts & Berries 500g', category: 'FMCG & Groceries', baseUnit: 'Pouch', packConversionRatio: 16, currentStock: 80, avgBuyCost: 8.5, sellingPrice: 17, supplierName: 'SunHarvest Organics', avgLeadTimeDays: 8, abcCategory: 'B', velocityCategory: 'Steady', status: 'Healthy' },
  { skuCode: 'SKU-FMCG-016', name: 'CleanSpark Eco-Friendly Dishwasher Pods 60ct', category: 'FMCG & Household', baseUnit: 'Tub', packConversionRatio: 8, currentStock: 1200, avgBuyCost: 6.2, sellingPrice: 14.5, supplierName: 'EcoPure Cleaners BV', avgLeadTimeDays: 4, abcCategory: 'B', velocityCategory: 'Steady', status: 'Overstocked' },
  { skuCode: 'SKU-FMCG-017', name: 'BambooSoft 3-Ply Recycled Toilet Paper 24pk', category: 'FMCG & Household', baseUnit: 'Bundle', packConversionRatio: 4, currentStock: 90, avgBuyCost: 10, sellingPrice: 22, supplierName: 'EcoPure Cleaners BV', avgLeadTimeDays: 5, abcCategory: 'B', velocityCategory: 'Fast', status: 'Reorder Now' },
  { skuCode: 'SKU-FMCG-018', name: 'OliveCrown Extra Virgin Cold Pressed 750ml', category: 'FMCG & Groceries', baseUnit: 'Bottle', packConversionRatio: 12, currentStock: 110, avgBuyCost: 9.8, sellingPrice: 19.9, supplierName: 'Mediterranean Groves SA', avgLeadTimeDays: 14, abcCategory: 'B', velocityCategory: 'Steady', status: 'Healthy' },
  { skuCode: 'SKU-FMCG-019', name: 'HydraSilk Sulfate-Free Shampoo 400ml', category: 'Personal Care', baseUnit: 'Bottle', packConversionRatio: 16, currentStock: 15, avgBuyCost: 7.5, sellingPrice: 16.5, supplierName: 'DermaLab Care Inc', avgLeadTimeDays: 8, abcCategory: 'C', velocityCategory: 'Steady', status: 'Stockout Risk' },
  { skuCode: 'SKU-FMCG-020', name: 'MintFresh Fluoride-Free Toothpaste 120ml', category: 'Personal Care', baseUnit: 'Tube', packConversionRatio: 24, currentStock: 340, avgBuyCost: 2.5, sellingPrice: 6.5, supplierName: 'DermaLab Care Inc', avgLeadTimeDays: 7, abcCategory: 'C', velocityCategory: 'Steady', status: 'Healthy' },

  // Apparel & Footwear (Seasonal, size variants)
  { skuCode: 'SKU-APPR-021', name: 'AirWeave Technical Performance Running Tee', category: 'Apparel & Footwear', baseUnit: 'Piece', packConversionRatio: 10, currentStock: 25, avgBuyCost: 14, sellingPrice: 38, supplierName: 'TexStyle Prime Manufacturing', avgLeadTimeDays: 18, abcCategory: 'B', velocityCategory: 'Fast', status: 'Stockout Risk' },
  { skuCode: 'SKU-APPR-022', name: 'ThermalShield Waterproof Trail Jacket', category: 'Apparel & Footwear', baseUnit: 'Piece', packConversionRatio: 5, currentStock: 78, avgBuyCost: 52, sellingPrice: 135, supplierName: 'Alpine Apparel Group', avgLeadTimeDays: 24, abcCategory: 'A', velocityCategory: 'Steady', status: 'Healthy' },
  { skuCode: 'SKU-APPR-023', name: 'FlexStride 4-Way Stretch Training Jogger', category: 'Apparel & Footwear', baseUnit: 'Piece', packConversionRatio: 10, currentStock: 45, avgBuyCost: 21, sellingPrice: 58, supplierName: 'TexStyle Prime Manufacturing', avgLeadTimeDays: 16, abcCategory: 'B', velocityCategory: 'Fast', status: 'Reorder Now' },
  { skuCode: 'SKU-APPR-024', name: 'MerinoLoft Wool Seamless Crewneck Sweater', category: 'Apparel & Footwear', baseUnit: 'Piece', packConversionRatio: 6, currentStock: 180, avgBuyCost: 48, sellingPrice: 110, supplierName: 'Alpine Apparel Group', avgLeadTimeDays: 22, abcCategory: 'A', velocityCategory: 'Slow', status: 'Overstocked' },
  { skuCode: 'SKU-APPR-025', name: 'StormGrip All-Weather Hiking Boots', category: 'Apparel & Footwear', baseUnit: 'Pair', packConversionRatio: 6, currentStock: 38, avgBuyCost: 60, sellingPrice: 149, supplierName: 'Vanguard Footwear Ltd', avgLeadTimeDays: 20, abcCategory: 'A', velocityCategory: 'Steady', status: 'Healthy' },
  { skuCode: 'SKU-APPR-026', name: 'CloudFoam Recovery Slide Sandals', category: 'Apparel & Footwear', baseUnit: 'Pair', packConversionRatio: 12, currentStock: 90, avgBuyCost: 12, sellingPrice: 32, supplierName: 'Vanguard Footwear Ltd', avgLeadTimeDays: 14, abcCategory: 'C', velocityCategory: 'Fast', status: 'Healthy' },
  { skuCode: 'SKU-APPR-027', name: 'DryFit Seamless Athletic Crew Socks 3pk', category: 'Apparel & Footwear', baseUnit: 'Pack', packConversionRatio: 20, currentStock: 620, avgBuyCost: 3.5, sellingPrice: 12, supplierName: 'TexStyle Prime Manufacturing', avgLeadTimeDays: 10, abcCategory: 'C', velocityCategory: 'Fast', status: 'Overstocked' },
  { skuCode: 'SKU-APPR-028', name: 'AeroLite Packable Down Puffer Vest', category: 'Apparel & Footwear', baseUnit: 'Piece', packConversionRatio: 6, currentStock: 52, avgBuyCost: 39, sellingPrice: 89, supplierName: 'Alpine Apparel Group', avgLeadTimeDays: 21, abcCategory: 'B', velocityCategory: 'Slow', status: 'Healthy' },
  { skuCode: 'SKU-APPR-029', name: 'HydroShield Roll-Top Waterproof Backpack', category: 'Accessories', baseUnit: 'Piece', packConversionRatio: 8, currentStock: 19, avgBuyCost: 28, sellingPrice: 65, supplierName: 'OptiVision Technologies', avgLeadTimeDays: 15, abcCategory: 'B', velocityCategory: 'Steady', status: 'Stockout Risk' },
  { skuCode: 'SKU-APPR-030', name: 'Polarized Aviator Classic Sunglasses', category: 'Accessories', baseUnit: 'Piece', packConversionRatio: 12, currentStock: 85, avgBuyCost: 19, sellingPrice: 48, supplierName: 'OptiVision Technologies', avgLeadTimeDays: 12, abcCategory: 'C', velocityCategory: 'Slow', status: 'Healthy' },
];

/**
 * Seed historical transactions spanning 180 days (6 months)
 */
export async function seedInitialData() {
  memoryStore.products.clear();
  memoryStore.transactions = [];
  memoryStore.quarantineLogs.clear();
  memoryStore.forecasts.clear();
  memoryStore.purchaseOrders.clear();
  memoryStore.dataQualityMetrics = {
    totalUploadedRows: 1420,
    validRows: 1378,
    quarantinedRows: 42,
    resolvedRows: 38
  };

  // Populate products
  for (const prod of CATALOG_PRODUCTS) {
    memoryStore.products.set(prod.skuCode, { ...prod });
  }

  const today = new Date();
  const daysOfHistory = 180;
  const initialTransactions = [];

  // Generate 6 months of daily BUY and SELL records
  for (const prod of CATALOG_PRODUCTS) {
    let stockLevel = prod.currentStock + 100;
    const baseDailySales = prod.velocityCategory === 'Fast' ? 22 : prod.velocityCategory === 'Steady' ? 12 : 5;

    // Introduce an intentional stockout gap between days 45 and 49 ago for demonstration
    const stockoutStart = 45;
    const stockoutEnd = 49;

    for (let dayOffset = daysOfHistory; dayOffset >= 1; dayOffset--) {
      const txDate = new Date(today);
      txDate.setDate(today.getDate() - dayOffset);
      const dateStr = txDate.toISOString().split('T')[0];

      // Day of week seasonality: weekend sales are ~30% higher
      const dayOfWeek = txDate.getDay();
      const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.35 : 1.0;

      // Intentional stockout period
      const isStockoutDay = (prod.skuCode === 'SKU-ELEC-001' || prod.skuCode === 'SKU-ELEC-002' || prod.skuCode === 'SKU-FMCG-011') &&
                            (dayOffset >= stockoutStart && dayOffset <= stockoutEnd);

      let daySales = 0;
      if (isStockoutDay) {
        daySales = 0;
        stockLevel = 0;
      } else {
        const noise = (Math.random() * 0.4 - 0.2); // +/- 20%
        daySales = Math.max(1, Math.round(baseDailySales * weekendMultiplier * (1 + noise)));
        stockLevel = Math.max(0, stockLevel - daySales);
      }

      // Record daily SELL transaction
      initialTransactions.push({
        skuCode: prod.skuCode,
        type: 'SELL',
        date: dateStr,
        quantity: daySales,
        unitPrice: prod.sellingPrice,
        leadTimeDays: null,
        wasStockoutDay: isStockoutDay,
        promotionalFlag: dayOffset % 28 === 0 // monthly promo
      });

      // Periodically trigger a BUY replenishment order (every 25-35 days or when stock low)
      if (stockLevel <= (prod.avgLeadTimeDays * baseDailySales) || dayOffset % 30 === 0) {
        const orderQty = Math.round(baseDailySales * 30);
        stockLevel += orderQty;

        initialTransactions.push({
          skuCode: prod.skuCode,
          type: 'BUY',
          date: dateStr,
          quantity: orderQty,
          unitPrice: prod.avgBuyCost,
          leadTimeDays: prod.avgLeadTimeDays + Math.floor(Math.random() * 3 - 1),
          wasStockoutDay: false,
          promotionalFlag: false
        });
      }
    }
  }

  // Memory store backup
  memoryStore.transactions = initialTransactions;

  // Sample Purchase Orders
  const samplePOs = [
    {
      poNumber: 'PO-2026-1042',
      skuCode: 'SKU-ELEC-002',
      productName: 'HyperCharge 100W GaN Travel Adapter',
      supplierName: 'VoltTech Microelectronics',
      recommendedQty: 250,
      finalOrderedQty: 250,
      unitCost: 22,
      totalAmount: 5500,
      status: 'ORDERED',
      expectedDeliveryDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0]
    },
    {
      poNumber: 'PO-2026-1043',
      skuCode: 'SKU-FMCG-011',
      productName: 'ColdBrew Roast Organic Coffee Blend 1kg',
      supplierName: 'Andes Direct Harvest Co',
      recommendedQty: 180,
      finalOrderedQty: 200,
      unitCost: 14,
      totalAmount: 2800,
      status: 'DRAFT',
      expectedDeliveryDate: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0]
    }
  ];

  for (const po of samplePOs) {
    memoryStore.purchaseOrders.set(po.poNumber, po);
  }

  // Sample Quarantine Logs
  const sampleQuarantine = [
    {
      uploadBatchId: 'BATCH-VENDOR-FEED-OCT',
      rawRowData: { Item_No: 'SKU-ELEC-001', Type: 'SELL', Date: '2026-10-28', Quantity: -25, UnitPrice: 129, UoM: 'Piece' },
      errorType: 'NEGATIVE_QTY',
      errorDescription: 'Row 14: Quantity -25 cannot be zero or negative.',
      suggestedFix: 'Convert typo to positive integer (+25).',
      status: 'PENDING'
    },
    {
      uploadBatchId: 'BATCH-VENDOR-FEED-OCT',
      rawRowData: { Item_No: 'SKU-ELEC-002', Type: 'SELL', Date: '2026-10-27', Quantity: 3500, UnitPrice: 49, UoM: 'Piece' },
      errorType: 'PRICE_OUTLIER',
      errorDescription: 'Row 31: Spike Alert! Quantity of 3500 is >5x average daily volume (50/day). Extra zero typo.',
      suggestedFix: 'Verify if intention was 350 pieces.',
      status: 'PENDING'
    },
    {
      uploadBatchId: 'BATCH-VENDOR-FEED-OCT',
      rawRowData: { Item_No: 'SKU-FMCG-011', Type: 'SELL', Date: '2026-10-29', Quantity: 15, UnitPrice: 'N/A', UoM: 'Pack' },
      errorType: 'NON_NUMERIC',
      errorDescription: 'Row 48: Unit price "N/A" must be a positive number.',
      suggestedFix: 'Auto-fill with catalog average price ($28.00).',
      status: 'PENDING'
    },
    {
      uploadBatchId: 'BATCH-VENDOR-FEED-OCT',
      rawRowData: { Item_No: 'SKU-ELEC-003', Type: 'SELL', Date: 'INVALID_DATE', Quantity: 10, UnitPrice: 79, UoM: 'Box', packConversionRatio: 10 },
      errorType: 'MISSING_DATE',
      errorDescription: 'Row 62: Invalid or unparseable transaction date "INVALID_DATE".',
      suggestedFix: `Standardize to today's date (${today.toISOString().split('T')[0]}).`,
      status: 'PENDING'
    },
    {
      uploadBatchId: 'BATCH-VENDOR-FEED-OCT',
      rawRowData: { Item_No: 'SKU-ELEC-001', Type: 'SELL', Date: '2026-10-30', Quantity: 8, UnitPrice: 25, UoM: 'Piece' },
      errorType: 'PRICE_BELOW_COST',
      errorDescription: 'Row 75: Sell price ($25) is below average buy cost ($65). Margin leak detected!',
      suggestedFix: 'Adjust to catalog retail price ($129.00).',
      status: 'PENDING'
    }
  ];

  for (let i = 0; i < sampleQuarantine.length; i++) {
    const q = sampleQuarantine[i];
    memoryStore.quarantineLogs.set(`QL-DEMO-00${i + 1}`, { id: `QL-DEMO-00${i + 1}`, ...q, createdAt: new Date().toISOString() });
  }

  // --- Real MongoDB Insertion ---
  if (isUsingMongo()) {
    console.log('🍃 [MongoDB Seeder] Populating collections in database "supplychainiq"...');
    
    // 1. Products
    await ProductModel.deleteMany({});
    await ProductModel.insertMany(CATALOG_PRODUCTS);

    // 2. Transactions
    await TransactionModel.deleteMany({});
    await TransactionModel.insertMany(initialTransactions);

    // 3. Purchase Orders
    await PurchaseOrderModel.deleteMany({});
    await PurchaseOrderModel.insertMany(samplePOs);

    // 4. Quarantine Logs
    await QuarantineLogModel.deleteMany({});
    await QuarantineLogModel.insertMany(sampleQuarantine);

    const prodCount = await ProductModel.countDocuments();
    const txCount = await TransactionModel.countDocuments();
    const poCount = await PurchaseOrderModel.countDocuments();
    const qCount = await QuarantineLogModel.countDocuments();

    console.log(`🍃 [MongoDB Seeder] Successfully committed:
    - Products collection:       ${prodCount} documents
    - Transactions collection:   ${txCount} documents
    - PurchaseOrders collection: ${poCount} documents
    - QuarantineLogs collection: ${qCount} documents
    `);
  } else {
    console.log(`✅ [Seed] Successfully initialized 30 SKUs, ${initialTransactions.length} transactions in memory.`);
  }
}

/**
 * Returns raw CSV text containing 15 messy records for instant viva demo evaluation
 */
export function generateMessySampleCSV() {
  return `Item_No,Type,Trans_Date,Qty_Sold,UnitPrice,UoM,Conversion_Ratio
SKU-ELEC-001,SELL,28/10/2026,14,129.00,Piece,1
SKU-ELEC-001,SELL,29/10/2026,-25,129.00,Piece,1
SKU-ELEC-002,SELL,10/28/2026,3500,49.00,Piece,1
SKU-ELEC-002,SELL,2026-10-29,18,49.00,Carton,12
SKU-FMCG-011,SELL,29/10/2026,15,N/A,Pack,1
SKU-FMCG-011,BUY,2026-10-25,120,14.00,Box,12
SKU-ELEC-003,SELL,INVALID_DATE,8,79.00,Piece,1
SKU-ELEC-001,SELL,2026-10-30,5,25.00,Piece,1
SKU-APPR-021,SELL,2026-10-28,22,38.00,Piece,1
SKU-APPR-022,BUY,2026-10-26,50,52.00,Carton,5
SKU-FMCG-012,SELL,2026-10-30,45,3.90,Bottle,1
SKU-ELEC-004,SELL,2026-10-29,-12,99.00,Piece,1
SKU-APPR-023,SELL,2026-10-30,16,0.00,Piece,1
SKU-ELEC-005,BUY,2026-10-27,200,15.00,Box,12
SKU-FMCG-014,SELL,2026-10-30,28,24.00,Box,10`;
}
