# Data Model: Character Query Logging

## Overview

The data model supports in-memory storage for fast deduplication and Google Sheets persistence for long-term storage and analysis.

## Entities

### OCID Record

**Purpose**: Represents a unique character OCID that has been queried, with metadata for tracking usage.

**Attributes**:

- `ocid` (string, required): The character's OCID, validated as alphanumeric string

**Validation Rules**:

- OCID must be non-empty string, 10-20 characters
- Must not already exist in Google Sheets

**Relationships**:

- None (standalone entity for logging)

## Storage Layers

### In-Memory Storage

**Structure**: Set<string> of OCIDs
**Purpose**: Simple deduplication - only store OCIDs not yet in Google Sheets
**Persistence**: Lost on server restart
**Operations**:

- Add: O(1) with Set.add()
- Check existence: O(1) with Set.has()
- Sync: Clear set after successful upload

### Google Sheets Storage

**Structure**: Single sheet with column:

- A: OCID

**Purpose**: Persistent storage of all logged OCIDs for leaderboard data
**Operations**:

- Check if OCID exists (for filtering)
- Append new OCIDs in batches

## Data Flow

1. API call with OCID → Middleware captures OCID
2. Check Google Sheets: If OCID exists, skip; if not, add to in-memory set
3. Periodic sync: Upload all OCIDs from set to Google Sheets
4. Clear in-memory set after successful sync
