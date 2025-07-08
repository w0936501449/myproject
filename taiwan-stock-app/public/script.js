// 全域變數
let stocks = [];
let portfolioSummary = {};

// API 基礎 URL
const API_BASE = '/api';

// DOM 元素
const elements = {
    // 統計卡片
    totalStocks: document.getElementById('totalStocks'),
    totalInvestment: document.getElementById('totalInvestment'),
    totalMarketValue: document.getElementById('totalMarketValue'),
    totalProfitLoss: document.getElementById('totalProfitLoss'),
    
    // 表單
    addStockForm: document.getElementById('addStockForm'),
    stockCode: document.getElementById('stockCode'),
    shares: document.getElementById('shares'),
    buyPrice: document.getElementById('buyPrice'),
    
    // 表格
    portfolioTableBody: document.getElementById('portfolioTableBody'),
    emptyState: document.getElementById('emptyState'),
    
    // 載入與通知
    loadingOverlay: document.getElementById('loadingOverlay'),
    notification: document.getElementById('notification')
};

// 初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

// 初始化應用程式
async function initializeApp() {
    showLoading(true);
    try {
        await loadStocks();
        await loadPortfolioSummary();
        renderStocks();
        updateStatistics();
    } catch (error) {
        console.error('初始化失敗:', error);
        showNotification('載入數據失敗，請重新整理頁面', 'error');
    } finally {
        showLoading(false);
    }
}

// 設置事件監聽器
function setupEventListeners() {
    // 新增股票表單
    elements.addStockForm.addEventListener('submit', handleAddStock);
    
    // 通知關閉按鈕
    document.querySelector('.notification-close').addEventListener('click', hideNotification);
    
    // 股票代碼輸入框自動轉大寫
    elements.stockCode.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
}

// 載入股票數據
async function loadStocks() {
    try {
        const response = await fetch(`${API_BASE}/stocks`);
        if (!response.ok) throw new Error('獲取股票數據失敗');
        stocks = await response.json();
    } catch (error) {
        console.error('載入股票失敗:', error);
        throw error;
    }
}

// 載入投資組合摘要
async function loadPortfolioSummary() {
    try {
        const response = await fetch(`${API_BASE}/portfolio/summary`);
        if (!response.ok) throw new Error('獲取投資組合摘要失敗');
        portfolioSummary = await response.json();
    } catch (error) {
        console.error('載入投資組合摘要失敗:', error);
        throw error;
    }
}

