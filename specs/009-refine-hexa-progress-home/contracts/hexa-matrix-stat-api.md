# API Contracts: Hexa Matrix Stat

## Endpoint: GET /character/hexamatrix-stat

**Purpose**: Retrieve hexa matrix statistical information for a character

**Request**:

```
GET https://open.api.nexon.com/maplestorytw/v1/character/hexamatrix-stat?ocid={character_ocid}
Headers:
  accept: application/json
  x-nxopen-api-key: {api_key}
```

**Response**:

```json
{
  "date": "string|null",
  "character_class": "string",
  "character_hexa_stat_core": [
    {
      "slot_id": "number",
      "main_stat_name": "string",
      "sub_stat_name_1": "string",
      "sub_stat_name_2": "string",
      "main_stat_level": "number",
      "sub_stat_level_1": "number",
      "sub_stat_level_2": "number",
      "stat_grade": "number"
    }
  ],
  "character_hexa_stat_core_2": [...],
  "character_hexa_stat_core_3": [...],
  "preset_hexa_stat_core": [...],
  "preset_hexa_stat_core_2": [...],
  "preset_hexa_stat_core_3": [...]
}
```

**Error Responses**:

- 400: Invalid ocid
- 403: Invalid API key
- 404: Character not found
- 429: Rate limit exceeded
- 500: Server error

**Contract Requirements**:

- Response must include character_hexa_stat_core array
- Each core object must have all specified fields
- API must handle rate limiting gracefully
- Client must implement retry logic for transient errors
