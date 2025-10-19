# Implementation Tasks: Refine Hexa Progress Data and Home Display

**Feature**: 009-refine-hexa-progress-home  
**Date**: 2025-10-19  
**Branch**: `009-refine-hexa-progress-home`  
**Spec**: [spec.md](./spec.md)  
**Plan**: [plan.md](./plan.md)

## Overview

This document breaks down the implementation of refining hexa progress data and integrating hexa attribute information into prioritized, atomic tasks organized by user story.

**Total Tasks**: 18  
**User Stories**: 3 (P1, P2, P3)  
**MVP Scope**: User Story 1 (P1) - Refined hexa progress data filtering  
**Parallel Opportunities**: 8 tasks marked [P] for concurrent execution  
**Independent Test Criteria**: Each user story can be tested independently

## Dependencies & Execution Order

```
User Story 1 (P1) → User Story 2 (P2) → User Story 3 (P3)
├── Foundational tasks must complete before any user story
├── Within each story: Tests → Models/Services → UI → Integration
└── Polish phase after all user stories complete
```

## Implementation Strategy

**MVP First**: Complete User Story 1 (P1) for basic functionality, then add User Story 2 (P2) for enhanced features, finally User Story 3 (P3) for layout polish.

**Incremental Delivery**: Each user story represents a complete, independently testable increment.

**Parallel Execution**: Tasks marked [P] can run concurrently within their phase (different files, no blocking dependencies).

---

## Phase 1: Setup

**Goal**: Ensure development environment is ready for implementation.

- [ ] T001 Verify feature branch checkout and dependencies installed in package.json

---

## Phase 2: Foundational Tasks

**Goal**: Implement shared utilities and API integration required by all user stories.  
**Blocking**: Must complete before any user story implementation.  
**Independent Test**: N/A (foundational infrastructure)

- [x] T002 [P] Add hexa core filtering function to lib/hexaMatrixUtils.js
- [x] T003 [P] Add hexa stat core API client to lib/hexaMatrixApi.js
- [x] T004 [P] Extend progress calculation utilities in lib/progressUtils.js
- [x] T005 [P] Update cache utilities for hexa stat core data in lib/cache.js

---

## Phase 3: User Story 1 (P1) - View Refined Hexa Progress Data

**Story Goal**: Filter hexa skill cores to show only relevant data for the character's current class.  
**Priority**: P1 (Core data integrity)  
**Independent Test**: Can be tested by verifying filtered hexa cores display only current class skills with accurate progress calculations.

- [x] T006 [P] Add unit tests for hexa core filtering logic in **tests**/lib/hexaMatrixUtils.test.js
- [x] T007 Integrate filtering into existing hexa matrix data processing in lib/hexaMatrixUtils.js
- [x] T008 [P] [US1] Add integration tests for filtered data flow in **tests**/integration/hexa-filtering.test.js
- [x] T009 [US1] Update HexaMatrixProgress component to use filtered data in components/HexaMatrixProgress.js
- [x] T010 [P] [US1] Add component tests for filtered progress display in **tests**/components/HexaMatrixProgress.test.js

---

## Phase 4: User Story 2 (P2) - Include Hexa Attribute Information

**Story Goal**: Fetch and display hexa attribute information with progress calculations.  
**Priority**: P2 (Enhanced functionality)  
**Independent Test**: Can be tested by verifying hexa stat cores are fetched, calculated, and displayed with material usage estimates.

- [ ] T011 [P] [US2] Add unit tests for stat core progress calculation in **tests**/lib/progressUtils.test.js
- [ ] T012 [US2] Implement stat core data fetching in app/api/hexa-matrix-stat/route.js
- [ ] T013 [P] [US2] Add integration tests for stat core API and calculation in **tests**/integration/hexa-stat-integration.test.js
- [ ] T014 [US2] Create HexaStatTable component for attribute display in components/HexaStatTable.js
- [ ] T015 [P] [US2] Add component tests for stat table rendering in **tests**/components/HexaStatTable.test.js
- [ ] T016 [US2] Integrate stat table into HexaMatrixProgress component in components/HexaMatrixProgress.js

---

## Phase 5: User Story 3 (P3) - Adjust Home Page Layout

**Story Goal**: Adjust home page layout to clearly present refined hexa data and new attributes.  
**Priority**: P3 (UI polish)  
**Independent Test**: Can be tested by verifying responsive layout accommodates all hexa information without visual issues.

- [ ] T017 [US3] Update home page layout for hexa information display in app/page.js
- [ ] T018 [P] [US3] Add visual regression tests for layout changes in **tests**/pages/home-layout.test.js

---

## Phase 6: Polish & Cross-Cutting Concerns

**Goal**: Final quality assurance, performance optimization, and cross-cutting improvements.  
**Independent Test**: N/A (polish across all stories)

- [ ] T019 Run full test suite and verify all user stories pass independent tests
- [ ] T020 Performance audit: Verify page load <2s and API response <500ms
- [ ] T021 Accessibility audit: Ensure Material-UI components meet WCAG standards
- [ ] T022 Code review: Clean up any TODO comments and ensure ES2020 compliance
- [ ] T023 Documentation update: Verify README.md reflects new hexa features

---

## Parallel Execution Examples

**Within User Story 1**:

- T006 (unit tests) and T008 (integration tests) can run in parallel
- T010 (component tests) depends on T009 completion

**Within User Story 2**:

- T011 (unit tests) and T013 (integration tests) can run in parallel
- T015 (component tests) depends on T014 completion

**Across Stories**:

- US1 and US2 can have parallel development after foundational tasks
- US3 depends on US1 and US2 completion

## Task Completion Validation

**Format Check**: ✅ All tasks follow required checklist format (`- [ ] T### [P?] [US?] Description with file path`)

**Coverage Check**:

- ✅ Setup: Environment readiness
- ✅ Foundational: Shared utilities (4 tasks)
- ✅ US1 (P1): Filtering logic (5 tasks)
- ✅ US2 (P2): Stat core integration (6 tasks)
- ✅ US3 (P3): Layout adjustment (2 tasks)
- ✅ Polish: Quality assurance (5 tasks)

**Dependency Check**: ✅ Tasks ordered by logical dependencies and user story priorities

**Test Coverage**: ✅ Unit, integration, and component tests included per constitution requirements

---

**Ready to Execute**: Start with Phase 1, then Phase 2, then proceed through user stories in priority order. Each phase builds on the previous for incremental delivery.
