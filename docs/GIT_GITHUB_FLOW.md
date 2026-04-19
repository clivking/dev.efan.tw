# Git And GitHub Flow

## Goal

Define the standard Git and GitHub workflow for `dev.efan.tw` so repo wiring,
branch publication, PR creation, merge, and cleanup no longer depend on memory.

## Core Rules

- keep `main` as the long-term base branch
- push a feature or worktree branch before expecting PR creation to work
- do not delete a remote feature branch before the PR is merged
- do not copy GitHub quick-start commands like `git init` into an existing repo
- treat `gh` authentication, repo remote wiring, and remote default branch setup
  as separate checks

## Standard Flow

1. verify local branch and worktree state
2. verify `gh` is installed and authenticated
3. verify `origin` points to the intended GitHub repo
4. if the remote repo is empty, bootstrap `main`
5. commit the intended changes
6. push the working branch
7. create the PR against `main`
8. merge the PR
9. clean up merged branches

## Required Checks

Run these first:

```bash
git status --short -b
git branch -vv
git remote -v
gh auth status
```

If the remote repo exists, inspect it:

```bash
gh repo view --json nameWithOwner,defaultBranchRef,url
```

## Empty Repo Bootstrap

When the GitHub repo is new and empty:

```bash
git push -u origin master:main
gh repo edit <owner>/<repo> --default-branch main
```

Do not create a fake starter commit if the local repo already contains the real
project history.

## Feature Branch Publish

Commit and publish from the active work branch:

```bash
git add -A
git commit -m "<message>"
git push -u origin <branch-name>
```

## PR Flow

Create the PR after the feature branch is pushed:

```bash
gh pr create --base main --head <branch-name>
```

Before merge, verify:

```bash
gh pr view --json mergeStateStatus,mergeable,state,url
```

Merge with:

```bash
gh pr merge <number> --squash --delete-branch
```

## Post-Merge Cleanup

After the PR is merged:

```bash
git checkout main
git pull
git remote prune origin
git branch -d <branch-name>
```

## Common Failure Modes

- `gh auth status` fails:
  re-run `gh auth login -h github.com --web --git-protocol https`
- `git push` prompts for HTTPS credentials:
  run `gh auth setup-git`
- PR creation is disabled:
  confirm `origin` exists, `main` exists remotely, and the feature branch is pushed
