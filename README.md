# Code Sync Tool

一個用於從遠程源下載並同步代碼的工具。

## 安裝

```bash
npm install --save-dev @tencent-app/code-sync
```

## 使用方法

在項目的 `package.json` 中添加 `code-sync` 配置項：

```json
{
  "scripts": {
    "code-sync": "code-sync"
  },
  "code-sync": [
    {
      "name": "shared-components",
      "zipUrl": "https://example.com/code.zip",
      "unzipPath": "./src/shared",
      "sha256": "optional-sha256-hash-here",
      "auth": "Bearer ${API_TOKEN}",
      "clean": true
    }
  ]
}
```

然後運行：

```bash
# 運行所有任務
npm run code-sync

# 只運行指定的任務
npm run code-sync shared-components
```

## 配置項說明

### Task 配置

每個任務對象支持以下字段：

- **name** (必需): 任務名稱，用於標識和選擇性執行
- **zipUrl** (必需): ZIP 文件的下載地址
- **unzipPath** (必需): 解壓到的目標路徑
- **sha256** (可選): 用於校驗下載文件完整性的 SHA256 哈希值
- **auth** (可選): HTTP Authorization 頭，支持環境變量替換
- **clean** (可選): 解壓前是否清理目標目錄，默認 false

### 環境變量替換

`auth` 字段支持環境變量替換，格式：
- `${VAR_NAME}` - 推薦格式
- `$VAR_NAME` - 簡寫格式

示例：
```json
{
  "auth": "Bearer ${API_TOKEN}"
}
```

然後在命令行中設置環境變量：
```bash
export API_TOKEN=your-token-here
npm run code-sync
```

## 命令行參數

```bash
# 運行所有任務
code-sync

# 只運行指定名稱的任務
code-sync <task-name>
```

示例：
```bash
npm run code-sync shared-components
```

## 工作流程

1. 讀取 `package.json` 中的 `code-sync` 配置
2. 對每個任務：
   - 下載 ZIP 文件到系統臨時目錄
   - 如果配置了 `sha256`，校驗文件完整性
   - 如果配置了 `clean`，清理目標目錄
   - 解壓文件到指定位置
   - 清理臨時文件

## 示例

### 基礎示例

```json
{
  "code-sync": [
    {
      "name": "shared-components",
      "zipUrl": "https://cdn.example.com/shared-components.zip",
      "unzipPath": "./src/components/shared"
    }
  ]
}
```

### 完整示例

```json
{
  "code-sync": [
    {
      "name": "shared-code",
      "zipUrl": "https://api.example.com/files/code.zip",
      "unzipPath": "./src/shared",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "auth": "Bearer ${API_TOKEN}",
      "clean": true
    },
    {
      "name": "assets",
      "zipUrl": "https://cdn.example.com/assets.zip",
      "unzipPath": "./public/assets",
      "clean": false
    }
  ]
}
```

## 許可證

ISC
