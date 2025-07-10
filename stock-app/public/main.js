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

// Modal elements
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

modalClose.addEventListener('click', () => hideModal());
modal.addEventListener('click', (e) => {
  if (e.target === modal) hideModal();
});

function showModal() {
  modal.classList.remove('hidden');
  modal.classList.add('show');
}

function hideModal() {
  modal.classList.add('hidden');
  modal.classList.remove('show');
}

// Fetch EPS data
async function fetchEPS(code) {
  const suffixes = ['ci', 'mim', 'basi', 'fh', 'ins'];
  for (const suf of suffixes) {
    try {
      const url = `https://openapi.twse.com.tw/v1/opendata/t187ap06_L_${suf}`;
      const resp = await fetch(url, { cache: 'no-store' });
      const arr = await resp.json();
      const rows = arr.filter((r) => r['公司代號'] === code);
      if (rows.length) return rows;
    } catch (err) {
      console.error('fetchEPS error', suf, err);
    }
  }
  return [];
}

function renderEPSModal(code, name, epsRows) {
  // Sort by year desc then season desc
  epsRows.sort((a, b) => {
    if (a['年度'] !== b['年度']) return b['年度'] - a['年度'];
    return b['季別'] - a['季別'];
  });

  // Build quarterly table
  let html = `<h3>${code} ${name || ''} ─ EPS 資訊</h3>`;
  html += '<h4>各季 EPS</h4><table class="eps-table"><thead><tr><th>年度</th><th>季別</th><th>EPS</th></tr></thead><tbody>';
  epsRows.slice(0, 12).forEach((row) => {
    html += `<tr><td>${row['年度']}</td><td>${row['季別']}</td><td>${row['基本每股盈餘（元）']}</td></tr>`;
  });
  html += '</tbody></table>';

  // Annual EPS sum
  const annual = {};
  epsRows.forEach((r) => {
    const year = r['年度'];
    const val = parseFloat(r['基本每股盈餘（元）']);
    if (!isNaN(val)) {
      annual[year] = (annual[year] || 0) + val;
    }
  });
  const years = Object.keys(annual).sort((a, b) => b - a);
  html += '<h4>年度合計 EPS</h4><table class="eps-table"><thead><tr><th>年度</th><th>EPS</th></tr></thead><tbody>';
  years.slice(0, 5).forEach((y) => {
    html += `<tr><td>${y}</td><td>${annual[y].toFixed(2)}</td></tr>`;
  });
  html += '</tbody></table>';

  modalBody.innerHTML = html;
  showModal();
}

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
      <td class="code-cell" data-code="${p.code}">${p.code}</td>
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
  } else if (e.target.closest('.code-cell')) {
    const cell = e.target.closest('.code-cell');
    const code = cell.getAttribute('data-code');
    const stock = portfolio.find((p) => p.code === code);
    modalBody.innerHTML = '載入中...';
    showModal();
    fetchEPS(code).then((rows) => {
      if (rows.length) {
        renderEPSModal(code, stock?.name, rows);
      } else {
        modalBody.innerHTML = '查無 EPS 資料';
      }
    });
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