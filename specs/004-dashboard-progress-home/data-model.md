# Data Model

## Entities

### Character

- **Fields**:
  - name: string (角色名稱)
  - job: string (職業)
  - level: integer (等級)
  - gender: string (性別)
  - create_date: string (創建日期)
  - guild: string (公會)
  - ocid: string (角色唯一識別碼)
- **Relationships**: Has one Alliance Battlefield Info
- **Validation**: ocid required for API calls

### Alliance Battlefield Info

- **Fields**:
  - date: string | null (資料日期)
  - union_level: integer (戰地等級)
  - union_grade: string (戰地階級)
  - union_artifact_level: integer (神器等級)
  - union_artifact_exp: integer (神器經驗值)
  - union_artifact_point: integer (神器點數)
- **Relationships**: Belongs to Character (via ocid)
- **Validation**: union_level, union_grade, union_artifact_level required for display

## State Transitions

- Character search: Initial state → Loading → Success (with data) | Error
- Alliance data fetch: Not loaded → Loading → Loaded | Error (no data)

## Data Flow

1. User searches character by name
2. System fetches character basic info via /api/character/search
3. System fetches Alliance Battlefield data via /api/union/[ocid]
4. Data cached in local storage for performance
5. UI displays combined character and Alliance info
