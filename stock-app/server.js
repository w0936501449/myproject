const express = require('express');
const path = require('path');
const app = express();
const axios = require('axios');

// Middleware
app.use(express.json());

// In-memory data store (replace with db for production)
let portfolio = [];

// Helper: Fetch latest close price & name from TWSE open API (monthly dataset)
async function fetchTwseQuote(code) {
  try {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}01`;
    const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${dateStr}&stockNo=${code}`;
    const resp = await axios.get(url);
    const body = resp.data;
    if (body.stat !== 'OK') throw new Error(body.stat || 'TWSE API error');
    const rows = body.data;
    if (!rows || rows.length === 0) throw new Error('No data');
    const lastRow = rows[rows.length - 1];
    const closePriceStr = lastRow[6];
    const price = parseFloat(closePriceStr.replace(/,/g, ''));
    // Extract name from title: e.g., "113年07月 2330 台積電 各日成交資訊"
    let name = null;
    if (body.title) {
      const match = body.title.match(/\d+ \d+ (\\d{4})?\s*([0-9A-Za-z]+)\s*(.+?)\s/);
    }
    // simpler: after code there is name within the title; split by code
    if (body.title) {
      const parts = body.title.split(code);
      if (parts.length > 1) {
        name = parts[1].trim().split(' ')[0];
      }
    }
    return { price, name };
  } catch (err) {
    console.error('fetchTwseQuote error', code, err.message);
    return { price: null, name: null };
  }
}

// Helper to update current prices for stocks in portfolio
async function refreshPrices() {
  if (portfolio.length === 0) return;
  const promises = portfolio.map((s) => fetchTwseQuote(s.code));
  const results = await Promise.all(promises);
  results.forEach((res, idx) => {
    const stock = portfolio[idx];
    stock.currentPrice = res.price;
    if (!stock.name && res.name) stock.name = res.name;
  });
}

// Manual refresh endpoint
app.post('/api/refresh', async (req, res) => {
  await refreshPrices();
  res.json({ success: true, portfolio });
});
// Routes ------------------------------------------------------
// Get all stocks in portfolio
app.get('/api/stocks', async (req, res) => {
  await refreshPrices();
  res.json(portfolio);
});

// Add new stock
app.post('/api/stocks', async (req, res) => {
  const { code, shares, buyPrice } = req.body;
  if (!code || !shares) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let finalBuyPrice = buyPrice;
  let fetchedName = null;
  if (finalBuyPrice === undefined || finalBuyPrice === null) {
    try {
      const symbol = code.includes('.') ? code : `${code}.TW`;
      const { price, name } = await fetchTwseQuote(code);
      finalBuyPrice = price;
      fetchedName = name;
    } catch (err) {
      console.error('Failed to fetch price for', code, err);
      return res.status(400).json({ error: '無法取得股票現價，請手動輸入買入價格' });
    }
  }

  // Prevent duplicates – overwrite if code already exists
  const existing = portfolio.find((s) => s.code === code);
  if (existing) {
    existing.shares += Number(shares);
    existing.buyPrice = Number(finalBuyPrice); // Update to last buy price
    if (!existing.name && fetchedName) {
      existing.name = fetchedName;
    }
  } else {
    portfolio.push({ code, shares: Number(shares), buyPrice: Number(finalBuyPrice), name: fetchedName });
  }

  // Update current prices before responding
  await refreshPrices();

  res.json({ success: true, portfolio });
});

// Delete stock by code
app.delete('/api/stocks/:code', async (req, res) => {
  const { code } = req.params;
  const originalLen = portfolio.length;
  portfolio = portfolio.filter((s) => s.code !== code);

  if (portfolio.length === originalLen) {
    return res.status(404).json({ error: 'Stock not found' });
  }

  await refreshPrices();
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