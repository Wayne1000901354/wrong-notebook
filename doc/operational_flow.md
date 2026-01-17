# Smart Wrong Notebook (智慧錯題本) - 專案深度分析與操作流程

## 1. 專案概覽

**Smart Wrong Notebook** 是一個基於 Next.js 全端框架開發的智慧錯題管理系統。它利用 AI (Google Gemini / OpenAI) 強大的多模態能力，實現了從錯題錄入、智慧分析、分類管理到針對性練習的全流程閉環。

### 核心價值
*   **自動化錄入**：通過 OCR 和 AI 語義分析，極大降低了錯題整理的時間成本。
*   **結構化管理**：利用知識點標籤和科目分類，將碎片化的錯題轉化為結構化的知識庫。
*   **個性化提升**：基於錯題生成相似題進行變式訓練，並支持自定義列印，回歸紙筆練習。

---

## 2. 核心業務流程詳解

### 2.1 用戶准入與配置 (User Onboarding & Config)
*   **流程**：
    1.  **註冊/登入**：用戶通過信箱/密碼註冊，系統創建獨立帳戶。數據通過 `user_id` 進行嚴格隔離。
        *   *涉及文件*: `src/app/login/page.tsx`, `src/app/register/page.tsx`, `src/lib/auth.ts`
    2.  **AI 配置**：編輯 `config/app-config.json` 文件，配置 API Key 和模型。
        *   *安全性*：該文件已在 `.gitignore` 中，不會提交到版本庫。倉庫中保留 `config/.gitkeep` 確保目錄結構存在。

### 2.2 錯題錄入全流程 (Error Item Entry)
這是系統的核心入口，分為四個階段：

#### 階段一：上傳與預處理
*   **操作**：用戶在錯題本頁面點擊 "添加錯題" 或拖拽圖片。
*   **處理**：
    1.  **圖片壓縮**：前端使用 `browser-image-compression` 對大圖進行壓縮（目標 1MB），減少傳輸延遲。
    2.  **裁剪**：彈出裁剪框 (`ImageCropper`)，用戶手動框選題目區域，去除無關背景。

#### 階段二：AI 智慧分析 ✨ (已優化)
*   **觸發**：裁剪完成後，前端將圖片 Base64 發送至 `/api/analyze`。
*   **後端處理**：
    1.  **Provider 選擇**：系統根據配置自動選擇 Gemini 或 OpenAI Provider。
    2.  **JSON Mode 啟用**：
        *   Gemini: `responseMimeType: "application/json"`
        *   OpenAI: `response_format: { type: "json_object" }`
    3.  **Prompt 構建**：使用標準化的 Prompt 模板，要求 AI 返回結構化的 JSON 數據，包含詳細的 JSON Schema 範例。
    4.  **回應驗證**：使用 Zod Schema (`src/lib/ai/schema.ts`) 進行類型驗證和業務規則檢查。
    5.  **標籤標準化**：AI 返回的知識點標籤會與人教版課程大綱進行智慧匹配，確保標籤的一致性。
    6.  **錯誤處理**：
        *   網路錯誤 → `AI_CONNECTION_FAILED`
        *   JSON 格式錯誤 → `AI_RESPONSE_ERROR`
        *   認證失敗 → `AI_AUTH_ERROR`
        *   未知錯誤 → `AI_UNKNOWN_ERROR`

#### 階段三：人工校對 (Review & Edit)
*   **界面**：進入 `CorrectionEditor` 界面。
*   **操作**：
    *   用戶對比左側原圖，檢查右側 AI 識別的文本。
    *   **科目歸類**：系統自動推薦科目，用戶可修改。
    *   **標籤管理**：用戶可增刪 AI 生成的知識點標籤。標籤輸入支援自動補全，從標準標籤庫和自定義標籤中選擇。
    *   **LaTeX 編輯**：使用 `react-markdown` + `rehype-katex` 實現數學公式的即時預覽。
*   **Markdown 渲染優化** ✨：
    *   自動處理中英文標點後的換行
    *   支援帶圓圈數字（①②③）的列表
    *   修復了 `PRESERVE` 佔位符洩漏問題

#### 階段四：持久化儲存
*   **觸發**：用戶點擊 "保存到錯題本"。
*   **後端處理**：
    1.  數據發送至 `/api/error-items`。
    2.  **資料庫寫入**：在 `ErrorItem` 表中創建記錄，關聯 `Subject` 和知識點標籤。
    3.  **圖片儲存**：原圖以 Base64 格式儲存在資料庫中。

### 2.3 錯題管理與複習 (Management & Review)
*   **錯題本視圖**：
    *   按科目展示錯題本卡片
    *   進入特定科目，列表展示該科目的所有錯題
*   **篩選與檢索**：
    *   支援按 **掌握程度** (待複習/已掌握)、**時間範圍**、**知識點標籤**、**年級/學期**、**卷等級** 篩選
    *   使用 Prisma 的 `where` 子句進行多條件組合查詢

