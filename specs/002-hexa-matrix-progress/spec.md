# Feature Specification: 六轉進度 Display

**Feature Branch**: `002-hexa-matrix-progress`  
**Created**: 2025-10-17  
**Status**: Draft  
**Input**: User description: "接下來想做一個功能，是在原有的 dashboard-progress 上，多加一個資訊，當角色在 character_class_level 為6的時候要多顯示一個區塊，當角色達到六次轉職的時候，遊戲裡面稱為 hexa 矩陣，每個技能都可以練到30等，因此我想顯示一下這部分的進度"

## Clarifications

### Session 2025-10-17

- Q: What is the API endpoint and data format for Hexa Matrix data? → A: GET https://open.api.nexon.com/maplestorytw/v1/character/hexamatrix?ocid={ocid} with JSON response containing character_hexa_core_equipment array
- Q: How should Hexa Matrix progress be calculated and displayed? → A: Calculate progress based on Soul Elder and Soul Elder Fragment consumption per level, showing spent vs total required for max progress

### Session 2025-10-17 (Additional)

- Q: What should the display name be for this feature? → A: 六轉進度
- Q: How should the progress block be displayed? → A: Show only total progress by default, use MUI components to expand for detailed information

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Display 六轉進度 (Priority: P1)

As a MapleStory player, I want to see the 六轉進度 when my character reaches class level 6, so that I can track my skill advancement in the Hexa Matrix system.

**Why this priority**: This is the core functionality requested - displaying 六轉進度 for level 6 characters.

**Independent Test**: Can be fully tested by viewing the dashboard-progress page for a level 6 character and verifying the 六轉進度 block appears with total progress information.

**Acceptance Scenarios**:

1. **Given** a character with character_class_level = 6, **When** viewing the dashboard-progress page, **Then** a 六轉進度 block is displayed showing total progress
2. **Given** a character with character_class_level < 6, **When** viewing the dashboard-progress page, **Then** no 六轉進度 block is displayed
3. **Given** a level 6 character with Hexa Matrix data, **When** viewing the progress block, **Then** total progress is shown, with option to expand for detailed core progress using MUI components

---

### User Story 2 - Handle Missing Data (Priority: P2)

As a user, I want the system to handle cases where 六轉進度 data is not available, so that the page still loads properly.

**Why this priority**: Ensures robustness when API data is incomplete.

**Independent Test**: Can be tested by viewing dashboard-progress for a level 6 character without 六轉進度 data and verifying appropriate fallback behavior.

**Acceptance Scenarios**:

1. **Given** a level 6 character with no 六轉進度 data available, **When** viewing the dashboard-progress page, **Then** the page loads without errors and shows appropriate message for missing data

---

### Edge Cases

- What happens when character_class_level is null or invalid?
- How does system handle when Hexa Matrix API returns partial data?
- What if character data is cached and becomes stale?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST check character_class_level when loading dashboard-progress page
- **FR-002**: System MUST display 六轉進度 block only when character_class_level equals 6
- **FR-003**: System MUST show total progress information in the 六轉進度 block by default, with option to expand detailed core progress using MUI components
- **FR-004**: System MUST handle cases where Hexa Matrix data is unavailable gracefully
- **FR-005**: System MUST integrate the new block into the existing dashboard-progress layout
- **FR-006**: System MUST fetch Hexa Matrix data from Nexon API endpoint: GET /maplestorytw/v1/character/hexamatrix?ocid={ocid}
- **FR-007**: System MUST calculate and display progress based on Soul Elder and Soul Elder Fragment consumption for each core type
- **FR-008**: System MUST show total resources spent vs total required for max progress (level 30 all cores)

### Key Entities _(include if feature involves data)_

- **Hexa Matrix Core**: Represents a Hexa Matrix core equipment entry
  - Attributes: hexa_core_name (string), hexa_core_level (integer 0-30), hexa_core_type (string: 技能核心/精通核心/強化核心/共用核心), linked_skill (array of objects with hexa_skill_id)
  - Relationships: belongs to Character (via ocid)
- **Hexa Matrix Skill**: Represents individual skills linked to cores
  - Attributes: hexa_skill_id (string), linked to hexa_core_name
  - Relationships: belongs to Hexa Matrix Core
- **Hexa Matrix Level Cost**: Represents resource costs for leveling Hexa Matrix cores
  - Attributes: level (integer 0-30), skill_core_soul_elder (integer), skill_core_soul_elder_fragment (integer), mastery_core_soul_elder (integer), mastery_core_soul_elder_fragment (integer), enhancement_core_soul_elder (integer), enhancement_core_soul_elder_fragment (integer), shared_core_soul_elder (integer), shared_core_soul_elder_fragment (integer)
  - Relationships: used for progress calculation

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can view 六轉進度 within 2 seconds of loading dashboard-progress page for level 6 characters
- **SC-002**: 100% of level 6 characters show the 六轉進度 block when data is available
- **SC-003**: Users report clear understanding of progress visualization (measured via user feedback)
- **SC-004**: Page load time does not increase by more than 10% for non-level 6 characters
