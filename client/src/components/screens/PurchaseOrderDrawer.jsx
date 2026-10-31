import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  X,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { createPurchaseOrder } from '../../services/api.js';

export function PurchaseOrderDrawer({
  isOpen,
  onClose,
  initialProduct,
  onPoCreated
}) {
  const [skuCode, setSkuCode] = useState('');
  const [productName, setProductName] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [orderQty, setOrderQty] = useState(150);
  const [unitCost, setUnitCost] = useState(45);
  const [notes, setNotes] = useState('Authorized inventory replenishment via SupplyChainIQ Automated Ledger');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPo, setCreatedPo] = useState(null);
  const [poError, setPoError] = useState(null);

  React.useEffect(() => {
    if (initialProduct) {
      setSkuCode(initialProduct.skuCode || '');
      setProductName(initialProduct.name || '');
      setSupplierName(initialProduct.supplierName || 'Primary Global Logistics Ltd');
      setOrderQty(initialProduct.recommendedOrderQty || 150);
      setUnitCost(initialProduct.avgBuyCost || 45);
      setCreatedPo(null);
      setPoError(null);
    }
  }, [initialProduct]);

  if (!isOpen) return null;

  const totalAmount = orderQty * unitCost;

  const handleSubmitPO = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await createPurchaseOrder({
        skuCode,
        productName,
        supplierName,
        recommendedQty: orderQty,
        finalOrderedQty: orderQty,
        unitCost,
        totalAmount,
        notes
      });
      setCreatedPo(res.purchaseOrder);
      setPoError(null);
      if (onPoCreated) onPoCreated(res.purchaseOrder);
    } catch (err) {
      setPoError(err.message || 'Failed to create purchase order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadCSV = () => {
    const po = createdPo || {
      poNumber: `PO-${Date.now()}`,
      skuCode,
      productName,
      supplierName,
      finalOrderedQty: orderQty,
      unitCost,
      totalAmount,
      status: 'DRAFT',
      createdAt: new Date().toISOString()
    };

    const csvContent = `PO_Number,SKU,Product_Name,Supplier,Quantity,Unit_Cost_USD,Total_Amount_USD,Status,Date
"${po.poNumber}","${po.skuCode}","${po.productName}","${po.supplierName}",${po.finalOrderedQty},${po.unitCost},${po.totalAmount},"${po.status}","${po.createdAt}"`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PurchaseOrder_${po.poNumber}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 35, stiffness: 350 }}
          className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-white/[0.08] bg-[#0C0C0E] shadow-2xl overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.08] bg-[#0C0C0E]/90 px-6 py-4 backdrop-blur-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] text-white border border-white/[0.08]">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-white">
                  {createdPo ? 'Order Dispatched' : 'Purchase Authorization'}
                </h2>
                <p className="text-[11px] text-neutral-400">
                  {createdPo ? `Reference #${createdPo.poNumber}` : 'Automated Replenishment Protocol'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-neutral-400 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {createdPo ? (
              <div className="space-y-6">
                <div className="apple-card p-6 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/20 mb-3">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    Order Document Dispatched
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    PO <strong className="text-white font-mono">{createdPo.poNumber}</strong> synchronized into active inventory ledger.
                  </p>
                </div>

                {/* Printable Apple-style Voucher */}
                <div className="rounded-2xl border border-white/[0.08] bg-black p-6 space-y-4 shadow-apple-card">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                    <div>
                      <span className="text-[10px] font-semibold text-neutral-500 tracking-wider uppercase">
                        SUPPLYCHAINIQ ENTERPRISE
                      </span>
                      <h4 className="text-base font-mono font-semibold text-white mt-0.5">
                        {createdPo.poNumber}
                      </h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.06] text-neutral-300 border border-white/[0.1]">
                      {createdPo.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-neutral-500 text-[11px] block">Vendor:</span>
                      <span className="font-medium text-neutral-200">{createdPo.supplierName}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[11px] block">Date:</span>
                      <span className="font-medium text-neutral-200 font-mono">
                        {new Date(createdPo.createdAt).toISOString().split('T')[0]}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[11px] block">Item SKU:</span>
                      <span className="font-medium text-white font-mono">{createdPo.skuCode}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[11px] block">Delivery ETA:</span>
                      <span className="font-medium text-neutral-200 font-mono">{createdPo.expectedDeliveryDate}</span>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] pt-3">
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-neutral-400">Authorized Units:</span>
                      <span className="font-mono text-white">{createdPo.finalOrderedQty} Units</span>
                    </div>
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-neutral-400">Unit Cost:</span>
                      <span className="font-mono text-white">${createdPo.unitCost}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-t border-white/[0.06] font-medium">
                      <span className="text-white">Total Commitment:</span>
                      <span className="text-white font-mono text-base font-semibold">${createdPo.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleDownloadCSV}
                    className="flex items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] p-3 text-xs font-medium text-white hover:bg-white/[0.08] transition-all"
                  >
                    <Download className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Download CSV</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] p-3 text-xs font-medium text-white transition-all shadow-apple-sm"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Voucher</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitPO} className="space-y-4">
                {poError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 rounded-xl border border-[#FF453A]/30 bg-[#FF453A]/10 px-3.5 py-2.5 text-xs text-[#FF453A]"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{poError}</span>
                  </motion.div>
                )}

                <div>
                  <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                    Item SKU Identifier
                  </label>
                  <input
                    type="text"
                    required
                    value={skuCode}
                    onChange={(e) => setSkuCode(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.1] bg-[#141416] px-3.5 py-2 text-xs font-mono font-medium text-white outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                    Product Description
                  </label>
                  <input
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.1] bg-[#141416] px-3.5 py-2 text-xs text-white outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                    Designated Supplier
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.1] bg-[#141416] px-3.5 py-2 text-xs text-white outline-none focus:border-white/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                      Replenish Quantity
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={orderQty}
                      onChange={(e) => setOrderQty(Number(e.target.value) || 0)}
                      className="w-full rounded-xl border border-white/[0.1] bg-[#141416] px-3.5 py-2 text-xs font-mono text-white outline-none focus:border-white/30"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                      Agreed Unit Cost ($)
                    </label>
                    <input
                      type="number"
                      required
                      min="0.1"
                      step="0.1"
                      value={unitCost}
                      onChange={(e) => setUnitCost(Number(e.target.value) || 0)}
                      className="w-full rounded-xl border border-white/[0.1] bg-[#141416] px-3.5 py-2 text-xs font-mono text-white outline-none focus:border-white/30"
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3.5 flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Total Purchase Commitment:</span>
                  <span className="text-base font-semibold text-white font-mono">
                    ${totalAmount.toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                    Authorization Memo
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.1] bg-[#141416] px-3.5 py-2 text-xs text-neutral-300 outline-none focus:border-white/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || orderQty <= 0}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] py-3 text-xs font-medium text-white shadow-apple-sm transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>{isSubmitting ? 'Authorizing...' : 'Authorize Purchase Order'}</span>
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
