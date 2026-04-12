# Efan Working Copy

這份目錄是從舊站恢復後整理出的工作版，現在是我們慢慢清理與修改的主線。

## Runtime

- app directory: `app-legacy-base`
- app container: `efan-work-app`
- db container: `efan-work-db`
- website: `http://localhost:5100`
- database port: `5433`

## Canonical Start Method

從 repo 根目錄啟動：

```bash
docker compose -f compose.work-app.yaml up -d
```

這份工作版目前只保留一組正式使用中的環境檔：

- `.env.compose-work`

## Core Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run check:text-integrity`
- `npm run verify:content-qa`
- `npm run verify:guides-smoke`

## Notes

- `code-old` 仍保留在 `import-review/`，只做參考，不再直接修改
- `dev.efan.tw` 仍指向新專案 `5000`
- 這份 working copy 目前是舊站功能的整理基底，不是最終新架構
