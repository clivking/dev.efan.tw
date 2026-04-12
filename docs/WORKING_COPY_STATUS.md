# Working Copy Status

## Current Role

`app-legacy-base` is the recovered working copy that currently powers `dev.efan.tw`.

It is:

- operational
- containerized
- production-like enough for ongoing work

It is not yet:

- the final cleanly rebuilt architecture
- a fully rationalized codebase
- a fully governed operations surface

## Why It Still Matters

This working copy is currently the safest place to preserve:

- website behavior
- admin behavior
- product, customer, and quote workflows
- AI chat
- Telegram notifications
- uploads-backed content

Replacing it too early would risk losing working business behavior.

## Current Structural Debt

1. runtime is stable, but the codebase still contains historical maintenance clutter
2. configuration truth is split between DB settings and env values
3. uploads are mounted and usable, but not yet fully governed
4. maintenance tooling still contains legacy seed/fix/debug overlap

## Exit Criteria

`app-legacy-base` can stop being a transitional working copy only when:

1. `dev`, `pre`, and `www` share the same deployment model
2. env/secrets/DB-settings boundaries are explicit and stable
3. uploads backup and integrity verification are repeatable
4. script surface is reduced to clear canonical tools
5. key business modules can be changed without relying on legacy machine knowledge

## Working Rule

Until those exit criteria are met:

- treat `app-legacy-base` as the live working baseline
- improve it conservatively
- replace structure gradually, not by blind rewrite
