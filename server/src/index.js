/**
 * SupplyChainIQ - Main Server Entry Point
 * Architecture: Pure JavaScript MERN Backend
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import { initDatabase, isUsingMongo } from './db/dataStore.js';
import { seedInitialData } from './db/seedData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration (Permissive for local development & production)
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger for easy debugging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'SupplyChainIQ Backend Engine',
    database: isUsingMongo() ? 'MongoDB Server (Database: supplychainiq)' : 'In-Memory Fallback',
    mongoConnected: isUsingMongo(),
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mount REST API Routes
app.use('/api', apiRoutes);

// Static Client Serving (Serve compiled React bundle on port 5000 too)
if (fs.existsSync(clientDistPath)) {
  console.log(`📁 [Server] Serving static frontend from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    const indexHtml = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexHtml)) {
      return res.sendFile(indexHtml);
    }
    next();
  });
} else {
  console.log('ℹ️ [Server] Client dist folder not found. API mode only.');
  app.get('/', (req, res) => {
    res.json({
      service: 'SupplyChainIQ Backend API',
      status: 'ONLINE',
      docs: {
        health: '/health',
        apiSummary: '/api/dashboard/summary',
        products: '/api/products',
        workbench: '/api/inventory/workbench'
      }
    });
  });
}

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Server Startup
async function startServer() {
  try {
    // 1. Initialize DB (Atlas if configured, else In-Memory)
    await initDatabase();

    // 2. Seed realistic 6-month historical data
    await seedInitialData();

    // 3. Bind to 0.0.0.0 to support IPv4, IPv6, and LAN access
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔══════════════════════════════════════════════════════════════════╗
║               SupplyChainIQ Engine is LIVE                      ║
║  Status: Operational                                             ║
║  DB:     MongoDB Server (supplychainiq)                          ║
║  Local:  http://localhost:${PORT}                                   ║
║  IPv4:   http://127.0.0.1:${PORT}                                   ║
║  API:    http://127.0.0.1:${PORT}/api                               ║
║  Health: http://127.0.0.1:${PORT}/health                            ║
╚══════════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
