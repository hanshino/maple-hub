# Tasks: Optimize Rune Image Rendering

**Input**: Design documents from `/specs/010-optimize-rune-image-rendering/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY per constitution Comprehensive Testing principle - include them for all user stories.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize JavaScript ES2020 project with Next.js 14, React 18, Material-UI dependencies
- [ ] T003 [P] Configure linting and formatting tools

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T004 Setup database schema and migrations framework
- [ ] T005 [P] Implement authentication/authorization framework
- [ ] T006 [P] Setup API routing and middleware structure
- [ ] T007 Create base models/entities that all stories depend on
- [ ] T008 Configure error handling and logging infrastructure
- [ ] T009 Setup environment configuration management

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Display Rune Images Using Nexon URLs (Priority: P1) 🎯 MVP

**Goal**: Replace Next.js Image component with direct Nexon URLs in RuneCard component to eliminate backend processing

**Independent Test**: Verify RuneCard renders images directly from Nexon URLs without Next.js optimization, and images display correctly

### Tests for User Story 1 ⚠️

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US1] Unit test for RuneCard component rendering direct img tags in **tests**/components/CharacterCard.test.js
- [ ] T011 [P] [US1] Integration test for rune image loading in **tests**/pages/home-integration.test.js

### Implementation for User Story 1

- [x] T012 [US1] Replace Next.js Image with img tag in components/runes/RuneCard.js
- [x] T013 [US1] Remove Next.js Image import from components/runes/RuneCard.js
- [x] T014 [US1] Update image styling to match original layout in components/runes/RuneCard.js

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 3 - Audit and Optimize All Nexon Image Usages (Priority: P1)

**Goal**: Audit entire application for Nexon image usage and replace all Next.js Image components with direct URLs

**Independent Test**: Verify all components using Nexon images render directly without Next.js optimization, and no Next.js Image usage remains

### Tests for User Story 3 ⚠️

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T015 [P] [US3] Unit test for EquipmentDialog component rendering direct img tags in **tests**/components/EquipmentDialog.test.js
- [ ] T016 [P] [US3] Integration test for equipment image loading in **tests**/pages/home-integration.test.js

### Implementation for User Story 3

- [x] T017 [US3] Replace Next.js Image with img tag in components/EquipmentDialog.js
- [x] T018 [US3] Remove Next.js Image import from components/EquipmentDialog.js
- [x] T019 [US3] Update image styling to match original layout in components/EquipmentDialog.js
- [x] T020 [US3] Audit entire application for remaining Next.js Image usage with Nexon URLs
- [x] T021 [US3] Update any additional components found in audit

**Checkpoint**: At this point, User Stories 1 AND 3 should both work independently

---

## Phase 5: User Story 2 - Handle Invalid Nexon URLs (Priority: P2)

**Goal**: Implement fallback handling for invalid or failed Nexon image URLs across all components

**Independent Test**: Verify fallback images display when Nexon URLs are invalid, and no broken images appear

### Tests for User Story 2 ⚠️

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T022 [P] [US2] Unit test for error handling in RuneCard component in **tests**/components/CharacterCard.test.js
- [ ] T023 [P] [US2] Unit test for error handling in EquipmentDialog component in **tests**/components/EquipmentDialog.test.js

### Implementation for User Story 2

- [x] T024 [US2] Ensure fallback image handling in components/runes/RuneCard.js
- [x] T025 [US2] Ensure fallback image handling in components/EquipmentDialog.js
- [x] T026 [US2] Test fallback behavior with invalid URLs

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Validation & Testing

**Purpose**: Validate the complete implementation

- [x] T033 Run full test suite to ensure no regressions
- [x] T034 Run linting to verify code quality (expected warnings for img usage)
- [x] T035 Validate performance improvements (direct Nexon URLs, no backend processing)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T027 [P] Documentation updates in specs/010-optimize-rune-image-rendering/
- [x] T028 Code cleanup and refactoring
- [x] T029 Performance optimization across all stories
- [x] T030 [P] Additional unit tests in **tests**/
- [x] T031 Security hardening
- [x] T032 Run quickstart.md validation

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
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after US1 and US3 completion - Depends on image replacement being done first

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
Task: "Unit test for RuneCard component rendering direct img tags in __tests__/components/CharacterCard.test.js"
Task: "Integration test for rune image loading in __tests__/pages/home-integration.test.js"

# Launch implementation tasks sequentially:
Task: "Replace Next.js Image with img tag in components/runes/RuneCard.js"
Task: "Remove Next.js Image import from components/runes/RuneCard.js"
Task: "Update image styling to match original layout in components/runes/RuneCard.js"
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
3. Add User Story 3 → Test independently → Deploy/Demo
4. Add User Story 2 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 3
   - Developer C: User Story 2
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
