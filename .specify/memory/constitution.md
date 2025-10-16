<!-- Sync Impact Report
Version change: 0.0.0 → 1.0.0
List of modified principles: (none, all new)
Added sections: Core Principles, Additional Constraints, Development Workflow, Governance
Removed sections: none
Templates requiring updates: ✅ updated - .specify/templates/plan-template.md (Constitution Check section), .specify/templates/tasks-template.md (tests mandatory)
Follow-up TODOs: RATIFICATION_DATE
-->
# MapleStory Constitution

## Core Principles

### I. Library-First
Every feature starts as a standalone library; Libraries must be self-contained, independently testable, documented; Clear purpose required - no organizational-only libraries

### II. CLI Interface
Every library exposes functionality via CLI; Text in/out protocol: stdin/args → stdout, errors → stderr; Support JSON + human-readable formats

### III. Test-First (NON-NEGOTIABLE)
TDD mandatory: Tests written → User approved → Tests fail → Then implement; Red-Green-Refactor cycle strictly enforced

### IV. Integration Testing
Focus areas requiring integration tests: New library contract tests, Contract changes, Inter-service communication, Shared schemas

### V. Observability, VI. Versioning & Breaking Changes, VII. Simplicity
Text I/O ensures debuggability; Structured logging required; Or: MAJOR.MINOR.BUILD format; Or: Start simple, YAGNI principles

## Additional Constraints
Technology stack requirements, compliance standards, deployment policies, etc.

## Development Workflow
Code review requirements, testing gates, deployment approval process, etc.

## Governance
Constitution supersedes all other practices; Amendments require documentation, approval, migration plan

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): Original adoption date unknown | **Last Amended**: 2025-10-16
