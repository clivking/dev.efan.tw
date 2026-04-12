# Codex Content Brief Template

Use this template when asking Codex to create or revise efan.tw content pages directly in source.

Keep it short. Fill only the fields that matter for the task. Unknown items can be left blank.

## Copy/Paste Template

```md
Task:
- Create or revise a content page for efan.tw

Page type:
- guide | location | solution | service | product | category

Target route or slug:
- 

Primary keyword:
- 

Search intent:
- informational | commercial | transactional

Target area or product:
- 

Goal:
- rank | compare | convert | support existing page | improve AI overview extraction

Audience:
- 

Must include:
- 

Must avoid:
- 

Internal links to include:
- 

Related entities:
- services:
- locations:
- products:
- guides:

FAQ questions to answer:
- 

CTA goal:
- 

Source or factual notes:
- 

Done standard:
- refresh dev.efan.tw
- run content QA
- tell me which URL to review
```

## Short Examples

### Example: Location Page

```md
Task:
- Create or revise a content page for efan.tw

Page type:
- location

Target route or slug:
- /locations/xinyi-access-control

Primary keyword:
- 信義區門禁系統

Search intent:
- commercial

Target area or product:
- 台北市信義區辦公室門禁規劃

Goal:
- rank

Must include:
- local office context
- FAQ
- service CTA

Internal links to include:
- /services/access-control
- /contact

FAQ questions to answer:
- 信義區辦公室門禁規劃時要先看什麼？
- 老舊商辦能不能裝門禁？

CTA goal:
- contact inquiry
```

### Example: Guide Page

```md
Task:
- Create or revise a content page for efan.tw

Page type:
- guide

Target route or slug:
- /guides/access-control-tco-checklist

Primary keyword:
- 門禁系統 TCO

Search intent:
- informational

Goal:
- improve AI overview extraction

Must include:
- checklist format
- FAQ
- links back to service pages

Internal links to include:
- /services/access-control
- /guides/intercom-upgrade-comparison

FAQ questions to answer:
- 門禁系統 TCO 要看哪些成本？
- 採購前要先盤點什麼？

CTA goal:
- move reader to service inquiry
```

## Operating Notes

- Use this brief with [$efan-wsl-start](/home/dev/projects/efan.tw/web/.codex/skills/efan-wsl-start/SKILL.md) at the start of a new chat.
- Content authoring tasks should route into [$efan-codex-content](/home/dev/projects/efan.tw/web/.codex/skills/efan-codex-content/SKILL.md).
- After content changes are visible on `dev.efan.tw`, run [$efan-content-governance](/home/dev/projects/efan.tw/web/.codex/skills/efan-content-governance/SKILL.md) or `npm run verify:content-qa`.
