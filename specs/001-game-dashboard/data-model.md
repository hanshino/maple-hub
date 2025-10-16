# Data Model: Game Content Dashboard

## Entities

### Character
Represents a game character with leveling information from Nexon MapleStory API.

**Fields:**
- `ocid`: string (unique identifier from API)
- `character_name`: string (character name)
- `world_name`: string (server world name)
- `character_gender`: string (character gender)
- `character_class`: string (character job class)
- `character_class_level`: string (class advancement level)
- `character_level`: integer (current level, must be > 0)
- `character_exp`: integer (current experience points)
- `character_exp_rate`: string (experience progress percentage, e.g., "12.34")
- `character_guild_name`: string (guild name, may be null)
- `character_image`: string (character avatar URL)
- `date`: string (data timestamp)

**Validation Rules:**
- `character_level` must be positive integer
- `character_exp` must be non-negative integer
- `character_exp_rate` must be a valid percentage string
- `character_name` must be non-empty string

**Relationships:**
- None (single entity for initial version)

**State Transitions:**
- Level up: When `character_exp_rate` reaches "100.00", increment `character_level`
- Experience gain: Update `character_exp` and recalculate `character_exp_rate`

**Notes:**
- Data sourced from Nexon MapleStory Open API
- Cached in browser local storage for offline viewing
- API requires ocid obtained from character name search