# Learnings

## Task 1: Dirty-state baseline implementation

### Implementation details
- Added `lastPersistedSnapshot` variable to store serialized copy of last saved data
- Added `setCleanSnapshot(snapshot)` to update the snapshot (deep clone via JSON parse/stringify)
- Added `getCleanSnapshot()` to retrieve current snapshot
- Added `isDirty()` to compare `resumeData` vs `lastPersistedSnapshot` using JSON serialization
- Updated `saveDraft()` to call `setCleanSnapshot(resumeData)` after successful localStorage write
- Updated initialization to call `setCleanSnapshot(resumeData)` after loading draft or default data

### Key design decisions
- Snapshot comparison uses JSON.stringify for deterministic comparison of serializable data
- Deep clone via JSON.parse(JSON.stringify(...)) ensures nested objects are compared correctly
- Snapshot is updated ONLY in saveDraft, not on every edit - this provides the foundation for dirty tracking
- The isDirty() function is a read-only query that doesn't modify state

### Notes for subsequent tasks
- isDirty() and getCleanSnapshot() are now available for task 2/4/5 to use
- Currently saveDraft is called immediately after every edit, so dirty state resets quickly
- Task 2 (throttling) will likely defer saveDraft calls, creating a window where isDirty() returns true
- The baseline provides the comparison mechanism; behavior changes come in subsequent tasks

