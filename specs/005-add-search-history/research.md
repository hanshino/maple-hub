# Research: Add Search History

## Decision: localStorage for Client-Side Caching

**Rationale**: localStorage provides simple key-value storage in the browser, persisting across sessions. It's suitable for caching search history without server-side dependencies. We'll implement checks for availability and graceful degradation.

**Alternatives Considered**:

- SessionStorage: Loses data on tab close, less useful for history
- IndexedDB: Overkill for simple string arrays, more complex API
- Cookies: Limited size, not ideal for structured data

## Decision: MUI Autocomplete for History Display

**Rationale**: MUI Autocomplete provides rich UX with dropdown suggestions, free text input, and accessibility features. It integrates well with Material-UI theme and supports both typing and selecting from history.

**Alternatives Considered**:

- HTML datalist: Basic functionality, poor styling control
- Custom dropdown: More development effort, potential accessibility issues
- React Select: Additional dependency when MUI is already used

## Decision: History Limit of 10 Items

**Rationale**: Balances user needs with storage constraints. Most users won't need more than 10 recent searches, and it prevents localStorage bloat.

**Alternatives Considered**:

- Unlimited: Could lead to performance issues and storage limits
- 5 items: Too restrictive for power users
- User-configurable: Adds complexity without clear benefit

## Decision: OCID Caching Strategy

**Rationale**: Store OCID with character name to enable direct API calls without re-querying character search endpoint. Use timestamp for recency ordering.

**Alternatives Considered**:

- Cache only names, re-query OCID: Defeats performance goal
- Cache full character data: Unnecessary, increases storage usage
- Server-side caching: Not applicable for client-side feature
