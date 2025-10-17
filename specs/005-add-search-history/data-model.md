# Data Model: Add Search History

## Entities

### SearchHistory

Represents a cached character search entry stored in localStorage.

**Fields**:

- `characterName` (string, required): The character name entered by user
  - Validation: Non-empty string, trimmed
  - Max length: 50 characters (reasonable limit for names)
- `ocid` (string, required): Character identifier from Nexon API
  - Validation: Non-empty string, matches expected OCID format
- `timestamp` (string, required): ISO 8601 timestamp of when search was performed
  - Validation: Valid ISO date string, not in future

**Relationships**: None (standalone entity)

**Validation Rules**:

- All fields required
- No duplicate characterName entries (most recent wins)
- Maximum 10 entries in collection
- Entries ordered by timestamp descending (most recent first)

**State Transitions**: None (static data structure)

**Storage**: JSON array in localStorage under key 'characterSearchHistory'

**Example**:

```json
[
  {
    "characterName": "TestCharacter",
    "ocid": "12345678901234567890",
    "timestamp": "2025-10-18T10:30:00.000Z"
  }
]
```
