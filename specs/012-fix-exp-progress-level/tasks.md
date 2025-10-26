# Tasks: Adjust Experience Progress Component Considering Level

**Input**: Design documents from `/specs/012-fix-exp-progress-level/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY per constitution Comprehensive Testing principle - include them for all user stories.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `components/`, `__tests__/components/` at repository root
- Paths shown below assume Next.js web application structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure per implementation plan
- [x] T002 Initialize Next.js project with React 18 dependencies
- [x] T003 [P] Configure linting and formatting tools

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Setup Jest testing framework for component testing
- [x] T005 [P] Configure Recharts library for chart rendering
- [x] T006 [P] Setup existing ProgressChart.js component structure
- [x] T007 Create base test utilities for chart component testing

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Fix Experience Percentage Display After Level Up (Priority: P1) 🎯 MVP

**Goal**: Ensure experience percentage displays correctly after level transitions

**Independent Test**: Can be fully tested by checking experience percentage display logic in ProgressChart.js

### Tests for User Story 1 ⚠️

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T008 [P] [US1] Unit test for level transition percentage calculation in `__tests__/components/ProgressChart.test.js`
- [x] T009 [P] [US1] Integration test for chart rendering with level data in `__tests__/components/ProgressChart.test.js`

### Implementation for User Story 1

- [x] T010 [US1] Analyze current ProgressChart.js data processing logic in `components/ProgressChart.js`
- [x] T011 [US1] Implement level-aware percentage calculation in ProgressChart.js useMemo hook
- [x] T012 [US1] Add baseline level establishment from first data point
- [x] T013 [US1] Add 100\*n adjustment logic for higher level data points
- [x] T014 [US1] Update component JSDoc documentation for level handling

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Modify ProgressChart.js for Level-Aware Calculations (Priority: P1)

**Goal**: Implement level-adjusted calculations in ProgressChart.js for proper chart visualization

**Independent Test**: Can be fully tested by verifying ProgressChart.js level adjustment calculations

### Tests for User Story 2 ⚠️

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T015 [P] [US2] Unit test for 100\*n level adjustment formula in `__tests__/components/ProgressChart.test.js`
- [x] T016 [P] [US2] Integration test for cross-level chart visualization in `__tests__/components/ProgressChart.test.js`

### Implementation for User Story 2

- [x] T017 [US2] Modify chartData useMemo in `components/ProgressChart.js` for level adjustments
- [x] T018 [US2] Implement level difference calculation (current - baseline)
- [x] T019 [US2] Add percentage adjustment: adjusted = raw + 100 \* levelDiff
- [x] T020 [US2] Preserve raw percentage data for reference
- [x] T021 [US2] Add levelAdjustment field to chart data output

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T022 [P] Documentation updates in `specs/012-fix-exp-progress-level/`
- [x] T023 Code cleanup and refactoring in `components/ProgressChart.js`
- [x] T024 Performance optimization for chart calculations
- [x] T025 [P] Additional unit tests for edge cases in `__tests__/components/ProgressChart.test.js`
- [x] T026 Security review for client-side calculations
- [x] T027 Run quickstart.md validation and testing

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P1)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Builds upon US1 but can be tested independently

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Analysis before implementation
- Core calculation logic before chart integration
- Documentation updates last

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, both user stories can start in parallel
- All tests for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Implementation Strategy

### MVP First (Single User Story)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (core percentage display fix)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Full Implementation

1. Complete Setup + Foundational → Foundation ready
2. Complete User Story 1 → Test independently
3. Complete User Story 2 → Test chart visualization
4. Complete Polish phase → Final validation

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (percentage logic)
   - Developer B: User Story 2 (chart adjustments)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Focus: Frontend-only implementation, single component modification
