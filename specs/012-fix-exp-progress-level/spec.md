# Feature Specification: Adjust Experience Progress Component Considering Level

**Feature Branch**: `012-fix-exp-progress-level`  
**Created**: 2025-10-26  
**Status**: Draft  
**Input**: User description: "我想要調整本系統的經驗進度元件，目前會因為升等過後而導致經驗%數呈現很奇怪，因此要把等級也考慮進來"

## Clarifications

### Session 2025-10-26

- Q: How many historical records should the experience progress component display? → A: Up to 10 historical records
- Q: How should cross-level data be calculated and presented? → A: Add 100% for cross-level presentation

### Session 2025-10-26 (Additional)

- Q: Where should cross-level percentage calculations be performed? → A: Frontend client-side calculation
- Q: How should the chart presentation handle level transitions? → A: Modify existing line chart with level-adjusted percentages (add 100\*n for n level differences)
- Q: What is the specific calculation formula for cross-level display? → A: Higher levels add 100\*n (e.g., 37.795% at level 279 becomes 100.000% at level 280, showing 63% growth)

### Session 2025-10-26 (Scope)

- Q: What is the scope of changes for this feature? → A: Frontend-only changes, no backend modifications

### Session 2025-10-26 (Implementation)

- Q: What specific component needs modification to complete this task? → A: ProgressChart.js component calculation logic

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Fix Experience Percentage Display After Level Up (Priority: P1)

As a user viewing character progress, I want the experience percentage to display correctly even after leveling up, so that I can accurately track my character's progress.

**Why this priority**: This is the core issue affecting user experience with progress tracking, which is fundamental to the game's dashboard functionality.

**Independent Test**: Can be fully tested by checking experience percentage display for characters at different levels and verifying it resets appropriately after level up.

**Acceptance Scenarios**:

1. **Given** a character has just leveled up, **When** viewing the progress component, **Then** the experience percentage should show 0% for the new level
2. **Given** a character with partial experience in current level, **When** viewing the progress component, **Then** the percentage should reflect progress within the current level range
3. **Given** a character at maximum level, **When** viewing the progress component, **Then** the percentage should show 100% or appropriate completion state

---

### User Story 2 - Modify ProgressChart.js for Level-Aware Calculations (Priority: P1)

As a user viewing the experience line chart, I want the chart to handle level transitions correctly by adjusting percentages in the ProgressChart.js component, so that growth across levels is visually represented.

**Why this priority**: This is the core functionality needed to fix the experience percentage display issue.

**Independent Test**: Can be fully tested by verifying ProgressChart.js correctly calculates and displays level-adjusted percentages.

**Acceptance Scenarios**:

1. **Given** ProgressChart.js receives data with level transitions, **When** processing chart data, **Then** it adds 100\*n to higher level percentages for proper visualization
2. **Given** character data from level 279 (37.795%) to level 280 (0.000%), **When** the chart renders, **Then** it shows progression from 37.795% to 100.000%
3. **Given** multiple level transitions, **When** calculating display percentages, **Then** each level adds appropriate 100\*n adjustment

---

### Edge Cases

- What happens when character data is incomplete or corrupted?
- How does system handle characters at level 1 vs maximum level?
- What if experience values exceed expected ranges?
- How to handle multiple level transitions in chart display?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST calculate experience percentage based on current level's experience range
- **FR-002**: System MUST display 0% when character has just leveled up
- **FR-003**: System MUST show accurate progress within current level boundaries
- **FR-004**: System MUST handle edge cases like level 1 and maximum level appropriately
- **FR-005**: ProgressChart.js MUST add 100\*n to cross-level data points for chart display (where n is level difference from baseline)
- **FR-006**: ProgressChart.js MUST perform level-aware percentage calculations client-side
- **FR-007**: System MUST NOT require any backend API changes or new endpoints
- **FR-008**: System MUST NOT require modifications to other components beyond ProgressChart.js

### Key Entities _(include if feature involves data)_

- **Character**: Represents game character with level and experience data
- **Experience Progress**: Calculated percentage within current level
- **Chart Data Point**: Level-adjusted percentage value for chart visualization in ProgressChart.js

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Experience percentage displays correctly for all character levels (0-100% range)
- **SC-002**: No incorrect percentage values shown after level up events
- **SC-003**: Progress component renders without errors for all valid character data
- **SC-004**: ProgressChart.js correctly applies 100\*n adjustment for cross-level data points
- **SC-005**: Chart displays level-adjusted progression (e.g., 37.795% → 100.000% for 1 level gain)
- **SC-006**: Frontend performs all calculations without server-side processing
- **SC-007**: No backend modifications required for the feature implementation
- **SC-008**: Only ProgressChart.js component requires modification