### 2.4 智慧練習與列印 (Practice & Print)
*   **生成練習**：
    *   用戶在錯題詳情頁點擊 "舉一反三"
    *   **AI 變式**：後端調用 `/api/practice/generate`，生成相似題（支援 4 種難度：簡單、適中、困難、挑戰）
    *   **錯誤處理細化** ✨：前端會根據不同的錯誤類型顯示具體提示：
        - 網路連接失敗
        - AI 解析異常
        - 認證失敗
        - 未知錯誤
*   **列印預覽**：
    *   用戶可選擇是否列印答案、解析，調整圖片縮放比例 (30%-100%)
    *   調用瀏覽器列印功能，生成 PDF 或直接列印

---

## 3. 關鍵技術細節與數據流

### 3.1 資料庫架構 (Schema)
核心實體關係如下：
*   **User**: 系統用戶 (1) <-> (N) **ErrorItem**
*   **Subject**: 科目 (1) <-> (N) **ErrorItem**
*   **ErrorItem**: 錯題實體
    *   `questionText`: 題目文本 (Markdown/LaTeX)
    *   `answerText`: 參考答案
    *   `analysis`: 解析思路
    *   `originalImageUrl`: 原圖 (Base64)
    *   `knowledgePoints`: 知識點標籤 (JSON 數組)
    *   `mastered`: 掌握狀態 (Boolean)
    *   `gradeSemester`: 年級/學期
    *   `paperLevel`: 卷等級 (A/B/其他)

### 3.2 AI 架構設計 ✨ (已優化)

```
用戶上傳圖片
    ↓
前端壓縮 + 裁剪
    ↓
API Route (/api/analyze)
    ↓
AI Service (getAIService)
    ├─ Gemini Provider (JSON mode)
    └─ OpenAI Provider (JSON mode)
    ↓
Zod Schema 驗證
    ↓
知識點標籤標準化
    ↓
返回結構化數據
```

**核心優勢**：
1. **雙重保障**：AI JSON mode + Zod 運行時驗證
2. **漸進式降級**：直接解析 → 提取 JSON → jsonrepair → 錯誤
3. **類型安全**：從 Schema 自動推導 TypeScript 類型
4. **標籤一致性**：與人教版課程大綱自動對齊

### 3.3 目錄結構映射
*   `/src/app`: Next.js App Router 頁面路由
*   `/src/components`: UI 組件 (Shadcn UI + Radix UI)
*   `/src/lib`: 核心邏輯庫
    *   `ai/`: AI 介面封裝、Provider 實現、Prompt 模板、Zod Schema
    *   `knowledge-tags.ts`: 人教版數學課程大綱（七八九年級完整標籤庫）
    *   `prisma.ts`: 資料庫客戶端單例
    *   `translations.ts`: 中英文翻譯資源
*   `/prisma`: 資料庫模型定義 (`schema.prisma`) 和種子數據
*   `/config`: AI 配置檔案目錄（通過 `.gitkeep` 保留目錄結構）

### 3.4 最近完成的優化 ✨

1.  **AI 回應處理架構升級**：
    *   啟用 AI JSON mode（Gemini 和 OpenAI）
    *   引入 Zod 進行運行時驗證
    *   簡化解析邏輯（從 ~150 行減至 ~50 行）
    
2.  **知識點標籤精準化**：
    *   Prompt 中同步人教版課程標籤
    *   按年級提供具體標籤範例
    *   強調使用精確標籤名稱（如 "韋達定理" 而非 "一元二次方程的根與係數關係"）

3.  **錯誤提示細化**：
    *   從通用的 "AI 分析失敗" 細化為具體錯誤類型
    *   前端解析 API 返回的錯誤類型（從 `error.data.message`）
    *   顯示用戶友好的錯誤提示（網路、格式、認證、未知）

4.  **UI 渲染修復**：
    *   修復 Markdown 渲染中的 `PRESERVE` 佔位符洩漏問題
    *   優化換行和列表格式處理

5.  **配置檔案管理**：
    *   使用 `.gitkeep` 保留 `config` 目錄
    *   敏感配置檔案已從 Git 歷史中清除
    *   確保 Docker 構建正常

### 3.5 待優化點

1.  **圖片儲存**：目前主要依賴 Base64，對於大量圖片場景，建議遷移至對象儲存 (如 AWS S3 或 MinIO)。
2.  **緩存機制**：AI 分析結果可以根據圖片哈希進行緩存，避免重複調用 API。
3.  **批量處理**：支援一次上傳多張圖片，批量分析和保存。
4.  **移動端優化**：考慮開發 PWA 或原生 App，支援拍照即時分析。

---

## 4. 下一步操作建議

基於以上分析，建議按照以下順序進行開發或維護：
1.  **完善測試**：針對核心的 AI 分析流程 (`/api/analyze`) 添加單元測試，驗證 Zod Schema 和標籤匹配邏輯。
2.  **性能優化**：
    *   引入圖片懶加載優化錯題列表頁
    *   考慮使用虛擬滾動處理大量錯題
3.  **功能增強**：
    *   增加 "複習計畫" 功能，基於艾賓浩斯遺忘曲線自動提醒
    *   支援錯題匯出為 Markdown/PDF
    *   添加數據統計儀表板（錯題趨勢、知識點分布）

---

*最後更新：2025-12-04 23:37*
