# Worktree Rules

## Goal

Define safe branch and cleanup rules for worktree-style development so temporary
branches can be published and removed without damaging active work.

## Core Rules

- use a disposable feature branch for active work, but only dispose of it after merge
- keep `main` as the local base after the PR is merged
- do not delete a branch that still contains unmerged commits
- do not treat local noise files as branch state
- keep branch cleanup separate from destructive file cleanup

## Worktree Lifecycle

1. start from a stable base branch
2. create or enter the work branch
3. implement and validate the intended changes
4. commit and push the work branch
5. open and merge the PR
6. return to `main`
7. delete merged branches

## Cleanup Rules

Delete a remote work branch only after:

- the PR is merged
- the remote default branch already contains the work

Delete a local work branch only after:

- local `main` is updated
- the branch is fully merged

## Local Noise Files

Examples:

- `.codex`
- `*.tsbuildinfo`

These files are not branch lifecycle markers. Remove them only when the user
wants a completely clean working tree.

## Safe End State

A fully cleaned repo should look like:

- current branch: `main`
- `main` tracking `origin/main`
- no stale remote refs
- no merged local work branches
- no user-requested local noise left behind
