# Research: Character Query Logging

## Decision: Next.js Middleware for OCID Capture

**Rationale**: Next.js middleware can intercept all API calls and check for OCID parameters, allowing centralized logging without modifying individual route handlers. This ensures all API calls with OCIDs are captured consistently.

**Alternatives Considered**:

- Modify each API route individually: Rejected due to code duplication and maintenance overhead
- Client-side logging: Rejected due to security concerns and inability to capture all API calls

## Decision: In-Memory Storage with Set for Deduplication

**Rationale**: Using a JavaScript Set in memory provides O(1) lookup for deduplication, fast addition, and minimal memory footprint. Data is stored as OCID strings with timestamps.

**Alternatives Considered**:

- Array with manual deduplication: Slower lookup performance
- Database storage: Overkill for temporary in-memory storage before sync

## Decision: Simplified OCID Logging

**Rationale**: Only track OCIDs that haven't been synced to Google Sheets yet. No need for timestamps or query counts - just ensure each OCID appears exactly once in the sheet.

**Alternatives Considered**:

- Track query counts and timestamps: Rejected as unnecessary complexity for the current scope
- No deduplication: Would result in duplicate entries in Google Sheets

## Decision: Google Sheets API for Persistence

**Rationale**: As specified by user requirements, Google Sheets provides easy data persistence and manual review capabilities. The googleapis npm package provides robust integration.

**Alternatives Considered**:

- Local file storage: Not persistent across deployments
- Database: More complex setup for this use case

## Decision: Manual Sync API Endpoint

**Rationale**: Provides user control over when to sync data to Google Sheets, allowing batch operations and avoiding rate limits. Simple POST endpoint triggers the sync process.

**Alternatives Considered**:

- Automatic sync on every API call: Could hit rate limits and slow down responses
- Cron job: User prefers manual control

## Decision: Error Handling for Google Sheets Unavailability

**Rationale**: Log errors locally and continue operation, allowing data to accumulate for later sync. This ensures the feature doesn't break existing functionality.

**Alternatives Considered**:

- Fail API calls on sync errors: Would break user experience
- Retry immediately: Could cause cascading failures

## Decision: OCID Validation in Middleware

**Rationale**: Basic validation ensures only valid OCIDs are logged, preventing garbage data. Check for string format and length.

**Alternatives Considered**:

- No validation: Could lead to invalid data in sheets
- Strict validation: Might reject valid OCIDs
