# scripts/archive

This folder only keeps historical references and temporary scratch files.
It is not a source of truth for active maintenance scripts.

Rules:
- `legacy/` previously contained early acceptance and debug scripts with heavy encoding corruption, so those files were removed.
- `duplicates/` previously contained outdated duplicate copies of root-level scripts, so corrupted copies were removed.
- Rebuild needed scripts directly under `scripts/` using clean UTF-8 files.
- Temporary one-off files may live under `temp/`, but should be deleted once the task is complete.
