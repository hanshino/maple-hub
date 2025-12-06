# Data Model: 修復 Google Sheet 重複 OCID 問題

**Feature**: 015-fix-duplicate-ocid  
**Date**: 2025-12-07  
**Status**: Complete

## Entities

### 1. OCID Record (OCID 工作表)

**Location**: Google Sheets - 第一個工作表（Sheet1）的 A 欄

| Field | Type   | Description | Validation            |
| ----- | ------ | ----------- | --------------------- |
| ocid  | string | 角色識別碼  | 非空、長度 10-50 字元 |

**Uniqueness**: 每個 OCID 值應只出現一次

**Deduplication Strategy**: 保留第一筆出現的記錄（最小行索引）

---

### 2. CombatPower Record (CombatPower 工作表)

**Location**: Google Sheets - CombatPower 工作表

| Field        | Type              | Description | Validation               |
| ------------ | ----------------- | ----------- | ------------------------ |
| ocid         | string (Column A) | 角色識別碼  | 非空                     |
| combat_power | string (Column B) | 戰力數值    | 數字字串                 |
| updated_at   | string (Column C) | 更新時間    | ISO 8601 格式            |
| status       | string (Column D) | 狀態        | success/failed/not_found |

**Uniqueness**: 每個 OCID 值應只出現一次

**Deduplication Strategy**: 保留 `updated_at` 最新的記錄

---

## State Transitions

### Deduplication Operation States

```
┌─────────────────┐
│     Idle        │
└────────┬────────┘
         │ API Call
         ▼
┌─────────────────┐
│   Validating    │ ─── Invalid Token ──▶ [401 Unauthorized]
└────────┬────────┘
         │ Valid Token
         ▼
┌─────────────────┐
│    Reading      │ ─── API Error ──▶ [500 Error]
│   Sheet Data    │
└────────┬────────┘
         │ Data Loaded
         ▼
┌─────────────────┐
│   Detecting     │
│   Duplicates    │
└────────┬────────┘
         │
         ├── dryRun=true ──▶ [200 Preview Response]
         │
         │ dryRun=false
         ▼
┌─────────────────┐
│    Deleting     │ ─── Partial Error ──▶ [200 Partial Success]
│   Duplicates    │
└────────┬────────┘
         │ Success
         ▼
┌─────────────────┐
│   Completed     │ ──▶ [200 Success Response]
└─────────────────┘
```

---

## API Response Models

### Success Response

```typescript
interface DeduplicationResponse {
  success: boolean;
  dryRun: boolean;
  ocidSheet: {
    totalRecords: number;
    duplicatesFound: number;
    removed: number;
    duplicateDetails?: Array<{
      ocid: string;
      count: number;
    }>;
  };
  combatPowerSheet: {
    totalRecords: number;
    duplicatesFound: number;
    removed: number;
    duplicateDetails?: Array<{
      ocid: string;
      count: number;
      kept: {
        updated_at: string;
        combat_power: string;
      };
    }>;
  };
  executionTimeMs: number;
  timestamp: string;
}
```

### Error Response

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  details?: {
    ocidSheetError?: string;
    combatPowerSheetError?: string;
  };
  timestamp: string;
}
```

---

## Relationships

```
┌─────────────────────┐
│    OCID Sheet       │
│    (Sheet1!A:A)     │
│                     │
│  Primary key: ocid  │
│  Unique constraint  │
└──────────┬──────────┘
           │ 1:1 (should be)
           │ Currently may be 1:N (duplicates)
           ▼
┌─────────────────────┐
│  CombatPower Sheet  │
│  (CombatPower!A:D)  │
│                     │
│  Foreign key: ocid  │
│  Unique constraint  │
└─────────────────────┘
```

**Note**: 目前兩個工作表可能存在重複記錄（1:N），去重操作後應恢復為 1:1 關係。
