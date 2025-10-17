# Feature Specification: Add Search History

**Feature Branch**: `005-add-search-history`  
**Created**: 2025-10-18  
**Status**: Draft  
**Input**: User description: "我希望使用者在輸入角色名稱之後，可以在 localstorage 紀錄查詢紀錄，因為我們的原理會是從 nexon openapi 取得角色識別碼，如果我們可以在查到識別碼之後，儲存至 localstorage 這樣之後的 api 就可以不用再查詢一次識別碼，同樣的使用者可以在前端畫面看到自己的查詢紀錄，快速選到已經查過的角色"

## Clarifications

### Session 2025-10-18

- Q: How should the search history be displayed in the UI? → A: Use MUI Autocomplete component
- Q: How to ensure OCID is available for API queries to avoid extra calls? → A: Store OCID in localStorage and use cached OCID for subsequent searches

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Search Character and Save History (Priority: P1)

User enters a character name in the search field, initiates search, system retrieves the character identifier (OCID) from Nexon OpenAPI, stores the character name and OCID in localStorage for future use, and displays the updated search history using MUI Autocomplete component.

**Why this priority**: This is the core functionality that enables caching of search results, improving performance for repeat searches and providing quick access to previously searched characters.

**Independent Test**: Can be fully tested by entering a character name, performing search, verifying OCID is stored in localStorage, and confirming the history is displayed in the Autocomplete dropdown.

**Acceptance Scenarios**:

1. **Given** user enters a valid character name, **When** search is performed and OCID is successfully retrieved, **Then** character name and OCID are stored in localStorage.
2. **Given** search history exists in localStorage, **When** user accesses the search interface, **Then** search history is displayed in the Autocomplete dropdown.

---

### User Story 2 - Quick Select from History (Priority: P2)

User views the search history in the Autocomplete dropdown, selects a previously searched character, system uses the cached OCID to perform the search without needing to query the API again.

**Why this priority**: Provides the user experience benefit of quick access to frequently searched characters, building on the storage functionality.

**Independent Test**: Can be tested by having existing history, selecting a character from Autocomplete, and verifying search completes using cached OCID without API call.

**Acceptance Scenarios**:

1. **Given** search history contains characters, **When** user selects a character from Autocomplete, **Then** search is performed using cached OCID.
2. **Given** selected character from history, **When** search completes, **Then** character details are displayed without additional API calls for OCID.

---

### Edge Cases

- What happens when character name is invalid or not found: System should not store invalid searches and display appropriate error message
- How does system handle localStorage being disabled or full: Gracefully degrade by not storing history and still allowing searches
- What happens with duplicate character searches: Update the timestamp and move to most recent position in history

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST store character name and OCID in localStorage after successful search from Nexon OpenAPI
- **FR-002**: System MUST display search history using MUI Autocomplete component in the UI
- **FR-003**: System MUST allow users to select characters from search history Autocomplete to perform quick searches using cached OCID
- **FR-004**: System MUST limit search history to the last 10 unique characters (most recent first)
- **FR-005**: System MUST handle localStorage unavailability gracefully without breaking search functionality

### Key Entities _(include if feature involves data)_

- **SearchHistory**: Represents a cached search entry with characterName (string), ocid (string), timestamp (date/time of last search)

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can complete repeat character searches in under 5 seconds using cached OCID
- **SC-002**: 90% of users successfully find and select their previously searched characters from Autocomplete within 10 seconds
- **SC-003**: System maintains search functionality even when localStorage is unavailable
- **SC-004**: No more than 10 search history entries are stored per user session
