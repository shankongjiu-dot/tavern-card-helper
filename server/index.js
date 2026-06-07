/**
 * Express server - AI API proxy + static file serving (production)
 * Runs on port 3001 locally. On Vercel, exported as serverless function.
 */
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import aiProxyRouter from './routes/ai-proxy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : true;
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api/ai', aiProxyRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Vercel serverless: export app, no listen()
// Local / Docker: serve static files and listen
if (process.env.VERCEL) {
  // On Vercel, static files are handled by the CDN (vercel.json routes)
  // Only export the app for API routes
} else {
  // Local or Docker: serve static files from dist/
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('/{*path}', (_req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });

  app.listen(PORT, HOST, () => {
    console.log(`[Server] Running on http://${HOST}:${PORT}`);
  });
}

export default app;
