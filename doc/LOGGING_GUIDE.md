# 日誌系統使用指南 (v1.2.0)

**狀態**: ✅ 穩定運行
**更新時間**: 2025-12-19

## 📋 目錄

- [概述](#概述)
- [使用方法](#使用方法)
- [日誌級別](#日誌級別)
- [最佳實踐](#最佳實踐)
- [故障排除](#故障排除)
- [前端日誌](#前端日誌-frontend-logger)

---

## 概述

專案使用**自定義輕量級結構化 logger**，位於 `src/lib/logger.ts`。

### 特點

- ✅ 無外部依賴，完全相容 Next.js Turbopack
- ✅ 結構化 JSON 日誌輸出
- ✅ 支援 `LOG_LEVEL` 環境變數控制
- ✅ 模組化 child logger
- ✅ API 與 pino 相容

### 為什麼不使用 pino？

`pino` 使用 `thread-stream` 進行多執行緒日誌傳輸，這與 Next.js Turbopack 打包機制不相容。因此我們移除了 `pino` 相關依賴，實現了完全相容其 API 的輕量級替代方案，確保了開發體驗和構建穩定性。

---

## 使用方法

### 1. 導入 logger

```typescript
import { createLogger } from '@/lib/logger';

const logger = createLogger('your-module-name');
```

### 2. 命名規範

| 模組類型 | 命名格式 | 範例 |
|---------|---------|------|
| API 路由 | `api:路徑` | `api:analyze`, `api:tags:suggestions` |
| 庫文件 | `模組名` | `auth`, `middleware`, `config` |
| AI 層 | `ai:子模組` | `ai:openai`, `ai:gemini`, `ai:tag-service` |

### 3. 基本用法

```typescript
// 簡單消息
logger.info('Server started');

// 帶上下文數據
logger.info({ userId: 123, action: 'login' }, 'User logged in');

// 除錯資訊
logger.debug({ requestBody: data }, 'Processing request');

// 警告
logger.warn({ config: 'missing' }, 'Using default configuration');

// 錯誤處理
try {
    // ...
} catch (error) {
    logger.error({ error }, 'Operation failed');
}
```

### 4. 裝飾性日誌（用於除錯）

用於輸出帶邊框和 Emoji 的美化日誌，適合 AI 調用等需要詳細追蹤的場景：

```typescript
// 帶邊框的標題和內容
logger.box('🔍 AI Image Analysis Request', {
    imageSize: '413868 bytes',
    mimeType: 'image/jpeg',
    model: 'gpt-4o'
});

// 輸出完整 JSON
logger.box('📤 API Request', JSON.stringify(requestParams, null, 2));

// 分隔線
logger.divider();
logger.divider('=');  // 使用 = 作為分隔符
```

**輸出效果**（僅開發環境）：

```
================================================================================
[ai:openai] 🔍 AI Image Analysis Request
================================================================================
imageSize: 413868 bytes
mimeType: image/jpeg
model: gpt-4o
--------------------------------------------------------------------------------
```

---

## 日誌級別

### 級別定義

| 級別 |數值 | 使用場景 | 範例 |
|------|-----|---------|------|
| `trace` | 10 | 最詳細的追蹤 | 函數入口/出口 |
| `debug` | 20 | 除錯資訊 | 請求參數、中間結果 |
| `info` | 30 | 重要業務事件 | 用戶登入、API 請求成功 |
| `warn` | 40 | 警告但不影響運行 | 配置缺失、棄用功能 |
| `error` | 50 | 錯誤和異常 | 資料庫連接失敗、API 錯誤 |
| `fatal` | 60 | 致命錯誤 | 系統無法啟動 |

### 環境配置

在 `.env` 文件中設定：

```env
# 開發環境 - 顯示所有日誌
LOG_LEVEL=debug

# 生產環境 - 只顯示 info 及以上
LOG_LEVEL=info

# 靜默模式 - 只顯示錯誤
LOG_LEVEL=error
```

---

## 最佳實踐

### 1. 結構化優於字串拼接

❌ **錯誤**:
```typescript
logger.info(`User ${userId} logged in at ${timestamp}`);
```

✅ **正確**:
```typescript
logger.info({ userId, timestamp }, 'User logged in');
```

### 2. 上下文數據與消息分離

❌ **錯誤**:
```typescript
logger.info('Processing request with data: ' + JSON.stringify(data));
```

✅ **正確**:
```typescript
logger.info({ data }, 'Processing request');
```

### 3. 錯誤日誌包含完整資訊

❌ **錯誤**:
```typescript
logger.error('Something failed');
```

✅ **正確**:
```typescript
logger.error({ error, context: 'additional info' }, 'Operation failed');
```

### 4. 敏感資訊脫敏

❌ **不要記錄**:
```typescript
logger.info({ password: credentials.password }, 'Login attempt');
```

✅ **記錄布林值或長度**:
```typescript
logger.info({ 
    email: credentials.email,
    hasPassword: !!credentials.password 
}, 'Login attempt');
```

### 5. 避免記錄大物件

❌ **錯誤**:
```typescript
logger.debug({ hugeObject }, 'Processing');
```

✅ **正確**:
```typescript
logger.debug({
    id: hugeObject.id,
    type: hugeObject.type,
    itemCount: hugeObject.items?.length
}, 'Processing');
```

---

## 故障排除

### 問題 1: 日誌未顯示

**原因**: `LOG_LEVEL` 設定過高

**解決**:
```env
LOG_LEVEL=debug
```

### 問題 2: 找不到 logger 模組

**原因**: 導入路徑錯誤

**解決**: 確保使用正確的導入：
```typescript
import { createLogger } from '@/lib/logger';
```

### 問題 3: 生產環境日誌過多

**原因**: `LOG_LEVEL` 未設定或設定為 debug

**解決**: 生產環境設定：
```env
LOG_LEVEL=info
```

---

## 輸出格式

### JSON 格式

所有日誌輸出為 JSON 格式，便於日誌聚合平台解析：

```json
{
  "level": "info",
  "time": "2025-12-18T14:17:11.410Z",
  "env": "production",
  "module": "auth",
  "email": "user@example.com",
  "msg": "Login successful"
}
```

### 欄位說明

| 欄位 | 說明 |
|------|------|
| `level` | 日誌級別 (trace/debug/info/warn/error/fatal) |
| `time` | ISO 格式時間戳 |
| `env` | 運行環境 (development/production/test) |
| `module` | 日誌模組標識 |
| `msg` | 日誌消息 |
| `...` | 其他上下文數據 |

---

## 日誌聚合集成

### ELK Stack

```bash
# Logstash 配置
input {
  file {
    path => "/var/log/app/*.log"
    codec => json
  }
}

filter {
  if [module] {
    mutate {
      add_tag => ["structured-log"]
    }
  }
}

output {
  elasticsearch {
    hosts => ["localhost:9200"]
  }
}
```

### DataDog

DataDog Agent 自動識別 JSON 日誌，可按 `module` 欄位分組，按 `level` 欄位過濾和告警。

### CloudWatch Logs

AWS CloudWatch Agent 自動解析 JSON 格式，可創建 Metric Filter 和告警。

---

## 前端日誌 (Frontend Logger)

用於瀏覽器端日誌，自動批量發送到後端。

### 導入

```typescript
import { frontendLogger } from '@/lib/frontend-logger';
```

### 使用方法

```typescript
// 普通日誌
frontendLogger.info('[PageName]', 'Operation completed', { userId: 123 });

// 警告
frontendLogger.warn('[PageName]', 'Slow response detected', { duration: 5000 });

// 錯誤
frontendLogger.error('[PageName]', 'Failed to load data', { error: err.message });

// 僅 console 輸出，不發送到後端
frontendLogger.info('[Debug]', 'Local debug info', {}, { sendToBackend: false });
```

### 批量發送機制

前端日誌採用**批量發送**策略，減少網路請求：

| 觸發條件 | 說明 |
|---------|------|
| **時間窗口** | 1 秒內的日誌合併為一次請求 |
| **緩衝區滿** | 累計 20 條日誌立即發送 |

### 強制刷新

頁面卸載等場景需立即發送日誌：

```typescript
// 在 beforeunload 事件中調用
frontendLogger.forceFlush();
```

### 後端接收

日誌發送到 `POST /api/logs/frontend`，格式：

```json
{
  "logs": [
    { "level": "info", "prefix": "[Home]", "message": "Page loaded", "timestamp": "..." },
    { "level": "info", "prefix": "[Home]", "message": "Data fetched", "timestamp": "..." }
  ]
}
```

---

**文件更新時間**: 2025-12-19

## 📚 相關文件

- [日誌遷移報告](./LOGGING_MIGRATION_FINAL_REPORT.md)
- [專案健康報告](./PROJECT_HEALTH_REPORT.md)
