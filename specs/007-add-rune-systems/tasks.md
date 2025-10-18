# Tasks: Add Rune Systems to Character Info

**Input**: Design documents from `/specs/007-add-rune-systems/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY per constitution Comprehensive Testing principle - include them for all user stories.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `app/`, `components/`, `lib/`, `api/`
- Paths shown below assume Next.js app directory structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create rune-related directories in components/runes/ and lib/runeUtils/
- [x] T002 Install required dependencies (Material-UI Tabs, LinearProgress components)
- [x] T003 [P] Configure environment variables for Nexon API key

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create Next.js API route for rune data proxy in app/api/character/[ocid]/runes/route.js
- [x] T005 [P] Create Rune entity utility functions in lib/runeUtils.js
- [x] T006 [P] Create base RuneCard component in components/runes/RuneCard.js
- [x] T007 Setup error handling utilities for API calls

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Rune Systems in Character Info (Priority: P1) 🎯 MVP

**Goal**: Display Secret, True, and Luxury Authentic rune information with icons, levels, force values, and upgrade progress bars in a tabbed interface

**Independent Test**: Navigate to a character info page and verify the rune section displays with tabs, icons, progress bars, and skeleton placeholders

### Tests for User Story 1 ⚠️

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T008 [P] [US1] Unit test for rune progress calculation in **tests**/lib/runeUtils.test.js
- [x] T009 [P] [US1] Unit test for RuneCard component in **tests**/components/runes/RuneCard.test.js
- [x] T010 [US1] Integration test for rune API route in **tests**/api/character/[ocid]/runes.test.js

### Implementation for User Story 1

- [x] T011 [P] [US1] Implement rune type filtering logic in lib/runeUtils.js
- [x] T012 [P] [US1] Implement progress bar calculation for each rune type in lib/runeUtils.js
- [x] T013 [US1] Complete RuneCard component with icon, level, force, and progress bar in components/runes/RuneCard.js
- [x] T014 [US1] Create RuneSystems component with tabbed interface in components/runes/RuneSystems.js
- [x] T015 [US1] Integrate RuneSystems into home page in app/page.js
- [x] T016 [US1] Add skeleton placeholder logic for missing runes in components/runes/RuneSystems.js

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T017 [P] Add accessibility attributes to rune components
- [x] T018 Code cleanup and performance optimization in rune components
- [x] T019 [P] Add error boundary for rune section in components/runes/ErrorBoundary.js
- [x] T020 Documentation updates for rune system integration
- [x] T021 Run quickstart.md validation and update if needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for rune progress calculation in __tests__/lib/runeUtils.test.js"
Task: "Unit test for RuneCard component in __tests__/components/runes/RuneCard.test.js"

# Launch implementation tasks in parallel where possible:
Task: "Implement rune type filtering logic in lib/runeUtils.js"
Task: "Implement progress bar calculation for each rune type in lib/runeUtils.js"
Task: "Complete RuneCard component with icon, level, force, and progress bar in components/runes/RuneCard.js"
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
3. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
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
