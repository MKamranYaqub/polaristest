import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabase.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const corsOptions = { origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : true };
app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
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