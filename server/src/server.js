import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Route imports
import authRoutes from './routes/authRoutes.js';
import hierarchyRoutes from './routes/hierarchyRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import bookmarkRoutes from './routes/bookmarkRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import contributionRoutes from './routes/contributionRoutes.js';
import copyrightRoutes from './routes/copyrightRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { autoSeedIfEmpty } from './seeds/autoSeed.js';

const app = express();

// Security and utility middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible PDF rendering in embedded canvas/viewer
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: [env.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'CampusVault',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/hierarchy', hierarchyRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/copyright', copyrightRoutes);
app.use('/api/admin', adminRoutes);

// Fallback 404 for API endpoints
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
  });
});

// Serve frontend static build in production
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Central Error Handler
app.use(errorHandler);

// Start server
async function startServer() {
  await connectDB();
  await autoSeedIfEmpty();
  app.listen(env.port, () => {
    console.log(`
==================================================
   CAMPUSVAULT REST API SERVER
   "Your College. Everything You Need. One Search."
   Listening on http://localhost:${env.port}
   Environment: ${env.nodeEnv}
==================================================
    `);
  });
}

// Only listen if not imported by test runner
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
