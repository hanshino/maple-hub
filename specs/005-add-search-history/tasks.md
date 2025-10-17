---
description: 'Task list template for feature implementation'
---

# Tasks: Add Search History

**Input**: Design documents from `/specs/005-add-search-history/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY per constitution Comprehensive Testing principle - include them for all user stories.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `components/`, `lib/`, `__tests__/`
- Paths shown below assume Next.js app structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Review existing CharacterSearch component structure in components/CharacterCard.js

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 [P] Add history management functions to lib/localStorage.js
- [ ] T003 [P] Create SearchHistory data validation utilities in lib/progressUtils.js

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Search Character and Save History (Priority: P1) 🎯 MVP

**Goal**: Enable users to search characters and automatically save search history with OCID caching

**Independent Test**: Search for a character, verify OCID is retrieved, history is saved in localStorage, and history is displayed in Autocomplete

### Tests for User Story 1 ⚠️

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T004 [P] [US1] Unit test for localStorage history functions in **tests**/lib/localStorage-history.test.js
- [ ] T005 [P] [US1] Integration test for character search with history saving in **tests**/components/CharacterSearch-history.test.js

### Implementation for User Story 1

- [ ] T006 [US1] Update CharacterSearch component to use MUI Autocomplete in components/CharacterCard.js
- [ ] T007 [US1] Integrate history loading and display in CharacterSearch component
- [ ] T008 [US1] Add history saving after successful OCID retrieval in CharacterSearch component
- [ ] T009 [US1] Implement history limit and deduplication logic

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Quick Select from History (Priority: P2)

**Goal**: Allow users to quickly select previously searched characters from history to perform searches using cached OCID

**Independent Test**: With existing history, select a character from Autocomplete dropdown, verify search completes using cached OCID without API call

### Tests for User Story 2 ⚠️

- [ ] T010 [P] [US2] Integration test for history selection and cached OCID usage in **tests**/components/CharacterSearch-history.test.js

### Implementation for User Story 2

- [ ] T011 [US2] Implement Autocomplete selection handler for history items in components/CharacterCard.js
- [ ] T012 [US2] Add logic to use cached OCID for history selections
- [ ] T013 [US2] Update search flow to skip OCID API call when using history

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T014 [P] Add accessibility testing for Autocomplete component
- [ ] T015 [P] Add performance testing for localStorage operations
- [ ] T016 Update component documentation in components/CharacterCard.js
- [ ] T017 Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for base Autocomplete implementation

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for localStorage history functions in __tests__/lib/localStorage-history.test.js"
Task: "Integration test for character search with history saving in __tests__/components/CharacterSearch-history.test.js"

# Launch implementation tasks sequentially within story:
Task: "Update CharacterSearch component to use MUI Autocomplete in components/CharacterCard.js"
Task: "Integrate history loading and display in CharacterSearch component"
Task: "Add history saving after successful OCID retrieval in CharacterSearch component"
Task: "Implement history limit and deduplication logic"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
