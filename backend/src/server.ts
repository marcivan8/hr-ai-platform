import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes';
import { connectDB } from './config/database';
import config from './config';
import fs from 'fs';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://hr-ai-platform-db8jenlxl-marc-ivans-projects.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Ensure uploads directory exists
const uploads = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploads)) {
  fs.mkdirSync(uploads, { recursive: true });
}
app.use('/uploads', express.static(uploads));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
connectDB().then(() => {
  app.listen(config.port, () => {
    console.log(`✅ Server running on port ${config.port}`);
    console.log(`📍 Environment: ${config.nodeEnv}`);
  });
}).catch((err) => {
  console.error('❌ Database connection failed:', err);
  process.exit(1);
});

export default app;