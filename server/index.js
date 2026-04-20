'use strict';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const path = require('path');
const cors = require('cors');

const apiRouter = require('./routes/api');

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Serve frontend (public folder)
app.use(express.static(path.join(__dirname, '../public')));

// ✅ API routes
app.use('/api', apiRouter);

// ✅ SPA fallback (IMPORTANT FIX)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running → http://localhost:${PORT}`);
});