# Tasks: Dashboard Progress Home Enhancement

**Input**: Design documents from `/specs/004-dashboard-progress-home/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY per constitution Comprehensive Testing principle - include them for all user stories.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `app/`, `components/`, `lib/`, `__tests__/`
- Paths based on Next.js App Router structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify project structure matches implementation plan
- [x] T002 Confirm Next.js 14, React 18, Axios dependencies installed
- [x] T003 [P] Verify Jest testing setup in package.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 [P] Verify existing API utilities in lib/apiUtils.js
- [x] T005 [P] Confirm local storage utilities in lib/localStorage.js
- [x] T006 [P] Verify existing character search API in app/api/character/search/route.js
- [x] T007 [P] Confirm character details API in app/api/characters/[id]/route.js
- [x] T008 Setup error handling patterns for Nexon API integration

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Alliance Battlefield Info (Priority: P1) 🎯 MVP

**Goal**: Display Alliance Battlefield information (union_grade, union_level, union_artifact_level) for searched characters

**Independent Test**: Search for a character and verify Alliance Battlefield fields are displayed in the UI

### Tests for User Story 1 ⚠️

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T009 [P] [US1] Contract test for union API in **tests**/api/union.test.js
- [x] T010 [P] [US1] Integration test for character search with union data in **tests**/components/CharacterCard-union.test.js

### Implementation for User Story 1

- [x] T011 [US1] Create union API route in app/api/union/[ocid]/route.js
- [x] T012 [US1] Update CharacterCard component to display union fields in components/CharacterCard.js
- [x] T013 [US1] Add union data fetching in dashboard-progress page in app/dashboard-progress/page.js
- [x] T014 [US1] Implement error handling for missing union data

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Set Dashboard Progress as Home (Priority: P1)

**Goal**: Make dashboard-progress the default home page when users visit the root URL

**Independent Test**: Navigate to / and verify it shows dashboard-progress content

### Tests for User Story 2 ⚠️

- [x] T015 [P] [US2] Integration test for root path redirection in **tests**/pages/home.test.js

### Implementation for User Story 2

- [x] T016 [US2] Update root page to redirect to dashboard-progress in app/page.js

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Remove Other Pages (Priority: P2)

**Goal**: Remove unused pages to simplify the application to single-page functionality

**Independent Test**: Verify only dashboard-progress page exists and other routes return 404

### Tests for User Story 3 ⚠️

- [x] T017 [P] [US3] Integration test for page removal in **tests**/pages/routing.test.js

### Implementation for User Story 3

- [x] T018 [US3] Remove dashboard page in app/dashboard/page.js
- [x] T019 [US3] Update navigation component to remove unused links in components/Navigation.js

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T020 [P] Update README.md with new features
- [x] T021 Code cleanup and remove unused imports
- [x] T022 Performance optimization for union data loading
- [x] T023 [P] Additional accessibility tests in **tests**/components/accessibility.test.js
- [x] T024 Run quickstart.md validation

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
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- API routes before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Contract test for union API in __tests__/api/union.test.js"
Task: "Integration test for character search with union data in __tests__/components/CharacterCard-union.test.js"
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
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
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
