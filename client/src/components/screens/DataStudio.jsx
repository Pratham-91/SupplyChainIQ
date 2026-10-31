import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Papa from 'papaparse';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  ShieldCheck,
  Edit3,
  Wand2,
  Check,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { ErrorTypeBadge, StatusBadge } from '../common/Badge.jsx';
import {
  uploadAndValidateCSV,
  fetchQuarantineLogs,
  resolveQuarantineRecord,
  autoFixAllQuarantine,
  fetchMessySampleCSV
} from '../../services/api.js';

export function DataStudio({ onDataUpdated }) {
  const [csvFile, setCsvFile] = useState(null);
  const [parsedRawRows, setParsedRawRows] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [columnMapping, setColumnMapping] = useState({
    skuCode: '',
    type: '',
    date: '',
    quantity: '',
    unitPrice: '',
    uom: '',
    conversion: ''
  });

  const [cartonMultiplier, setCartonMultiplier] = useState(12);
  const [quarantineLogs, setQuarantineLogs] = useState([]);
  const [quarantineFilter, setQuarantineFilter] = useState('ALL');
  const [editingRowId, setEditingRowId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isResolving, setIsResolving] = useState(false);
  const [dataQualityScore, setDataQualityScore] = useState(96.8);
  const [batchStats, setBatchStats] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [resolveError, setResolveError] = useState(null);

  useEffect(() => {
    loadQuarantineData();
  }, []);

  async function loadQuarantineData() {
    try {
      const data = await fetchQuarantineLogs();
      setQuarantineLogs(data.logs || []);
      setDataQualityScore(data.qualityScore || 96.8);
    } catch (err) {
      console.error('Failed to load quarantine logs:', err);
    }
  }

  const handleFileUpload = (file) => {
    if (!file) return;
    setCsvFile(file);
    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsProcessing(false);
        if (results.data && results.data.length > 0) {
          setParsedRawRows(results.data);
          const headers = Object.keys(results.data[0]);
          setCsvHeaders(headers);

          const autoMap = { ...columnMapping };
          headers.forEach((h) => {
            const lower = h.toLowerCase();
            if (lower.includes('sku') || lower.includes('item') || lower.includes('code') || lower.includes('product')) {
              autoMap.skuCode = h;
            } else if (lower.includes('type') || lower.includes('trans')) {
              autoMap.type = h;
            } else if (lower.includes('date') || lower.includes('time') || lower.includes('day')) {
              autoMap.date = h;
            } else if (lower.includes('qty') || lower.includes('quantity') || lower.includes('sold') || lower.includes('bought')) {
              autoMap.quantity = h;
            } else if (lower.includes('price') || lower.includes('cost') || lower.includes('rate') || lower.includes('unitprice')) {
              autoMap.unitPrice = h;
            } else if (lower.includes('uom') || lower.includes('unit')) {
              autoMap.uom = h;
            } else if (lower.includes('conversion') || lower.includes('ratio')) {
              autoMap.conversion = h;
            }
          });
          setColumnMapping(autoMap);
          setCurrentStep(2);
        }
      },
      error: (err) => {
        setIsProcessing(false);
        setUploadError(`Failed to parse CSV: ${err.message}`);
      }
    });
  };

  const handleLoadMessyDemo = async () => {
    try {
      setIsProcessing(true);
      const csvText = await fetchMessySampleCSV();
      const blob = new Blob([csvText], { type: 'text/csv' });
      const file = new File([blob], 'vendor_feed_unstandardized.csv', { type: 'text/csv' });
      handleFileUpload(file);
    } catch (err) {
      setIsProcessing(false);
      setUploadError(`Error loading CSV: ${err.message}`);
    }
  };

  const handleRunValidation = async () => {
    setIsProcessing(true);
    try {
      const standardizedRows = parsedRawRows.map((row) => ({
        skuCode: row[columnMapping.skuCode] || '',
        type: row[columnMapping.type] || 'SELL',
        date: row[columnMapping.date] || '',
        quantity: row[columnMapping.quantity] || '',
        unitPrice: row[columnMapping.unitPrice] || '',
        uom: row[columnMapping.uom] || 'Piece',
        packConversionRatio: cartonMultiplier
      }));

      const response = await uploadAndValidateCSV(standardizedRows);
      setBatchStats(response);
      setDataQualityScore(response.qualityScore);
      setIsProcessing(false);
      setCurrentStep(3);
      await loadQuarantineData();
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      setIsProcessing(false);
      setUploadError(`Validation error: ${err.message}`);
    }
  };

  const startEditing = (log) => {
    setEditingRowId(log.id);
    const raw = log.rawRowData || {};
    setEditForm({
      skuCode: raw.skuCode || raw.item_no || raw.Item_No || 'SKU-ELEC-001',
      type: raw.type || raw.Type || 'SELL',
      date: raw.date || raw.Trans_Date || new Date().toISOString().split('T')[0],
      quantity: Math.abs(raw.quantity ?? raw.Qty_Sold ?? 10),
      unitPrice: raw.unitPrice ?? raw.UnitPrice ?? 25,
      uom: raw.uom || raw.UoM || 'Piece'
    });
  };

  const handleSaveInlineFix = async (logId) => {
    setIsResolving(true);
    try {
      await resolveQuarantineRecord(logId, editForm);
      setEditingRowId(null);
      await loadQuarantineData();
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      setResolveError(`Failed to resolve: ${err.message}`);
    } finally {
      setIsResolving(false);
    }
  };

  const handleAutoFixAll = async () => {
    setIsResolving(true);
    try {
      await autoFixAllQuarantine();
      await loadQuarantineData();
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      setResolveError(`Auto-fix error: ${err.message}`);
    } finally {
      setIsResolving(false);
    }
  };

  const filteredLogs = quarantineLogs.filter((l) => {
    if (quarantineFilter === 'ALL') return true;
    return l.status === quarantineFilter;
  });

  const pendingCount = quarantineLogs.filter(l => l.status === 'PENDING').length;

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
            <span>Ingestion Pipeline</span>
            <span>•</span>
            <span className="text-[#0071E3]">Zod Schema Hygiene</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Data Hygiene & Quarantine Studio
          </h1>
          <p className="mt-1 text-sm text-neutral-400 max-w-xl">
            In-browser schema normalization, unit-of-measure alignment, and anomaly quarantine.
          </p>
        </div>

        <button
          onClick={handleLoadMessyDemo}
          className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-white/[0.08] hover:text-white transition-all active:scale-[0.98]"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-neutral-400" />
          <span>Load Demo Feed</span>
        </button>
      </div>

      {/* Inline error banner */}
      {uploadError && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl border border-[#FF453A]/30 bg-[#FF453A]/10 px-4 py-3 text-xs text-[#FF453A]"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="ml-auto text-neutral-400 hover:text-white">✕</button>
        </motion.div>
      )}

      {resolveError && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl border border-[#FF453A]/30 bg-[#FF453A]/10 px-4 py-3 text-xs text-[#FF453A]"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{resolveError}</span>
          <button onClick={() => setResolveError(null)} className="ml-auto text-neutral-400 hover:text-white">✕</button>
        </motion.div>
      )}

      {/* iOS Style Segmented Stepper */}
      <div className="apple-card p-2 flex items-center justify-between">
        <div className="flex items-center gap-1 w-full max-w-md">
          {[
            { step: 1, label: '1. Ingest Feed' },
            { step: 2, label: '2. Schema Mapping' },
            { step: 3, label: `3. Quarantine (${pendingCount})` }
          ].map(({ step, label }) => (
            <button
              key={step}
              onClick={() => setCurrentStep(step)}
              className={`flex-1 rounded-full py-1.5 text-[12px] font-medium transition-all ${
                currentStep === step
                  ? 'bg-white text-black shadow-apple-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs text-neutral-400 pr-3">
          <span>Hygiene Score:</span>
          <span className="font-semibold text-white font-mono">{dataQualityScore}%</span>
        </div>
      </div>

      {/* STEP 1: Apple-style Minimalist Dropzone */}
      {currentStep === 1 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          className="apple-card p-16 text-center border-dashed border-white/[0.12] hover:border-white/30 transition-all cursor-pointer select-none"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
          }}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv';
            input.onchange = (e) => {
              if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
            };
            input.click();
          }}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-neutral-300 border border-white/[0.08] mb-4">
            <UploadCloud className="h-6 w-6 text-neutral-300" />
          </div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Select or drag supplier CSV file
          </h3>
          <p className="mt-1 text-xs text-neutral-400 max-w-sm mx-auto">
            Handles non-uniform column names, mixed date formats, carton conversion ratios, and isolates bad rows safely.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="rounded-full bg-white/[0.06] hover:bg-white/[0.1] px-4 py-1.5 text-xs font-medium text-neutral-300 border border-white/[0.08]">
              Browse Local Files
            </span>
          </div>
        </motion.div>
      )}

      {/* STEP 2: Schema Mapping */}
      {currentStep === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="apple-card p-6 space-y-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Field Normalization & Conversion Ratio
              </h2>
              <p className="text-[12px] text-neutral-400 mt-0.5">
                {parsedRawRows.length} rows parsed • Map custom headers to canonical schema
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentStep(1)}
                className="text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleRunValidation}
                disabled={isProcessing || !columnMapping.skuCode}
                className="flex items-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] px-4 py-1.5 text-xs font-medium text-white shadow-apple-sm transition-all disabled:opacity-50"
              >
                <span>Run Validation Engine</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'skuCode', label: 'Item Identifier (SKU)', req: true },
              { key: 'type', label: 'Transaction Type (BUY/SELL)' },
              { key: 'date', label: 'Transaction Date', req: true },
              { key: 'quantity', label: 'Quantity', req: true },
              { key: 'unitPrice', label: 'Unit Price ($)', req: true },
              { key: 'uom', label: 'Unit of Measure (UoM)' }
            ].map(({ key, label, req }) => (
              <div key={key} className="rounded-xl bg-white/[0.02] p-3.5 border border-white/[0.05]">
                <label className="text-[11px] font-medium text-neutral-400 block mb-1.5">
                  {label} {req && <span className="text-[#0071E3]">*</span>}
                </label>
                <select
                  value={columnMapping[key]}
                  onChange={(e) => setColumnMapping({ ...columnMapping, [key]: e.target.value })}
                  className="w-full rounded-lg border border-white/[0.1] bg-[#0A0A0C] px-3 py-1.5 text-xs text-white outline-none focus:border-white/30"
                >
                  <option value="">-- Match Column --</option>
                  {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-white/[0.02] p-4 border border-white/[0.05] flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-white block">Carton-to-Base Unit Conversion</span>
              <span className="text-[11px] text-neutral-500">Cartons / Boxes are converted to individual base pieces</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">1 Box =</span>
              <input
                type="number"
                min="1"
                max="144"
                value={cartonMultiplier}
                onChange={(e) => setCartonMultiplier(Number(e.target.value) || 12)}
                className="w-16 rounded-lg border border-white/[0.1] bg-[#0A0A0C] px-2 py-1 text-xs text-white font-mono text-center"
              />
              <span className="text-xs text-neutral-400">Pieces</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* STEP 3 & Quarantine Table */}
      <div className="apple-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-neutral-400" />
              <span>Quarantine Ledger</span>
            </h3>
            <p className="text-[12px] text-neutral-400 mt-0.5">
              Anomalous records isolated safely without breaking pipeline consistency
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-full bg-white/[0.04] p-1 text-[11px] border border-white/[0.08]">
              <button
                onClick={() => setQuarantineFilter('ALL')}
                className={`px-3 py-0.5 rounded-full transition-all ${
                  quarantineFilter === 'ALL' ? 'bg-white text-black font-medium' : 'text-neutral-400'
                }`}
              >
                All ({quarantineLogs.length})
              </button>
              <button
                onClick={() => setQuarantineFilter('PENDING')}
                className={`px-3 py-0.5 rounded-full transition-all ${
                  quarantineFilter === 'PENDING' ? 'bg-white text-black font-medium' : 'text-neutral-400'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setQuarantineFilter('RESOLVED')}
                className={`px-3 py-0.5 rounded-full transition-all ${
                  quarantineFilter === 'RESOLVED' ? 'bg-white text-black font-medium' : 'text-neutral-400'
                }`}
              >
                Resolved
              </button>
            </div>

            {pendingCount > 0 && (
              <button
                onClick={handleAutoFixAll}
                disabled={isResolving}
                className="flex items-center gap-1.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] px-3.5 py-1.5 text-xs font-medium text-white shadow-apple-sm transition-all"
              >
                <Wand2 className="h-3 w-3" />
                <span>Auto-Resolve All ({pendingCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Quarantine Grid */}
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02] text-neutral-400 font-medium">
                <th className="p-3">Status</th>
                <th className="p-3">Anomaly Type</th>
                <th className="p-3">Raw Values</th>
                <th className="p-3">Diagnostic</th>
                <th className="p-3">Suggested Remediation</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredLogs.map((log) => {
                const isEditing = editingRowId === log.id;
                const raw = log.rawRowData || {};

                return (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 whitespace-nowrap">
                      {log.status === 'RESOLVED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#30D158] font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Resolved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#FF453A] font-medium">
                          <AlertCircle className="h-3.5 w-3.5" /> Pending
                        </span>
                      )}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <ErrorTypeBadge errorType={log.errorType} />
                    </td>

                    <td className="p-3 font-mono text-[11px] text-neutral-300 max-w-[200px]">
                      {isEditing ? (
                        <div className="space-y-1.5 p-2 rounded-lg bg-neutral-900 border border-white/10">
                          <input
                            type="text"
                            value={editForm.skuCode}
                            onChange={(e) => setEditForm({ ...editForm, skuCode: e.target.value })}
                            className="w-full rounded bg-black px-1.5 py-0.5 text-xs text-white"
                          />
                          <div className="grid grid-cols-2 gap-1">
                            <input
                              type="number"
                              value={editForm.quantity}
                              onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                              className="w-full rounded bg-black px-1.5 py-0.5 text-xs text-white"
                            />
                            <input
                              type="number"
                              value={editForm.unitPrice}
                              onChange={(e) => setEditForm({ ...editForm, unitPrice: Number(e.target.value) })}
                              className="w-full rounded bg-black px-1.5 py-0.5 text-xs text-white"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="truncate">
                          {raw.skuCode || raw.item_no || raw.Item_No || '—'} • Qty: {raw.quantity ?? raw.Qty_Sold ?? '—'} • ${raw.unitPrice ?? raw.UnitPrice ?? '—'}
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-neutral-300 max-w-[220px]">
                      {log.errorDescription}
                    </td>

                    <td className="p-3 text-neutral-400 text-[11px] max-w-[220px]">
                      {log.suggestedFix}
                    </td>

                    <td className="p-3 text-right whitespace-nowrap">
                      {log.status === 'PENDING' ? (
                        isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveInlineFix(log.id)}
                              disabled={isResolving}
                              className="rounded-full bg-[#0071E3] px-3 py-1 text-xs font-medium text-white"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingRowId(null)}
                              className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-neutral-400 hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditing(log)}
                            className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-medium text-neutral-300 hover:bg-white/[0.08] hover:text-white transition-all"
                          >
                            Edit
                          </button>
                        )
                      ) : (
                        <span className="text-[11px] text-neutral-500 font-mono">
                          Committed ✓
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-neutral-500">
                    No quarantined records matching selected filter.
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
