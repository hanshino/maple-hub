# Implementation Plan: 六轉進度

**Branch**: `002-hexa-matrix-progress` | **Date**: 2025-10-17 | **Spec**: specs/002-hexa-matrix-progress/spec.md
**Input**: Feature specification from `/specs/002-hexa-matrix-progress/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Create a 六轉進度 display feature for the MapleStory dashboard, showing total progress for level 6+ characters with expandable detailed core progress using MUI components, integrated into the existing dashboard-progress page.

## Technical Context

**Language/Version**: JavaScript ES2020, Next.js 14  
**Primary Dependencies**: Next.js, React, Axios for API integration  
**Storage**: Browser local storage for caching  
**Testing**: Jest with React Testing Library  
**Target Platform**: Modern web browsers  
**Project Type**: Full-stack web application with Next.js  
**Performance Goals**: Dashboard loads character info within 3 seconds  
**Constraints**: Minimal backend services, primarily API proxy to official OpenAPI  
**Scale/Scope**: Single user with support for multiple characters, low data volume

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] Library-First: Confirm feature starts as standalone library with clear purpose
- [ ] CLI Interface: Ensure library exposes functionality via CLI with text I/O
- [x] Test-First: Verify TDD approach will be strictly enforced
- [x] Integration Testing: Plan for integration tests on contracts and inter-service communication
- [x] Observability: Include structured logging and debuggability measures
- [x] Versioning: Follow MAJOR.MINOR.BUILD format for breaking changes
- [x] Simplicity: Start simple, apply YAGNI principles

## Project Structure

### Documentation (this feature)

```
specs/002-hexa-matrix-progress/
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
├── layout.js
├── page.js
├── dashboard-progress/
│   └── page.js
├── api/
│   └── hexa-matrix/
│       └── route.js
└── components/
    ├── HexaMatrixProgress.js
    ├── HexaMatrixCoreCard.js
    └── ...

lib/
├── hexaMatrixApi.js
├── hexaMatrixUtils.js
└── hexaMatrixData.js

__tests__/
├── lib/
│   ├── hexaMatrixApi.test.js
│   └── hexaMatrixUtils.test.js
└── components/
    ├── HexaMatrixProgress.test.js
    └── HexaMatrixCoreCard.test.js
```

**Structure Decision**: Next.js 14 app router structure with API routes for backend integration, components for UI, and standard testing setup. API routes will proxy calls to the official OpenAPI with minimal processing.

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
