# Feature Specification: Add Rune Systems to Character Info

**Feature Branch**: `007-add-rune-systems`  
**Created**: 2025-10-18  
**Status**: Draft  
**Input**: User description: "接下來角色資訊還想要多加一個區塊，遊戲裡面有兩個系統叫做 `祕法符文`、`真實符文` nexon 有提供 api 可以查詢此資訊，api內容還有該符文的 icon 圖片網址，我希望可以呈現出此資訊"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View Rune Systems in Character Info (Priority: P1)

As a player, I want to see my Secret Rune, True Rune, and Luxury Authentic Rune information in the character details page, organized by type with their icons, levels, force values, and upgrade progress bars, so that I can quickly understand my character's rune status and progression.

**Why this priority**: This is the core functionality requested, providing direct value to players by displaying important character progression information.

**Independent Test**: Can be fully tested by navigating to a character info page and verifying the rune section displays with icons.

**Acceptance Scenarios**:

1. **Given** a character info page is loaded, **When** the user views the page, **Then** a new "Rune Systems" section appears below existing character information with tabs for Secret, True, and Luxury Authentic runes.
2. **Given** the rune section is displayed, **When** API data is available, **Then** runes are shown in a grid layout within their respective type tabs, displaying icons, levels, force values, and progress bars towards next level, with skeleton placeholders for missing runes to maintain 6-per-page layout.
3. **Given** the rune section is displayed, **When** API data is unavailable, **Then** appropriate loading or error states are shown.

---

### Edge Cases

- What happens when the API returns no rune data for a character?
- How does the system handle network failures when fetching rune information?
- What if the icon URLs are invalid or images fail to load?
- How to display when fewer than 6 runes exist for a type (show skeletons)?
- How to handle when only some rune types have data (dynamic tabs)?
- How to display progress for max-level runes (show 100% complete)?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST display a "Rune Systems" section in the character info page
- **FR-002**: System MUST retrieve Secret Rune, True Rune, and Luxury Authentic Rune data from external sources for the selected character
- **FR-003**: System MUST display rune icon, level, force, and upgrade progress bar for each rune
- **FR-004**: System MUST handle API errors gracefully with user-friendly messages
- **FR-005**: System MUST integrate the rune section seamlessly with existing character info layout, displaying runes in a tabbed interface with a switch button in the card top-right, showing up to 6 runes per tab with skeleton placeholders for missing ones
- **FR-006**: System MUST calculate upgrade progress for each rune using type-specific formulas (Arcane: level²+11, Authentic: 9*level²+20*level) and display progress bars

### Key Entities _(include if feature involves data)_

- **Rune**: Represents a rune with type (Secret, True, or Luxury Authentic), icon URL, level, force, growth count, required growth count, and upgrade progress calculation

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can view rune information within 3 seconds of loading the character info page
- **SC-002**: 95% of rune icon images load successfully when API provides valid URLs
- **SC-003**: System maintains existing page load performance with less than 10% degradation
- **SC-004**: Users report clear visibility and understanding of rune status in usability testing
- **SC-005**: Progress bar calculations are 100% accurate based on the provided upgrade formulas

## Assumptions

- Nexon's API provides consistent data structure for rune information
- Character info pages already exist and are accessible
- Users have internet connectivity for API calls and image loading

## Dependencies

- Access to external rune data sources
- Existing character info page infrastructure

## Clarifications

### Session 2025-10-18

- Q: What rune attributes should be displayed in the character info section? → A: Icon, Level, Force
- Q: Should the system display only Secret and True runes, or include Luxury Authentic runes as well? → A: Include Luxury Authentic runes as a third tab if available
- Q: How should runes be displayed in the UI? → A: In a tabbed card interface with switch button in top-right, 6 runes per tab, skeleton placeholders for missing runes
- Q: How to handle varying numbers of rune types available? → A: Dynamically show tabs only for types with data, defaulting to 1-3 tabs
- Q: Should upgrade progress bars be displayed for each rune? → A: Yes, showing progress towards next level using type-specific formulas
