# 螢幕截圖功能配置指南

螢幕截圖功能依賴瀏覽器的 `getDisplayMedia()` API，該 API 要求**安全上下文（HTTPS 或 localhost）**才能使用。

本文件介紹如何在不同部署環境下啟用螢幕截圖功能。

## 📋 方案速查

| 場景 | 推薦方案 | 複雜度 |
|------|---------|--------|
| **區域網路 + 1-2 台設備** | [瀏覽器安全例外](#方案零瀏覽器安全例外) | ⭐ 最簡單 |
| **區域網路 + 多設備** | [內建 HTTPS（自動憑證）](#方案一內建-https推薦) | ⭐⭐ 推薦 |
| **公網 + 網域** | [內建 HTTPS + certbot](#公網部署) | ⭐⭐ |

---

## 方案零：瀏覽器安全例外

**適用場景**：區域網路 + 只有 1-2 台設備訪問

**原理**：在瀏覽器設定中將區域網路位址標記為"安全來源"，無需伺服器配置。

### Chrome / Edge

1. 網址列輸入：
   ```
   chrome://flags/#unsafely-treat-insecure-origin-as-secure
   ```

2. 在文字框中輸入（包含連接埠）：
   ```
   http://192.168.1.100:3000
   ```

3. 下拉選擇 **Enabled** → 點擊 **Relaunch**

4. 重新整理頁面，螢幕截圖按鈕應該出現了 ✅

### Firefox

1. 網址列輸入 `about:config`
2. 搜尋 `media.devices.insecure.enabled`
3. 設定為 `true`

### 限制

- ❌ 每台設備都需要單獨配置
- ❌ iOS Safari 不支援此方法

---

## 方案一：內建 HTTPS（推薦）

**適用場景**：區域網路多設備訪問，或需要 iOS 支援

應用內建 HTTPS 代理，**容器啟動時自動生成自簽署憑證**，無需手動操作。

### 快速開始

1. **修改配置檔案**

```yaml
# docker-compose.https.yml
services:
  wrong-notebook:
    ports:
      - "443:443"           # HTTPS 連接埠
    environment:
      - HTTPS_ENABLED=true
      - CERT_DOMAIN=YOUR_IP_OR_DOMAIN  # 替換為你的 IP 或網域
      - NEXTAUTH_URL=https://YOUR_IP_OR_DOMAIN
      - NEXTAUTH_SECRET=your_secret_key
      - AUTH_TRUST_HOST=true
    volumes:
      - ./certs:/app/certs  # 憑證持久化
```

2. **啟動**

```bash
docker-compose -f docker-compose.https.yml up -d
```

3. **驗證**

```bash
# 查看憑證是否生成
docker logs wrong-notebook | grep -i cert
# 輸出: [Entrypoint] 自簽署憑證生成成功: CN=YOUR_IP_OR_DOMAIN
```

4. **訪問**

打開 `https://YOUR_IP_OR_DOMAIN`，首次訪問點擊"進階 → 繼續"即可。

### 環境變數

| 變數 | 必填 | 預設值 | 說明 |
|------|------|--------|------|
| `HTTPS_ENABLED` | 是 | - | 設為 `true` 啟用 HTTPS |
| `CERT_DOMAIN` | 否 | `localhost` | 憑證的 CN（你的 IP 或網域） |
| `NEXTAUTH_URL` | 是 | - | 完整訪問位址 |
| `AUTH_TRUST_HOST` | 是 | - | 設為 `true` |
| `HTTPS_PORT` | 否 | `443` | HTTPS 監聽連接埠 |

### 使用自定義憑證

如果有自己的憑證（如 Let's Encrypt），放入 `./certs` 目錄：

```
certs/
├── cert.pem    # 憑證
└── key.pem     # 私鑰
```

容器啟動時會自動檢測並使用已有憑證，不會重新生成。

### 公網部署

公網部署建議使用 Let's Encrypt 憑證：

```bash
# 1. 安裝 certbot 並獲取憑證
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com

# 2. 複製憑證到專案目錄
mkdir -p certs
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem certs/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem certs/key.pem
sudo chown $USER:$USER certs/*

# 3. 修改 NEXTAUTH_URL 和 CERT_DOMAIN 為你的網域
# 4. 啟動
docker-compose -f docker-compose.https.yml up -d
```

> 注意：Let's Encrypt 憑證需要定期續期，可配置 cron 任務自動更新。

---

## 常見問題

### Q: 憑證過期了怎麼辦？

**自簽署憑證**：刪除 `./certs` 目錄後重啟容器，會自動生成新憑證。

```bash
rm -rf ./certs
docker-compose -f docker-compose.https.yml restart
```

**Let's Encrypt**：運行 `certbot renew` 後複製新憑證並重啟容器。

### Q: 瀏覽器顯示"不安全"警告？

自簽署憑證會顯示警告，這是正常的。點擊"進階 → 繼續"即可。

如需永久信任，可將憑證導入系統：
- **Windows**: 雙擊 `cert.pem` → 安裝 → "受信任的根憑證授權單位"
- **macOS**: 雙擊 `cert.pem` → 添加到鑰匙圈 → 設為"始終信任"
- **iOS**: 通過 AirDrop 發送 → 設定 → 一般 → VPN與裝置管理 → 安裝 → 憑證信任設定 → 啟用

### Q: 群暉 NAS 如何配置？

可使用群暉內建的反向代理：

1. DSM 控制面板 → 登入入口 → 進階 → 反向代理伺服器
2. 新建：來源 HTTPS + 自定義連接埠 → 目的地 `http://localhost:3000`
3. 群暉會自動使用其 SSL 憑證

---

## 檔案結構

```
wrong-notebook/
├── docker-compose.yml           # 標準配置（無 HTTPS）
├── docker-compose.https.yml     # 內建 HTTPS 配置
├── https-server.js              # HTTPS 代理腳本
└── certs/                       # 憑證目錄（自動生成或手動放入）
    ├── cert.pem
    └── key.pem
```

---
