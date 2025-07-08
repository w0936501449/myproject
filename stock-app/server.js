const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());

// In-memory data store (replace with db for production)
let portfolio = [];

// Routes ------------------------------------------------------
// Get all stocks in portfolio
app.get('/api/stocks', (req, res) => {
  res.json(portfolio);
});

// Add new stock
app.post('/api/stocks', (req, res) => {
  const { code, shares, buyPrice } = req.body;
  if (!code || !shares || !buyPrice) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Prevent duplicates – overwrite if code already exists
  const existing = portfolio.find((s) => s.code === code);
  if (existing) {
    existing.shares += Number(shares);
    existing.buyPrice = Number(buyPrice); // Update to last buy price
  } else {
    portfolio.push({ code, shares: Number(shares), buyPrice: Number(buyPrice) });
  }

  res.json({ success: true, portfolio });
});

// Delete stock by code
app.delete('/api/stocks/:code', (req, res) => {
  const { code } = req.params;
  const originalLen = portfolio.length;
  portfolio = portfolio.filter((s) => s.code !== code);

  if (portfolio.length === originalLen) {
    return res.status(404).json({ error: 'Stock not found' });
  }

  res.json({ success: true, portfolio });
});

// Reset portfolio
app.post('/api/reset', (_, res) => {
  portfolio = [];
  res.json({ success: true });
});

// Serve static front-end
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to index.html for client-side routing (if any)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server ------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});