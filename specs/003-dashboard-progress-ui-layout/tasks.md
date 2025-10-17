---
description: 'Task list template for feature implementation'
---

# Tasks: Dashboard Progress UI Layout Adjustment

**Input**: Design documents from `/specs/003-dashboard-progress-ui-layout/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY per constitution Comprehensive Testing principle - include them for all user stories.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js app router**: `app/`, `components/`, `__tests__/`
- Adjust based on plan.md structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify project dependencies and basic structure for the feature

- [x] T001 Verify Recharts dependency is installed in package.json
- [x] T002 Confirm Material-UI Grid components are available

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ensure existing components and API integrations are ready for the layout changes

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Verify existing CharacterCard component exists at components/CharacterCard.js
- [x] T004 Verify existing ProgressBar component exists at components/ProgressBar.js
- [x] T005 Verify dashboard-progress page exists at app/dashboard-progress/page.js
- [x] T006 Confirm Hexa Matrix API integration exists in lib/hexaMatrixApi.js

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Adjust Dashboard Progress Layout (Priority: P1) 🎯 MVP

**Goal**: Reorganize the dashboard-progress page into a two-row grid layout with character info/experience in the first row and Hexa Matrix progress in the second row

**Independent Test**: Can be fully tested by viewing the dashboard-progress page and verifying the grid layout displays with two rows, character info and experience in row 1, and Hexa Matrix chart in row 2 for level 6 characters

### Tests for User Story 1 ⚠️

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T007 [P] [US1] Unit test for HexaMatrixProgress component in **tests**/components/HexaMatrixProgress.test.js
- [ ] T008 [US1] Integration test for dashboard-progress page layout in **tests**/pages/dashboard-progress-layout.test.js

### Implementation for User Story 1

- [ ] T009 [US1] Create HexaMatrixProgress component at components/HexaMatrixProgress.js with radial chart visualization
- [ ] T010 [US1] Modify dashboard-progress page at app/dashboard-progress/page.js to use Material-UI Grid layout with two rows
- [ ] T011 [US1] Integrate HexaMatrixProgress component into dashboard-progress page with conditional rendering for level 6 characters
- [ ] T012 [US1] Add lazy loading for HexaMatrixProgress component to optimize performance

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and validation

- [ ] T013 [P] Update README.md with any new component documentation
- [ ] T014 Run accessibility testing on the new layout
- [ ] T015 Performance test the dashboard-progress page load times
- [ ] T016 Validate responsive design across different screen sizes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS user story
- **User Story (Phase 3)**: Depends on Foundational phase completion
- **Polish (Phase 4)**: Depends on User Story completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies

### Within User Story 1

- Tests MUST be written and FAIL before implementation
- Component creation before page modification
- Core layout before lazy loading optimization
- Story complete before polish phase

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Tests for User Story 1 marked [P] can run in parallel
- Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch tests for User Story 1 together:
Task: "Unit test for HexaMatrixProgress component in __tests__/components/HexaMatrixProgress.test.js"
Task: "Integration test for dashboard-progress page layout in __tests__/pages/dashboard-progress-layout.test.js"

# Launch implementation tasks sequentially:
Task: "Create HexaMatrixProgress component at components/HexaMatrixProgress.js with radial chart visualization"
Task: "Modify dashboard-progress page at app/dashboard-progress/page.js to use Material-UI Grid layout with two rows"
Task: "Integrate HexaMatrixProgress component into dashboard-progress page with conditional rendering for level 6 characters"
Task: "Add lazy loading for HexaMatrixProgress component to optimize performance"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks story)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Complete Polish phase → Final validation

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 implementation
   - Developer B: User Story 1 tests
3. Complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
