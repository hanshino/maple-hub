# Implementation Plan: Dashboard Progress Home Enhancement

**Branch**: `004-dashboard-progress-home` | **Date**: 2025-10-18 | **Spec**: [link to spec.md](spec.md)
**Input**: Feature specification from `/specs/004-dashboard-progress-home/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add Alliance Battlefield information to character details and set dashboard-progress as the home page, removing other pages for simplicity.

## Technical Context

**Language/Version**: JavaScript ES2020  
**Primary Dependencies**: Next.js 14, React 18, Axios, Material-UI, Jest, Recharts  
**Storage**: Local storage for caching  
**Testing**: Jest  
**Target Platform**: Web browser  
**Project Type**: Web application  
**Performance Goals**: Load time < 3 seconds  
**Constraints**: Responsive design, accessibility standards  
**Scale/Scope**: Single page application with API integration

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] User-Centric Design: Feature adds Alliance Battlefield info to improve user experience
- [x] API Integration Excellence: Integrates with Nexon OpenAPI with error handling
- [x] Component Reusability: Uses existing React components and Material-UI
- [x] Comprehensive Testing: Includes Jest tests for components and API
- [x] Data Visualization: Displays character progress data clearly
- [x] Performance & Optimization: Optimizes for <3s load time
- [x] Simplicity & Maintainability: Follows ES2020 standards and clean code

## Project Structure

### Documentation (this feature)

```
specs/004-dashboard-progress-home/
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
├── page.js              # Home page (dashboard-progress)
├── dashboard-progress/
│   └── page.js          # Dashboard progress page
├── api/
│   ├── character/
│   │   └── search/
│   │       └── route.js
│   ├── characters/
│   │   ├── route.js
│   │   └── [id]/
│   │       └── route.js
│   └── union/           # New API for union data
│       └── [ocid]/
│           └── route.js
├── globals.css
├── layout.js
└── components/
    ├── CharacterCard.js
    ├── HexaMatrixProgress.js
    ├── ProgressBar.js
    ├── ProgressChart.js
    └── ...

lib/
├── apiUtils.js
├── hexaMatrixApi.js
├── localStorage.js
└── ...

__tests__/
├── components/
├── api/
└── ...
```

**Structure Decision**: Web application structure with Next.js App Router, adding new union API endpoint for Alliance Battlefield data.

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
