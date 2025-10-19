# Feature Specification: Refine Hexa Progress Data and Home Display

**Feature Branch**: `009-refine-hexa-progress-home`  
**Created**: 2025-10-19  
**Status**: Draft  
**Input**: User description: "首頁功能有幾個要調整的，hexa進度資料有必須要整理的部分 因為遊戲系統關係，官方數據 api 有可能會有不是目前職業的技能資訊 詳細判斷方式我等等會跟你講規則 另外還有hexa 進度想多加入一個資訊，api 名稱叫做 \"檢視設定於 HEXA 矩陣中的 HEXA 屬性資訊。\" 這個也會列入 hexa 進度的計算中，資訊也要呈現在首頁上，等等我們來討論如何排版"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View Refined Hexa Progress Data (Priority: P1)

As a user viewing character details on the home page, I want the hexa progress data to be cleaned up by filtering out skill information that doesn't belong to the current class, so that I see only relevant progress information.

**Why this priority**: This is the core data integrity issue that affects the accuracy of hexa progress display.

**Independent Test**: Can be tested by checking that only current class skills appear in hexa progress calculations and displays.

**Acceptance Scenarios**:

1. **Given** a character with hexa matrix data from the official API, **When** the system processes the data, **Then** skills not belonging to the current class are filtered out.
2. **Given** filtered hexa data, **When** displayed on home page, **Then** only relevant skills contribute to progress calculations.

---

### User Story 2 - Include Hexa Attribute Information (Priority: P2)

As a user viewing hexa progress, I want to see the "檢視設定於 HEXA 矩陣中的 HEXA 屬性資訊" included in the progress calculation and displayed on the home page, so that I have complete hexa matrix information.

**Why this priority**: This adds new valuable information to the hexa progress feature.

**Independent Test**: Can be tested by verifying the new attribute information is fetched, calculated, and displayed.

**Acceptance Scenarios**:

1. **Given** the official API provides hexa attribute information, **When** the system fetches it, **Then** it is included in progress calculations.
2. **Given** calculated hexa progress with attributes, **When** displayed on home page, **Then** the attribute information is visible.

---

### User Story 3 - Adjust Home Page Layout for New Information (Priority: P3)

As a user viewing the home page, I want the layout adjusted to accommodate the refined hexa progress data and new attribute information, so that the information is presented clearly.

**Why this priority**: This ensures good user experience with the updated data.

**Independent Test**: Can be tested by verifying the home page displays all hexa information without layout issues.

**Acceptance Scenarios**:

1. **Given** refined hexa data and new attributes, **When** displayed on home page, **Then** the layout accommodates all information clearly.

---

### Edge Cases

- What happens when the API returns no hexa data for a character?
- How does the system handle characters with multiple classes or class changes?
- What if the judgment rules for filtering skills are not yet defined?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST filter out skill information from official API data that does not belong to the character's current class by checking the "hexa_core_type" attribute - if it contains "精通核心" or "強化核心" and either type has more than 4 skills, treat as special case and remove data where hexa_core_level is 0
- **FR-002**: System MUST fetch and include "檢視設定於 HEXA 矩陣中的 HEXA 屬性資訊" (specifically the character_hexa_stat_core data) in hexa progress calculations, using minimum cost for unactivated cores and actual cost for fully activated cores, with partial activations deferred
- **FR-003**: System MUST display the refined hexa progress data on the home page
- **FR-004**: System MUST display the new hexa attribute information (character_hexa_stat_core data) on the home page
- **FR-005**: System MUST adjust the home page layout to present the updated hexa information clearly by adding new attribute information in a separate section below existing hexa progress and presenting it using a table format

### Key Entities _(include if feature involves data)_

- **Character**: Represents a MapleStory character with class information
- **Hexa Matrix**: Contains skill and attribute data for hexa progression
- **Skills**: Individual abilities that may or may not belong to current class
- **Hexa Attributes**: Specific attribute information set in the hexa matrix, consisting of character_hexa_stat_core array with fields: slot_id, main_stat_name, sub_stat_name_1, sub_stat_name_2, main_stat_level, sub_stat_level_1, sub_stat_level_2, stat_grade

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can view hexa progress data with 100% accuracy (no irrelevant skills included)
- **SC-002**: New hexa attribute information is successfully included in calculations and displayed
- **SC-003**: Home page loads refined hexa data within 2 seconds
- **SC-004**: 95% of users can easily locate and understand the hexa progress information on the home page

## Assumptions

- The official API structure and data format remain consistent
- Users have internet connectivity to fetch API data
- The judgment rules for skill filtering will be provided before implementation
- Layout adjustments will be specified before UI development

## Dependencies

- Official MapleStory API availability
- Existing home page and hexa progress components
- Backend API integration for data fetching

## Clarifications

### Session 2025-10-19

- Q: What specific data structure and fields should be used for displaying hexa attribute information? → A: Use the character_hexa_stat_core array from the API response, which contains slot_id, main_stat_name, sub_stat_name_1, sub_stat_name_2, main_stat_level, sub_stat_level_1, sub_stat_level_2, and stat_grade fields.
- Q: How should hexa progress be calculated considering material costs and upgrade probabilities for attribute cores? → A: Calculate using minimum cost for unactivated cores and actual cost for fully activated cores, defer calculation for partially activated cores.
