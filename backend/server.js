import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabase.js';
import quotesRouter from './routes/quotes.js';
import dipPdfRouter from './routes/dipPdf.js';
import quotePdfRouter from './routes/quotePdf.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  'http://localhost:3000', // Local dev
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow vercel preview deployments
    if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`Origin '${origin}' not allowed by CORS`));
    }
  }
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Root - simple API info (helps platforms that hit /)
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API root - use /health or /api/rates' });
});
// Rates endpoint - returns all rates stored in Supabase 'rates' table
app.get('/api/rates', async (req, res) => {
  try {
    const { data, error } = await supabase.from('rates').select('key, data');
    if (error) throw error;

    const result = {};
    data.forEach((row) => {
      result[row.key] = row.data;
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching rates from Supabase:', err);
    res.status(500).json({ error: err.message ?? String(err) });
  }
});

// Quotes endpoints (CRUD)
app.use('/api/quotes', quotesRouter);

// DIP PDF generation endpoint
app.use('/api/dip/pdf', dipPdfRouter);

// Quote PDF generation endpoint
app.use('/api/quote/pdf', quotePdfRouter);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  if (process.env.FRONTEND_URL) console.log(`🌐 Frontend allowed origin: ${process.env.FRONTEND_URL}`);
  console.log(`💾 Supabase connected`);
});