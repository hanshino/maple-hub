# Data Model: Add API Call Delay

**Feature**: Add API Call Delay  
**Date**: 2025-10-18

## Entities

### API Call

Represents an outgoing HTTP request to external APIs with throttling applied in development environment.

**Fields**:

- `url` (string): The target API endpoint URL
- `method` (string): HTTP method (GET, POST, PUT, DELETE, etc.)
- `headers` (object): Request headers including authorization
- `body` (object/string): Request payload if applicable
- `timestamp` (Date): When the request was initiated
- `environment` (string): Detected environment ('development' or 'production')
- `delayApplied` (boolean): Whether throttling delay was applied
- `delayDuration` (number): Duration of delay in milliseconds (0 in production)

**Validation Rules**:

- If environment === 'development', delayDuration >= 200
- If environment === 'production', delayDuration === 0
- URL must be valid HTTP/HTTPS
- Method must be valid HTTP method

**Relationships**:

- None (standalone entity for request tracking)

**State Transitions**:

- Initiated → Delay Applied (if development) → Sent
- Initiated → Cancelled (if request aborted during delay)

**Business Rules**:

- Delay ensures compliance with API rate limits (5 req/s development, 500 req/s production)
- Delay is cancellable to prevent unnecessary waiting on aborted requests
