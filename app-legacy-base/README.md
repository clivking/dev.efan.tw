# Efan Working Copy

這份目錄是從舊站恢復後整理出的工作版，現在是我們慢慢清理與修改的主線。

## Runtime

- app directory: `app-legacy-base`
- app container: `efan-dev-web`
- db container: `efan-work-db`
- website: `https://dev.efan.tw`
- local website: `http://localhost:5000`
- database port: `5433`

## Canonical Start Method

從 repo 根目錄啟動：

```bash
docker compose -f compose.work-prod.yaml up -d --build
```

這份工作版目前只保留一組正式使用中的環境檔：

- `.env.compose-prod`

## Core Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run check:text-integrity`
- `npm run verify:content-qa`
- `npm run verify:guides-smoke`

## Notes

- `code-old` 仍保留在 `import-review/`，只做參考，不再直接修改
- `dev.efan.tw` 現在已指向這份 working copy
- `public/uploads` 保留為本機掛載資產，不進 Git
- 這份 working copy 目前是對外開發主線，會逐步繼續精簡
