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
- **clean** (可選): 解壓前是否清理目標目錄，默認 `false`

### 文件處理說明

- **覆蓋行為**: 會自動覆蓋已存在的同名文件
- **保留文件**: 不會刪除壓縮包中不存在的文件（除非設置 `clean: true`）
- **目錄清理**: 設置 `clean: true` 時，會在解壓前完全清空目標目錄

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
   - 如果配置了 `clean`，清理目標目錄
   - 解壓文件到指定位置（覆蓋同名文件）
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

### 多任務示例

```json
{
  "code-sync": [
    {
      "name": "api-types",
      "zipUrl": "https://api.example.com/types.zip",
      "unzipPath": "./src/types",
      "clean": true
    },
    {
      "name": "base-cocos",
      "zipUrl": "https://cdn.example.com/base-cocos.zip",
      "unzipPath": "./base-cocos"
    }
  ]
}
```

## 特性

- ✅ 跨平台支持（Windows/macOS/Linux）
- ✅ 自動處理 HTTP 重定向
- ✅ 支持 HTTP 和 HTTPS 協議
- ✅ 自動覆蓋已存在的文件
- ✅ 可選的目錄清理功能
- ✅ 支持指定任務執行

## 許可證

ISC
