import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { Navbar } from './components/layout/Navbar.jsx';
import { CommandPalette } from './components/layout/CommandPalette.jsx';
import { ControlTower } from './components/screens/ControlTower.jsx';
import { DataStudio } from './components/screens/DataStudio.jsx';
import { ForecastExplorer } from './components/screens/ForecastExplorer.jsx';
import { InventoryWorkbench } from './components/screens/InventoryWorkbench.jsx';
import { PurchaseOrdersList } from './components/screens/PurchaseOrdersList.jsx';
import { WhatIfSimulatorDrawer } from './components/screens/WhatIfSimulatorDrawer.jsx';
import { PurchaseOrderDrawer } from './components/screens/PurchaseOrderDrawer.jsx';
import {
  fetchDashboardSummary,
  fetchProducts,
  fetchQuarantineLogs,
  resetDatabaseSeed
} from './services/api.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('control-tower');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedSku, setSelectedSku] = useState('SKU-ELEC-001');

  // Drawers & Modals
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);
  const [isPoDrawerOpen, setIsPoDrawerOpen] = useState(false);
  const [poDrawerProduct, setPoDrawerProduct] = useState(null);

  // Global State
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [quarantineCount, setQuarantineCount] = useState(5);
  const [isSeeding, setIsSeeding] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    refreshAllData();
  }, []);

  async function refreshAllData() {
    try {
      const [sumData, prodData, qData] = await Promise.all([
        fetchDashboardSummary().catch(() => null),
        fetchProducts().catch(() => []),
        fetchQuarantineLogs('PENDING').catch(() => ({ logs: [] }))
      ]);

      if (sumData) setSummary(sumData);
      if (prodData) setProducts(prodData);
      if (qData?.logs) setQuarantineCount(qData.logs.length);
    } catch (err) {
      console.error('Data refresh error:', err);
    }
  }

  const handleLoadMessyDemo = () => {
    setActiveTab('data-studio');
  };

  const handleResetSeed = async () => {
    setIsSeeding(true);
    try {
      await resetDatabaseSeed();
      await refreshAllData();
      setToast({ type: 'success', message: 'Database reset and re-seeded successfully.' });
    } catch (err) {
      setToast({ type: 'error', message: `Reset error: ${err.message}` });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleOpenWhatIf = (sku) => {
    if (sku && typeof sku === 'string') {
      setSelectedSku(sku);
    }
    setIsWhatIfOpen(true);
  };

  const handleOpenCreatePo = (product) => {
    setPoDrawerProduct(product || products[0] || null);
    setIsPoDrawerOpen(true);
  };

  return (
    <div className="min-h-screen flex bg-black text-[#F5F5F7]">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        atRiskCount={summary?.kpis?.atRiskSkus || 6}
        quarantinePendingCount={quarantineCount}
        onOpenWhatIf={() => handleOpenWhatIf(selectedSku)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden bg-[#000000]">
        <Navbar
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenWhatIf={() => handleOpenWhatIf(selectedSku)}
          onLoadMessyDemo={handleLoadMessyDemo}
          onResetSeed={handleResetSeed}
          isSeeding={isSeeding}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {activeTab === 'control-tower' && (
              <ControlTower
                key="control-tower"
                summary={summary}
                products={products}
                onNavigateTab={setActiveTab}
                onSelectSku={(sku) => {
                  setSelectedSku(sku);
                  setActiveTab('forecast-explorer');
                }}
                onOpenWhatIf={() => handleOpenWhatIf(selectedSku)}
                onLoadMessyDemo={handleLoadMessyDemo}
              />
            )}

            {activeTab === 'data-studio' && (
              <DataStudio
                key="data-studio"
                onDataUpdated={refreshAllData}
              />
            )}

            {activeTab === 'forecast-explorer' && (
              <ForecastExplorer
                key="forecast-explorer"
                selectedSku={selectedSku}
                onSelectSku={setSelectedSku}
                products={products}
                onOpenWhatIf={() => handleOpenWhatIf(selectedSku)}
                onOpenCreatePo={handleOpenCreatePo}
              />
            )}

            {activeTab === 'inventory-workbench' && (
              <InventoryWorkbench
                key="inventory-workbench"
                onSelectSku={(sku) => {
                  setSelectedSku(sku);
                  setActiveTab('forecast-explorer');
                }}
                onOpenWhatIf={handleOpenWhatIf}
                onOpenCreatePo={handleOpenCreatePo}
              />
            )}

            {activeTab === 'purchase-orders' && (
              <PurchaseOrdersList
                key="purchase-orders"
                onOpenCreatePo={handleOpenCreatePo}
              />
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        products={products}
        onSelectSku={setSelectedSku}
        onNavigateTab={setActiveTab}
      />

      {/* What-If Simulator Slide-Out Drawer */}
      <WhatIfSimulatorDrawer
        isOpen={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
        initialSku={selectedSku}
        products={products}
        onOpenCreatePo={handleOpenCreatePo}
      />

      {/* Purchase Order Replenishment Drawer */}
      <PurchaseOrderDrawer
        isOpen={isPoDrawerOpen}
        onClose={() => setIsPoDrawerOpen(false)}
        initialProduct={poDrawerProduct}
        onPoCreated={() => refreshAllData()}
      />

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-full px-4 py-2 text-xs font-medium shadow-2xl backdrop-blur-xl border ${
              toast.type === 'error'
                ? 'bg-[#FF453A]/15 text-[#FF453A] border-[#FF453A]/30'
                : 'bg-[#30D158]/15 text-[#30D158] border-[#30D158]/30'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${toast.type === 'error' ? 'bg-[#FF453A]' : 'bg-[#30D158]'}`} />
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-neutral-400 hover:text-white"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
