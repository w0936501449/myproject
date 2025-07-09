const express = require('express');
const path = require('path');
const app = express();
const yahooFinance = require('yahoo-finance2').default;

// Middleware
app.use(express.json());

// In-memory data store (replace with db for production)
let portfolio = [];

// Helper to update current prices for stocks in portfolio
async function refreshPrices() {
  if (portfolio.length === 0) return;
  // Prepare symbols e.g., 2330 => 2330.TW
  const symbols = portfolio.map((s) => (s.code.includes('.') ? s.code : `${s.code}.TW`));
  try {
    const quotes = await yahooFinance.quote(symbols);
    // yahooFinance.quote returns an object for single symbol or array for multi
    const quotesArr = Array.isArray(quotes) ? quotes : [quotes];
    const priceMap = {};
    quotesArr.forEach((q) => {
      // Remove .TW suffix when mapping back
      const code = q.symbol.replace('.TW', '');
      priceMap[code] = {
        price: q.regularMarketPrice ?? null,
        name: q.shortName || q.longName || null
      };
    });
    // Update each stock with currentPrice
    portfolio.forEach((stock) => {
      stock.currentPrice = priceMap[stock.code]?.price ?? priceMap[stock.code] ?? null;
      if (!stock.name && priceMap[stock.code]?.name) {
        stock.name = priceMap[stock.code].name;
      }
    });
  } catch (err) {
    console.error('Error fetching Yahoo Finance quotes', err);
  }
}

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
      const quote = await yahooFinance.quote(symbol);
      finalBuyPrice = quote.regularMarketPrice;
      fetchedName = quote.shortName || quote.longName || null;
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