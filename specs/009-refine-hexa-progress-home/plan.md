# Implementation Plan: Refine Hexa Progress Data and Home Display

**Branch**: `009-refine-hexa-progress-home` | **Date**: 2025-10-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-refine-hexa-progress-home/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Refine hexa progress data by filtering out irrelevant skill information and integrate hexa attribute information (character_hexa_stat_core) from the MapleStory API. Display refined data on the home page in a clear table format. Technical approach involves updating data processing utilities, API integration, and UI components while maintaining existing architecture.

## Technical Context

**Language/Version**: JavaScript ES2020, Node.js 18+  
**Primary Dependencies**: Next.js 14, React 18, Material-UI, Axios, Recharts  
**Storage**: Client-side caching (localStorage), no persistent database  
**Testing**: Jest, React Testing Library  
**Target Platform**: Web browsers (responsive design)
**Project Type**: Web application (Next.js frontend + API routes)  
**Performance Goals**: Page load <2s, API response handling <500ms  
**Constraints**: Client-side only, API key security for production, responsive design required  
**Scale/Scope**: Single-user focused, ~10 components to modify, integration with MapleStory API

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Initial Check (Pre-Phase 0)

- [x] User-Centric Design: Feature prioritizes clear data display with table format for hexa attributes
- [x] API Integration Excellence: Integrates new MapleStory API endpoint with existing error handling
- [x] Component Reusability: Will reuse existing HexaMatrixProgress component and Material-UI tables
- [x] Comprehensive Testing: Will include unit tests for filtering logic and UI integration tests
- [x] Data Visualization: Displays hexa attributes in clear table format with stat levels
- [x] Performance & Optimization: Uses existing caching, filters data client-side efficiently
- [x] Simplicity & Maintainability: Extends existing utilities without major architectural changes

### Post-Phase 1 Check (After Design & Contracts)

- [x] User-Centric Design: Data model confirms clear entity relationships and table display pattern
- [x] API Integration Excellence: API contract defines proper error handling and caching strategy
- [x] Component Reusability: Design reuses HexaMatrixProgress component with modular stat table subcomponent
- [x] Comprehensive Testing: Quickstart includes unit, integration, and component test patterns
- [x] Data Visualization: HexaStatCore entity structured for clear tabular presentation
- [x] Performance & Optimization: Parallel API calls and memoization strategies documented
- [x] Simplicity & Maintainability: Filtering logic is simple (O(n)), no complex abstractions added

**Result**: ✅ All constitution principles satisfied after design phase. No violations to track.

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
app/
├── api/
│   └── hexa-matrix/      # Existing API route to extend
├── page.js               # Home page to update with new display
└── globals.css

components/
├── HexaMatrixProgress.js # Component to update with filtering and new display
└── [new: HexaStatTable.js or similar for attribute display]

lib/
├── hexaMatrixUtils.js    # Utility to add filtering logic
├── hexaMatrixApi.js      # API client to add new endpoint call
└── progressUtils.js      # Update progress calculation logic

__tests__/
├── components/
│   └── HexaMatrixProgress.test.js  # Update tests
└── lib/
    └── hexaMatrixUtils.test.js     # Add filtering tests
```

**Structure Decision**: This is a web application using Next.js with API routes. The feature extends existing hexa matrix functionality in the app/ and components/ directories, with utility functions in lib/ and corresponding tests in \_\_tests/. No new major directories needed - all changes integrate into existing structure.

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

No violations - all constitution principles are satisfied.

## Phase Completion Summary

### ✅ Phase 0: Outline & Research (Complete)

**Artifacts Generated**:

- [research.md](./research.md) - Technical decisions and rationale

**Key Decisions**:

1. Filtering logic uses hexa_core_type count validation
2. API integration via /hexamatrix-stat endpoint
3. Progress calculation handles unactivated, fully maxed, and defers partial activations
4. UI uses Material-UI table below existing progress section

### ✅ Phase 1: Design & Contracts (Complete)

**Artifacts Generated**:

- [data-model.md](./data-model.md) - Entity definitions and relationships
- [contracts/hexa-matrix-stat-api.md](./contracts/hexa-matrix-stat-api.md) - API specification
- [quickstart.md](./quickstart.md) - Developer implementation guide
- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) - Updated agent context

**Key Deliverables**:

1. Extended HexaCore, HexaProgress entities
2. Defined new HexaStatCore entity with validation rules
3. API contract with request/response schemas
4. Implementation patterns for filtering, fetching, calculating, displaying
5. Test strategy with unit, integration, and component test examples

### 🔄 Phase 2: Task Breakdown (Next Step)

**Command**: `/speckit.tasks`

**Expected Output**:

- [tasks.md](./tasks.md) - Prioritized implementation tasks

**Scope**:

- Break down implementation into atomic, testable tasks
- Sequence tasks by dependency and priority
- Estimate effort per task
- Assign to implementation workflow

---

**Status**: Planning complete. Ready for task breakdown via `/speckit.tasks`.
