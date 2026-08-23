import express from 'express';
import cors from 'cors';
import { env, validateEnv } from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

// 1. Validate environment configuration
validateEnv();

const app = express();

// Enable proxy trust (Crucial for Render, Heroku, Cloudflare, AWS load balancers to capture real client IPs)
app.set('trust proxy', env.TRUST_PROXY);

// 2. Global Middlewares
app.use(
  cors({
    origin: [env.CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

// Serve static frontend files if dist folder exists
app.use(express.static(distPath));

// 3. API Routes Mount
app.use('/api', routes);

// SPA fallback: Send index.html for all non-API GET requests (Express 5 safe)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(distPath, 'index.html'));
  }
  next();
});

// 4. Global Error Handler
app.use(errorHandler);


// 5. Start Server
const server = app.listen(env.PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 QUIBANDS GLOBAL FULL-STACK SERVER RUNNING`);
  console.log(`📡 URL: http://localhost:${env.PORT}`);
  console.log(`🩺 Health check: http://localhost:${env.PORT}/api/health`);
  console.log(`🔒 Environment: ${env.NODE_ENV}`);
  console.log(`======================================================\n`);
});

export default app;

