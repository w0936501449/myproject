# 📊 台灣股票查詢APP

一個功能完整的台灣股票投資組合管理工具，使用 Node.js + Express 後端和現代化的前端界面。

## ✨ 功能特色

- 🎯 **股票投資組合管理** - 新增、刪除和管理您的股票持倉
- 📈 **即時統計資訊** - 顯示總投資金額、市值和損益
- 💰 **自動計算損益** - 自動計算每支股票和總體的投資報酬
- 🎨 **現代化界面** - 美觀的漸層設計和響應式布局
- 📱 **跨裝置支援** - 在桌面和行動裝置上都能完美運行
- 💾 **數據匯出** - 支援將投資組合數據匯出為JSON格式

## 🚀 快速開始

### 環境需求

- Node.js 14.0 或更高版本
- npm 或 yarn 套件管理器

### 安裝步驟

1. **克隆或下載項目**
   ```bash
   git clone <repository-url>
   cd taiwan-stock-app
   ```

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **啟動應用程式**
   ```bash
   npm start
   ```

4. **開啟瀏覽器**
   - 前往 `http://localhost:5000`
   - 開始管理您的股票投資組合！

## 📁 項目結構

```
taiwan-stock-app/
├── backend/
│   └── server.js          # Express 後端服務器
├── public/
│   ├── index.html         # 主要HTML文件
│   ├── style.css          # CSS樣式文件
│   └── script.js          # 前端JavaScript邏輯
├── package.json           # 項目配置和依賴
└── README.md             # 項目說明文件
```

## 🎮 使用方法

### 新增股票

1. 在「新增股票」區域填寫：
   - **股票代碼**：輸入台灣股票代碼（如：2330）
   - **股數**：持有的股票數量
   - **買入價格**：每股的買入價格

2. 點擊「新增股票」按鈕

### 管理投資組合

- **查看統計**：頁面頂部顯示投資組合的整體統計
- **檢視持股**：在投資組合表格中查看所有持股詳情
- **刪除股票**：點擊操作欄中的「刪除」按鈕

### 快速操作

- **🔄 重新整理數據**：更新所有股票價格和統計資訊
- **🗑️ 清空投資組合**：一鍵清除所有持股記錄
- **📊 匯出數據**：將投資組合數據下載為JSON文件

## 🛠️ API 端點

### 股票管理
- `GET /api/stocks` - 獲取所有股票
- `POST /api/stocks` - 新增股票
- `DELETE /api/stocks/:id` - 刪除股票

### 投資組合統計
- `GET /api/portfolio/summary` - 獲取投資組合摘要

### 股票價格
- `GET /api/stock-price/:code` - 獲取特定股票價格

## 🎨 界面特色

- **漸層背景**：美觀的藍紫色漸層背景
- **毛玻璃效果**：現代化的半透明設計元素
- **響應式設計**：在各種螢幕尺寸上都能完美顯示
- **動畫效果**：流暢的懸停和點擊動畫
- **通知系統**：即時的操作反饋和錯誤提示

## 🔧 自定義配置

### 修改伺服器端口
編輯 `backend/server.js` 文件中的 PORT 變數：
```javascript
const PORT = process.env.PORT || 5000; // 修改為您想要的端口
```

### 新增股票數據
在 `backend/server.js` 中的 `stockPrices` 物件添加更多股票：
```javascript
const stockPrices = {
  '2330': 530,  // 台積電
  '2454': 785,  // 聯發科
  // 新增更多股票...
};
```

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request 來改善這個項目！

1. Fork 這個項目
2. 創建您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟一個 Pull Request

## 📝 版本歷史

- **v1.0.0** - 初始版本
  - 基本的股票投資組合管理功能
  - 現代化的用戶界面
  - RESTful API 架構

## 📄 授權條款

本項目採用 ISC 授權條款 - 詳情請參閱 `LICENSE` 文件

## 🙏 致謝

- 感謝所有貢獻者的支持
- 使用了現代化的Web技術和最佳實踐
- 設計靈感來自現代金融應用程式

---

**享受管理您的股票投資組合！** 📈✨