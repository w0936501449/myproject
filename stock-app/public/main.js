// main.js - vanilla JS portfolio logic

const summaryEls = {
  count: document.getElementById('sum-count'),
  invest: document.getElementById('sum-invest'),
  market: document.getElementById('sum-market'),
  profit: document.getElementById('sum-profit')
};

const inputCode = document.getElementById('input-code');
const inputShares = document.getElementById('input-shares');
const inputPrice = document.getElementById('input-price');
const btnAdd = document.getElementById('btn-add');
const btnRefresh = document.getElementById('btn-refresh');
const btnReset = document.getElementById('btn-reset');
const tableBody = document.getElementById('table-body');

const LS_KEY = 'tw_stock_portfolio';
let portfolio = JSON.parse(localStorage.getItem(LS_KEY) || '[]');

// Utility: format money
const fmt = (n) => `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

// Fetch price & name from TWSE monthly API (last close)
async function fetchQuote(code) {
  try {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}01`;
    const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${dateStr}&stockNo=${code}`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.stat !== 'OK') throw new Error(data.stat || 'API error');
    const rows = data.data;
    if (!rows || rows.length === 0) throw new Error('No data');
    const lastRow = rows[rows.length - 1];
    const price = parseFloat(lastRow[6].replace(/,/g, ''));
    let name = '-';
    if (data.title) {
      const parts = data.title.split(code);
      if (parts.length > 1) name = parts[1].trim().split(' ')[0];
    }
    return { price, name };
  } catch (err) {
    console.error('fetchQuote', code, err);
    return { price: null, name: null };
  }
}

function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(portfolio));
}

function calcAndRender() {
  // Summary
  const totalInvest = portfolio.reduce((s, p) => s + p.shares * p.buyPrice, 0);
  const totalMarket = portfolio.reduce((s, p) => s + (p.currentPrice ?? p.buyPrice) * p.shares, 0);
  const profit = totalMarket - totalInvest;

  summaryEls.count.textContent = portfolio.length;
  summaryEls.invest.textContent = fmt(totalInvest);
  summaryEls.market.textContent = fmt(totalMarket);
  summaryEls.profit.textContent = fmt(profit);

  // Table
  tableBody.innerHTML = '';
  portfolio.forEach((p) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.code}</td>
      <td>${p.name || '-'}</td>
      <td>${p.shares.toLocaleString()}</td>
      <td>${fmt(p.buyPrice)}</td>
      <td>${p.currentPrice != null ? fmt(p.currentPrice) : '載入中'}</td>
      <td>${fmt(p.shares * p.buyPrice)}</td>
      <td>${p.currentPrice != null ? fmt(p.shares * p.currentPrice) : '-'}</td>
      <td class="${p.currentPrice != null ? (p.currentPrice - p.buyPrice >= 0 ? 'profit' : 'loss') : ''}">
        ${p.currentPrice != null ? fmt((p.currentPrice - p.buyPrice) * p.shares) : '-'}
      </td>
      <td><button class="danger" data-action="remove" data-code="${p.code}">移除</button></td>
    `;
    tableBody.appendChild(tr);
  });
}

async function refreshPricesForAll() {
  if (portfolio.length === 0) return;
  await Promise.all(
    portfolio.map(async (p) => {
      const { price, name } = await fetchQuote(p.code);
      p.currentPrice = price;
      if (!p.name && name) p.name = name;
    })
  );
  save();
  calcAndRender();
}

btnAdd.addEventListener('click', async () => {
  const code = inputCode.value.trim();
  const shares = Number(inputShares.value);
  const priceVal = inputPrice.value.trim();
  if (!code || !shares || shares <= 0) {
    alert('請輸入正確的股票代碼與股數');
    return;
  }
  let buyPrice = priceVal ? Number(priceVal) : null;
  let name = null;
  if (buyPrice == null) {
    const quote = await fetchQuote(code);
    buyPrice = quote.price;
    name = quote.name;
  }
  const existing = portfolio.find((p) => p.code === code);
  if (existing) {
    existing.shares += shares;
    existing.buyPrice = buyPrice; // 更新至最後一次輸入價格
  } else {
    portfolio.push({ code, shares, buyPrice, name, currentPrice: null });
  }
  save();
  await refreshPricesForAll();
  // 清空輸入
  inputCode.value = '';
  inputPrice.value = '';
});

tableBody.addEventListener('click', (e) => {
  if (e.target.matches('button[data-action="remove"]')) {
    const code = e.target.getAttribute('data-code');
    portfolio = portfolio.filter((p) => p.code !== code);
    save();
    calcAndRender();
  }
});

btnReset.addEventListener('click', () => {
  if (confirm('確定要清空投資組合？')) {
    portfolio = [];
    save();
    calcAndRender();
  }
});

btnRefresh.addEventListener('click', async () => {
  await refreshPricesForAll();
});

// Initial
refreshPricesForAll().then(calcAndRender);