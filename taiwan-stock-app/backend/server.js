const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 模擬股票數據庫
let stocks = [
  {
    id: 1,
    code: '2330',
    name: '台積電',
    shares: 1000,
    buyPrice: 100,
    currentPrice: 120,
    investmentCost: 100000
  },
  {
    id: 2,
    code: '2030',
    name: '彩晶',
    shares: 1000,
    buyPrice: 100,
    currentPrice: 120,
    investmentCost: 100000
  }
];

// 股票價格數據 (模擬即時數據)
const stockPrices = {
  '2330': 530,
  '2030': 45,
  '2454': 785,
  '2317': 120,
  '2882': 15
};

// API 路由

// 獲取所有股票
app.get('/api/stocks', (req, res) => {
  const stocksWithCurrentPrices = stocks.map(stock => ({
    ...stock,
    currentPrice: stockPrices[stock.code] || stock.buyPrice,
    marketValue: (stockPrices[stock.code] || stock.buyPrice) * stock.shares,
    profitLoss: ((stockPrices[stock.code] || stock.buyPrice) - stock.buyPrice) * stock.shares
  }));
  res.json(stocksWithCurrentPrices);
});

// 新增股票
app.post('/api/stocks', (req, res) => {
  const { code, shares, buyPrice } = req.body;
  
  if (!code || !shares || !buyPrice) {
    return res.status(400).json({ error: '請填寫所有必要欄位' });
  }

  const newStock = {
    id: Date.now(),
    code: code.toUpperCase(),
    name: getStockName(code),
    shares: parseInt(shares),
    buyPrice: parseFloat(buyPrice),
    investmentCost: parseInt(shares) * parseFloat(buyPrice)
  };

  stocks.push(newStock);
  res.status(201).json(newStock);
});

// 刪除股票
app.delete('/api/stocks/:id', (req, res) => {
  const stockId = parseInt(req.params.id);
  const stockIndex = stocks.findIndex(stock => stock.id === stockId);
  
  if (stockIndex === -1) {
    return res.status(404).json({ error: '找不到該股票' });
  }

  stocks.splice(stockIndex, 1);
  res.json({ message: '股票已刪除' });
});

// 獲取投資組合摘要
app.get('/api/portfolio/summary', (req, res) => {
  const totalStocks = stocks.length;
  const totalInvestment = stocks.reduce((sum, stock) => sum + stock.investmentCost, 0);
  const totalMarketValue = stocks.reduce((sum, stock) => {
    const currentPrice = stockPrices[stock.code] || stock.buyPrice;
    return sum + (currentPrice * stock.shares);
  }, 0);
  const totalProfitLoss = totalMarketValue - totalInvestment;

  res.json({
    totalStocks,
    totalInvestment,
    totalMarketValue,
    totalProfitLoss
  });
});

// 獲取股票價格
app.get('/api/stock-price/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const price = stockPrices[code];
  
  if (!price) {
    return res.status(404).json({ error: '找不到股票價格' });
  }

  res.json({ code, price });
});

// 輔助函數 - 獲取股票名稱
function getStockName(code) {
  const stockNames = {
    '2330': '台積電',
    '2030': '彩晶',
    '2454': '聯發科',
    '2317': '鴻海',
    '2882': '國泰金'
  };
  return stockNames[code] || '未知股票';
}

// 提供前端靜態文件
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`伺服器運行在 http://localhost:${PORT}`);
});