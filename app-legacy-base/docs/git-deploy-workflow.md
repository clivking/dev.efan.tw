# Efan Git And Deploy Workflow

Use this as the short default workflow for normal efan work.
Keep the existing full-backup habit. This guide adds Git traceability on top of it.

## Core Principles

- Do not keep production-truth only in an uncommitted working tree.
- Do not let `master` stay dirty for long-running feature work.
- Before `PRE` or `WWW`, be able to name the branch, commit, and intended image tag.
- Keep temporary screenshots, debug exports, and one-off verification output out of Git.

## Normal Flow

1. Start from the confirmed repo at `D:\Coding\efan.tw\web`.
2. Create a task branch before meaningful edits.
3. Make changes and verify locally:
   - `npm run check:text-integrity` when user-facing copy changed
   - `npm run build`
   - `docker compose build app-dev`
   - `docker compose up -d --force-recreate app-dev`
   - verify container-local output and dev site output
4. Commit the source state that matches what you intend to deploy.
5. Use the upload flow to move `DEV -> PRE -> WWW`.
6. After deploy, record which branch and commit were shipped.

## Dirty Worktree Recovery

Use this only when the repo already has substantial uncommitted changes.

1. Keep the normal full backup first.
2. Determine whether the uncommitted state is already deployed to `PRE` or `WWW`.
3. If yes, create a `snapshot` branch and commit that exact state before cleanup.
4. Do not continue normal development on the `snapshot` branch.
5. If history needs cleanup, create a `cleanup` branch from the snapshot state.
6. Split, rename, or reorder commits only on the `cleanup` branch.

## Branch Roles

- `snapshot/*`: preserved source-of-truth for an already deployed or risky state
- `cleanup/*`: branch used to split or reorganize a preserved state
- `codex/*` or another task branch: normal implementation work

## Deploy Gate

Before `PRE` or `WWW`, confirm:

- current branch name
- current `HEAD` commit
- whether the working tree is clean
- whether local verification already passed
- intended target stage

If the target state is already live but not committed, stop and run Dirty Worktree Recovery first.

## Release Record

After `PRE` or `WWW`, make sure you can answer:

- Which branch was deployed?
- Which commit was deployed?
- Which image tag or promotion path was used?
- Which environment was validated?

If you cannot answer those four questions quickly, the release is not traceable enough yet.