// 新增股票
async function handleAddStock(event) {
    event.preventDefault();
    
    const stockData = {
        code: elements.stockCode.value.trim(),
        shares: parseInt(elements.shares.value),
        buyPrice: parseFloat(elements.buyPrice.value)
    };
    
    // 驗證輸入
    if (!stockData.code || !stockData.shares || !stockData.buyPrice) {
        showNotification('請填寫所有欄位', 'error');
        return;
    }
    
    if (stockData.shares <= 0 || stockData.buyPrice <= 0) {
        showNotification('股數和買入價格必須大於0', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/stocks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(stockData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '新增股票失敗');
        }
        
        // 清空表單
        elements.addStockForm.reset();
        
        // 重新載入數據
        await loadStocks();
        await loadPortfolioSummary();
        renderStocks();
        updateStatistics();
        
        showNotification(`成功新增股票 ${stockData.code}`, 'success');
    } catch (error) {
        console.error('新增股票失敗:', error);
        showNotification(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 刪除股票
async function deleteStock(stockId) {
    if (!confirm('確定要刪除這支股票嗎？')) return;
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/stocks/${stockId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '刪除股票失敗');
        }
        
        // 重新載入數據
        await loadStocks();
        await loadPortfolioSummary();
        renderStocks();
        updateStatistics();
        
        showNotification('股票已成功刪除', 'success');
    } catch (error) {
        console.error('刪除股票失敗:', error);
        showNotification(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 渲染股票列表
function renderStocks() {
    if (stocks.length === 0) {
        elements.portfolioTableBody.innerHTML = '';
        elements.emptyState.style.display = 'block';
        return;
    }
    
    elements.emptyState.style.display = 'none';
    
    elements.portfolioTableBody.innerHTML = stocks.map(stock => {
        const profitLossClass = stock.profitLoss > 0 ? 'profit' : 
                               stock.profitLoss < 0 ? 'loss' : 'neutral';
        
        return `
            <tr>
                <td><strong>${stock.code}</strong></td>
                <td>${stock.name}</td>
                <td>${stock.shares.toLocaleString()}</td>
                <td>$${stock.buyPrice.toFixed(2)}</td>
                <td>$${stock.currentPrice.toFixed(2)}</td>
                <td>$${stock.investmentCost.toLocaleString()}</td>
                <td>$${stock.marketValue.toLocaleString()}</td>
                <td class="${profitLossClass}">
                    ${stock.profitLoss >= 0 ? '+' : ''}$${stock.profitLoss.toLocaleString()}
                </td>
                <td>
                    <button 
                        class="delete-btn" 
                        onclick="deleteStock(${stock.id})"
                    >
                        刪除
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// 更新統計數據
function updateStatistics() {
    elements.totalStocks.textContent = portfolioSummary.totalStocks || 0;
    elements.totalInvestment.textContent = `$${(portfolioSummary.totalInvestment || 0).toLocaleString()}`;
    elements.totalMarketValue.textContent = `$${(portfolioSummary.totalMarketValue || 0).toLocaleString()}`;
    
    const profitLoss = portfolioSummary.totalProfitLoss || 0;
    const profitLossText = `${profitLoss >= 0 ? '+' : ''}$${profitLoss.toLocaleString()}`;
    elements.totalProfitLoss.textContent = profitLossText;
    
    // 設置損益顏色
    elements.totalProfitLoss.className = `stat-value ${
        profitLoss > 0 ? 'profit' : profitLoss < 0 ? 'loss' : 'neutral'
    }`;
}

// 顯示/隱藏載入動畫
function showLoading(show) {
    elements.loadingOverlay.style.display = show ? 'flex' : 'none';
}

// 顯示通知
function showNotification(message, type = 'success') {
    const notification = elements.notification;
    const textElement = notification.querySelector('.notification-text');
    
    textElement.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'flex';
    
    // 自動隱藏通知
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

// 隱藏通知
function hideNotification() {
    elements.notification.style.display = 'none';
}

// 快速操作函數

// 清空投資組合
async function clearAllStocks() {
    if (!confirm('確定要清空所有股票嗎？此操作無法復原！')) return;
    
    showLoading(true);
    
    try {
        // 逐一刪除所有股票
        for (const stock of stocks) {
            const response = await fetch(`${API_BASE}/stocks/${stock.id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('清空投資組合失敗');
        }
        
        // 重新載入數據
        await loadStocks();
        await loadPortfolioSummary();
        renderStocks();
        updateStatistics();
        
        showNotification('投資組合已清空', 'success');
    } catch (error) {
        console.error('清空投資組合失敗:', error);
        showNotification('清空投資組合失敗', 'error');
    } finally {
        showLoading(false);
    }
}

// 重新整理數據
async function refreshData() {
    showLoading(true);
    
    try {
        await loadStocks();
        await loadPortfolioSummary();
        renderStocks();
        updateStatistics();
        showNotification('數據已更新', 'success');
    } catch (error) {
        console.error('重新整理失敗:', error);
        showNotification('重新整理失敗', 'error');
    } finally {
        showLoading(false);
    }
}

// 匯出數據
function exportData() {
    if (stocks.length === 0) {
        showNotification('沒有數據可以匯出', 'warning');
        return;
    }
    
    try {
        // 準備匯出數據
        const exportData = {
            exportDate: new Date().toISOString(),
            summary: portfolioSummary,
            stocks: stocks
        };
        
        // 創建並下載JSON文件
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `投資組合_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        showNotification('數據已匯出', 'success');
    } catch (error) {
        console.error('匯出數據失敗:', error);
        showNotification('匯出數據失敗', 'error');
    }
}

// 格式化數字為貨幣格式
function formatCurrency(amount) {
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0
    }).format(amount);
}

// 格式化百分比
function formatPercentage(value) {
    return `${(value * 100).toFixed(2)}%`;
}

// 處理網路錯誤
function handleNetworkError(error) {
    console.error('網路錯誤:', error);
    showNotification('網路連線錯誤，請檢查網路連線', 'error');
}

// 防抖函數
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}