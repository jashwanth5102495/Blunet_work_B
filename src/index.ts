import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import routes from './routes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

// Process Level Uncaught Crash Guards
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT_EXCEPTION]:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED_REJECTION] at:', promise, 'reason:', reason);
});

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Lightweight Healthcheck Endpoints for Vercel/Railway health probes
const healthHandler = (req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'BluNet Workplace API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// API Routes
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 BluNet Workplace Backend API listening on http://localhost:${PORT}`);
});
