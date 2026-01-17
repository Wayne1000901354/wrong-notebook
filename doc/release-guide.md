# 版本發布指南

本文件說明如何發布新版本 Docker 映像檔。

## 版本標籤策略

專案使用語義化版本（Semantic Versioning），格式：`v主版本.次版本.修訂版本`

| 版本類型 | 範例 | 說明 |
|---------|------|------|
| 主版本 | v2.0.0 | 不相容的 API 變更 |
| 次版本 | v1.1.0 | 新增功能，向下相容 |
| 修訂版本 | v1.0.1 | Bug 修復 |

## 發布操作流程

### 1. 確保代碼已提交

```bash
git status
git add .
git commit -m "feat: 新功能描述"
git push origin main
```

### 2. 創建版本標籤

```bash
# 創建標籤（從 v1.0.0 開始）
git tag v1.0.0

# 或指定提交創建標籤
git tag v1.0.0 <commit-sha>
```

### 3. 推送標籤觸發構建

```bash
git push origin v1.0.0
```

### 4. 查看構建狀態

訪問 GitHub 倉庫的 **Actions** 頁面查看構建進度。

## 自動生成的映像檔標籤

推送 `v1.0.0` 標籤後，CI 自動生成以下映像檔標籤：

| 標籤 | 說明 |
|------|------|
| `1.0.0` | 精確版本號 |
| `1.0` | 次版本號（自動更新到最新 1.0.x） |
| `1` | 主版本號（自動更新到最新 1.x.x） |
| `latest` | 最新版本 |
| `sha-xxxxxxx` | Git commit 短哈希 |

## 用戶部署方式

```yaml
# docker-compose.yml
services:
  wrong-notebook:
    # 推薦：鎖定精確版本
    image: ghcr.io/wttwins/wrong-notebook:1.0.0
    
    # 或：自動獲取修訂更新
    image: ghcr.io/wttwins/wrong-notebook:1.0
    
    # 不推薦：始終最新（生產環境慎用）
    image: ghcr.io/wttwins/wrong-notebook:latest
```

## 常用指令

```bash
# 查看所有標籤
git tag -l

# 刪除本地標籤
git tag -d v1.0.0

# 刪除遠端標籤
git push origin --delete v1.0.0

# 查看標籤對應的提交
git show v1.0.0
```
