# Research: 六轉進度 Display

**Feature**: 六轉進度 Display
**Date**: 2025-10-17
**Researcher**: AI Assistant

## Research Tasks

### Task 1: Nexon MapleStory Hexa Matrix API Integration

**Objective**: Understand API structure, authentication, rate limits, and error handling for Hexa Matrix data.

**Findings**:

- API Endpoint: GET https://open.api.nexon.com/maplestorytw/v1/character/hexamatrix?ocid={ocid}
- Authentication: Requires x-nxopen-api-key header
- Response Format: JSON with character_hexa_core_equipment array
- Rate Limits: Standard Nexon API limits apply
- Error Handling: Returns appropriate HTTP status codes

**Decision**: Use Axios for API calls with proper error handling and caching
**Rationale**: Consistent with existing project API integration patterns
**Alternatives Considered**: Fetch API (rejected due to less mature error handling)

### Task 2: Resource Consumption Calculation Logic

**Objective**: Design algorithm for calculating spent vs total Soul Elder/Fragments based on core levels.

**Findings**:

- Level costs provided in specification table
- Need to sum costs for each core type up to current level
- Total required = sum of all costs for level 30 across all core types
- Progress percentage = (spent / total_required) \* 100

**Decision**: Implement calculation utility function in lib/
**Rationale**: Reusable calculation logic, testable independently
**Alternatives Considered**: Client-side calculation in component (rejected for testability)

### Task 3: UI Progress Visualization Patterns

**Objective**: Find best practices for displaying multi-dimensional progress (levels + resources) with expandable details.

**Findings**:

- Progress bars for individual cores
- Summary cards showing total progress
- Color coding for different core types
- Tooltips for detailed cost breakdown
- MUI Accordion for progressive disclosure of detailed information

**Decision**: Use Material-UI Progress components with Accordion for expandable details
**Rationale**: Provides clean expandable UI without cluttering the default view, follows Material Design principles
**Alternatives Considered**:

- Always show all details (rejected for UI clutter)
- Custom expandable div (rejected for accessibility concerns)
- Tabs (rejected for not being progressive disclosure)
