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
    } catch (err) {
      alert(`Reset error: ${err.message}`);
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
    </div>
  );
}
