import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Plus,
  Download,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { fetchPurchaseOrders, updatePurchaseOrderStatus } from '../../services/api.js';

export function PurchaseOrdersList({ onOpenCreatePo }) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setIsLoading(true);
    try {
      const data = await fetchPurchaseOrders();
      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAdvanceStatus = async (poNumber, currentStatus) => {
    const nextStatus = currentStatus === 'DRAFT' ? 'ORDERED' : currentStatus === 'ORDERED' ? 'RECEIVED' : 'RECEIVED';
    try {
      await updatePurchaseOrderStatus(poNumber, nextStatus);
      await loadOrders();
    } catch (err) {
      alert(`Error updating PO: ${err.message}`);
    }
  };

  const handleDownloadAllCSV = () => {
    if (orders.length === 0) return;
    const headers = ['PO_Number', 'SKU', 'Product_Name', 'Supplier', 'Quantity', 'Unit_Cost', 'Total_Amount', 'Status', 'Delivery_Date'];
    const rows = orders.map(o => [
      `"${o.poNumber}"`,
      `"${o.skuCode}"`,
      `"${o.productName}"`,
      `"${o.supplierName}"`,
      o.finalOrderedQty,
      o.unitCost,
      o.totalAmount,
      `"${o.status}"`,
      `"${o.expectedDeliveryDate || ''}"`
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PurchaseOrders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-400 mb-1">
            <span>Procurement Ledger</span>
            <span>•</span>
            <span className="text-[#30D158]">Inbound Shipments</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Purchase Orders & Shipments
          </h1>
          <p className="mt-1 text-sm text-neutral-400 max-w-xl">
            Track authorized vendor purchase orders, inbound shipments, and stock receiving status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadAllCSV}
            className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-white/[0.08] hover:text-white transition-all active:scale-[0.98]"
          >
            <Download className="h-3.5 w-3.5 text-neutral-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => onOpenCreatePo()}
            className="flex items-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] px-4 py-2 text-xs font-medium text-white shadow-apple-sm transition-all active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Authorization</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="apple-card p-4">
          <span className="text-[12px] text-neutral-400 block font-medium">Active Authorizations</span>
          <span className="text-2xl font-semibold text-white mt-1 block font-mono">
            {orders.length}
          </span>
        </div>

        <div className="apple-card p-4">
          <span className="text-[12px] text-neutral-400 block font-medium">Total Capital Committed</span>
          <span className="text-2xl font-semibold text-white mt-1 block font-mono">
            ${orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString()}
          </span>
        </div>

        <div className="apple-card p-4">
          <span className="text-[12px] text-neutral-400 block font-medium">Inbound in Transit</span>
          <span className="text-2xl font-semibold text-[#FF9F0A] mt-1 block font-mono">
            {orders.filter(o => o.status === 'ORDERED').length} Shipments
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="apple-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02] text-neutral-400 font-medium">
                <th className="p-3.5">Reference Number</th>
                <th className="p-3.5">Item & SKU</th>
                <th className="p-3.5">Vendor</th>
                <th className="p-3.5 text-right">Units</th>
                <th className="p-3.5 text-right">Committed Value</th>
                <th className="p-3.5">ETA</th>
                <th className="p-3.5 text-center">Lifecycle</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {orders.map((po) => (
                <tr key={po.poNumber} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-3.5 font-mono font-medium text-white">
                    {po.poNumber}
                  </td>

                  <td className="p-3.5">
                    <span className="font-mono text-white block">
                      {po.skuCode}
                    </span>
                    <span className="text-neutral-400 truncate max-w-xs block text-[11px] mt-0.5">
                      {po.productName}
                    </span>
                  </td>

                  <td className="p-3.5 text-neutral-300">
                    {po.supplierName}
                  </td>

                  <td className="p-3.5 text-right font-mono font-medium text-white">
                    {po.finalOrderedQty}
                  </td>

                  <td className="p-3.5 text-right font-mono font-medium text-white">
                    ${po.totalAmount?.toLocaleString()}
                  </td>

                  <td className="p-3.5 text-neutral-400 font-mono text-[11px]">
                    {po.expectedDeliveryDate || 'Pending'}
                  </td>

                  <td className="p-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                      po.status === 'RECEIVED'
                        ? 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/20'
                        : po.status === 'ORDERED'
                        ? 'bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A]/20'
                        : 'bg-white/[0.06] text-neutral-300 border-white/[0.1]'
                    }`}>
                      {po.status === 'RECEIVED' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {po.status}
                    </span>
                  </td>

                  <td className="p-3.5 text-right">
                    {po.status === 'DRAFT' && (
                      <button
                        onClick={() => handleAdvanceStatus(po.poNumber, po.status)}
                        className="rounded-full bg-white/[0.08] hover:bg-white/[0.14] px-3 py-1 text-xs font-medium text-white transition-colors"
                      >
                        Dispatch
                      </button>
                    )}
                    {po.status === 'ORDERED' && (
                      <button
                        onClick={() => handleAdvanceStatus(po.poNumber, po.status)}
                        className="rounded-full bg-[#30D158] hover:bg-[#30D158]/90 px-3 py-1 text-xs font-medium text-black transition-colors"
                      >
                        Receive Stock
                      </button>
                    )}
                    {po.status === 'RECEIVED' && (
                      <span className="text-[11px] text-neutral-500 font-mono">
                        Ingested ✓
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {orders.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-neutral-500">
                    No active purchase orders. Click "New Authorization" above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
