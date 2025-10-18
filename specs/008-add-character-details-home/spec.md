# Feature Specification: Add Character Details to Home Page

**Feature Branch**: `008-add-character-details-home`  
**Created**: 2025年10月18日  
**Status**: Draft  
**Input**: User description: "想在目前首頁加入遊戲角色的詳細資訊，會包含裝備和全身能力值 詳細規格等等會提供，應該會多兩個區塊，一個顯示裝備，一個顯示全身能力值"

## Clarifications

### Session 2025-10-18

- Q: How to integrate the "戰鬥力" stat into the existing character card? → A: Attach to the existing character card as a highlighted field
- Q: How to present the other stats information? → A: Card format displaying all stats in a grid
- Q: How to present equipment information? → A: Skipped - User will provide detailed description in next clarify session
- Q: What happens when equipment/stats data fails to load? → A: Hide the blocks entirely
- Q: How often should character data be refreshed? → A: Cache for 5 minutes, then auto-refresh

### Session 2025-10-19

- Q: How to present equipment information? → A: Dialog with grid layout as specified (character in center, equipment icons around)
- Q: How should equipment items be arranged in the dialog grid? → A: Follow the specified grid layout order (map equipment types to positions)
- Q: How should character stats be displayed in detail? → A: Table format with paired rows (屬性: 數值 屬性: 數值 per row), supporting merged ranges for min/max values

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View Character Equipment on Home Page (Priority: P1)

As a game player, I want to access my character's equipment details via a button on the home page that opens a dialog showing the gear layout.

**Why this priority**: This provides immediate access to equipment information without cluttering the home page, allowing players to check gear when needed.

**Independent Test**: Can be fully tested by clicking the equipment button on the home page and verifying the dialog opens with the equipment grid layout.

**Acceptance Scenarios**:

1. **Given** the user is logged in and has a character, **When** they click the equipment button on the home page, **Then** a dialog opens showing the character's equipment in a grid layout with character image in center.
2. **Given** the equipment data is available, **When** the dialog loads, **Then** the equipment is displayed in the specified grid arrangement around the character.

---

### User Story 2 - View Character Stats on Home Page (Priority: P2)

As a game player, I want to see my character's overall stats directly on the home page so I can monitor my character's progression.

**Why this priority**: Stats provide a comprehensive view of character strength, supporting informed gameplay decisions.

**Independent Test**: Can be fully tested by loading the home page and verifying the stats block displays correctly, delivering value through stat visibility.

**Acceptance Scenarios**:

1. **Given** the user is logged in and has a character, **When** they visit the home page, **Then** they see a stats block showing their character's overall abilities in a table format with paired rows (屬性: 數值 屬性: 數值 per row), with the "戰鬥力" stat highlighted in the existing character card.
2. **Given** the stats data is available, **When** the page loads, **Then** the stats are displayed in a readable table format, with merged ranges for min/max values where applicable.

---

### Edge Cases

- What happens when no character data is available (e.g., user hasn't created a character)?
- How does the system handle loading errors for equipment or stats data? When data fails to load, the blocks are hidden entirely.
- What displays when equipment slots are empty?
- What happens when equipment preset data is incomplete (only some slots have items)?
- How should min/max stat pairs be displayed (e.g., 最低屬性攻擊力 and 最高屬性攻擊力)? They should be merged into a single range display.
- What happens when certain stats are not available or should not be displayed? Non-essential stats can be filtered out during implementation.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST display an equipment button on the home page that opens a dialog showing the character's gear in a grid layout with character image in center.
- **FR-002**: System MUST display a dedicated stats block on the home page showing the character's overall abilities in a table format with paired rows (屬性: 數值 屬性: 數值 per row), supporting merged ranges for min/max values.
- **FR-003**: System MUST load and display character data when the home page loads.
- **FR-004**: System MUST handle cases where character data is unavailable gracefully.
- **FR-005**: Equipment and stats blocks MUST be visually distinct and clearly labeled.

### Key Entities _(include if feature involves data)_

- **Character**: Represents the game character, containing equipment and stats data.
- **Equipment**: Items worn by the character, with attributes like name, type, icon URL, and stats. Equipment data is merged from base item_equipment and preset overrides based on preset_no.
- **Stats**: Overall character abilities, including numerical values for various attributes. Stats are displayed in a table format with paired rows (屬性: 數值 屬性: 數值 per row), supporting merged ranges for min/max values (e.g., 最低屬性攻擊力 and 最高屬性攻擊力 displayed as a range).

## Constraints & Tradeoffs

- Character data is cached for 5 minutes before auto-refreshing to balance data freshness with API rate limits.
- Equipment data merging: Base equipment from item_equipment is used first, then preset equipment (based on preset_no) overrides only the slots that have items in the preset.
- Equipment arrangement: Items must be arranged in the specified grid layout, mapping equipment types to their designated positions regardless of API response array order.
- Stats display: Stats must be displayed in a table format with paired rows (屬性: 數值 屬性: 數值 per row). Min/max stat pairs (e.g., 最低屬性攻擊力/最高屬性攻擊力) should be merged into range displays. Non-essential stats can be filtered during implementation.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can view character equipment and stats on the home page within 2 seconds of page load.
- **SC-002**: 95% of users can successfully see their character details without errors.
- **SC-003**: The new blocks increase user engagement with character information by 30% (measured by time spent viewing details).
