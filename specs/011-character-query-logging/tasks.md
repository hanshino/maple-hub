# Tasks: Character Query Logging

**Input**: Design documents from `/specs/011-character-query-logging/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY per constitution Comprehensive Testing principle - include them for all user stories.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `app/`, `lib/`, `__tests__/`
- Paths follow Next.js 14 structure as specified in plan.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Install Google Sheets API dependencies in package.json
- [x] T002 Create lib directory structure per implementation plan
- [x] T003 Create **tests** directory structure per implementation plan

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 [P] Create GoogleSheetsClient class in lib/google-sheets.js
- [x] T005 [P] Create OcidLogger class in lib/ocid-logger.js
- [x] T006 Configure Google Sheets API credentials in environment variables

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Record Character Queries (Priority: P1) 🎯 MVP

**Goal**: Automatically capture OCIDs from API calls and prepare them for sync to Google Sheets

**Independent Test**: Make API calls with OCID parameters and verify OCIDs are logged locally, then sync to Google Sheets

### Tests for User Story 1 ⚠️

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [P] [US1] Unit test for OcidLogger in **tests**/ocidLogger.test.js
- [x] T008 [P] [US1] Unit test for GoogleSheetsClient in **tests**/googleSheets.test.js
- [x] T009 [P] [US1] Integration test for middleware OCID capture in **tests**/middleware.test.js
- [x] T010 [P] [US1] Contract test for sync API in **tests**/sync-api.test.js

### Implementation for User Story 1

- [x] T011 [US1] Implement Next.js middleware for OCID capture in app/middleware.js
- [x] T012 [US1] Implement sync API endpoint in app/api/sync-ocids/route.js
- [x] T013 [US1] Add OCID validation logic to middleware
- [x] T014 [US1] Integrate Google Sheets existence check in middleware

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect the implementation

- [x] T015 [P] Add error handling and logging throughout the system
- [x] T016 Update documentation in README.md with OCID logging feature
- [x] T017 Run linting and formatting on all new files
- [x] T018 Performance optimization for Google Sheets API calls
- [x] T019 Add environment variable validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS User Story 1
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **Polish (Phase 4)**: Depends on User Story 1 completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Foundational components before middleware
- Middleware before sync API
- Core implementation before polish

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- All tests for User Story 1 marked [P] can run in parallel
- Different components can be worked on in parallel after foundational is complete

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for OcidLogger in __tests__/ocidLogger.test.js"
Task: "Unit test for GoogleSheetsClient in __tests__/googleSheets.test.js"
Task: "Integration test for middleware OCID capture in __tests__/middleware.test.js"
Task: "Contract test for sync API in __tests__/sync-api.test.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks US1)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done: Developer implements User Story 1

---

## Notes

- [P] tasks = different files, no dependencies
- [US1] label maps task to User Story 1 for traceability
- User Story 1 should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts</content>
  <parameter name="filePath">e:\workspace\maplestory\specs\011-character-query-logging\tasks.md
