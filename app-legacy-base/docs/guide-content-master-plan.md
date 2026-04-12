# Guide Content Master Plan

目的：把 `guides` 從搬遷後的殘缺狀態，重建成可長期擴充的 SEO、AI Overview、轉換內容系統。

適用範圍：

- 包含：`guides` 主題樞紐、單篇指南、FAQ、內容治理、內連規則、QA 規則
- 不包含：桃園版、新北版 GEO 擴張
- 保留：台北相關案例與台北既有 location 頁之間的互連

## 北極星目標

1. 每個主題都有可持續擴充的內容樞紐，不再靠零散文章支撐。
2. 每篇指南都能同時服務 SEO、AI 摘要引用與商業導流。
3. `guides` 與 `services`、`products`、`locations` 建立明確內連路徑。
4. 搬遷後的亂碼、內容簡略、內容遺失不再重演。

## 主題範圍

| 主題 key | 主題名稱 | 角色 | 近期狀態 |
| --- | --- | --- | --- |
| `access-control` | 門禁系統 | 最大主題，負責採購、升級、TCO、權限管理、施工導入 | 優先重建 |
| `intercom` | 對講與門口機 | 舊系統升級、IP 化、訪客流程、門禁整合 | 優先重建 |
| `phone-system` | 電話總機 | 雲端 vs 地端、SIP、分機架構、多據點通訊 | 優先重建 |
| `security` | 監視與安防 | 錄影、AI 分析、儲存、跨點管理與維運 | 缺口最大 |
| `compliance` | 合規與案例 | NDAA、資安、採購風險、案例與導入信任 | 缺口大 |

## 內容架構

每個主題以四層內容運作：

1. `pillar`
說明：
完整指南，吃主題詞、建立權威、當主題頁的核心入口。

2. `decision`
說明：
比較文、TCO、選型文、升級判斷文，承接研究期搜尋。

3. `scenario`
說明：
辦公室、多據點、舊大樓、台北案例等情境內容，承接真實決策問題。

4. `trust`
說明：
FAQ、合規、案例、踩雷整理，強化 AI 引用與成交前信任。

## 每主題最低內容配置

### 門禁系統

- 1 篇 pillar
- 4 篇 decision
- 3 篇 scenario
- 2 篇 trust

### 對講與門口機

- 1 篇 pillar
- 3 篇 decision
- 2 篇 scenario
- 2 篇 trust

### 電話總機

- 1 篇 pillar
- 4 篇 decision
- 2 篇 scenario
- 2 篇 trust

### 監視與安防

- 1 篇 pillar
- 4 篇 decision
- 2 篇 scenario
- 2 篇 trust

### 合規與案例

- 1 篇 pillar
- 4 篇 decision/trust
- 3 篇案例或採購風險文

## 文章模板標準

所有新建或重寫指南都必須包含：

1. 開頭直接回答問題
2. 適用對象
3. 快速結論或決策摘要
4. 比較表或判斷表
5. 關鍵決策因素
6. 常見錯誤與風險
7. 導入流程或規劃步驟
8. FAQ
9. 相關服務
10. 相關產品
11. 延伸閱讀
12. 明確 CTA

## SEO 與 AI Overview 寫作原則

- 每篇只鎖定 1 個主關鍵字，搭配 5 到 10 個次關鍵字。
- 標題與首屏段落要可直接被摘取引用。
- 每段前兩到四句要能獨立成立，不依賴上下文。
- FAQ 要與正文一致，不能只為了 schema 塞問答。
- 避免空泛形容詞，優先寫成本、風險、維護、擴充、施工限制。

## 內連規則

### guide -> guide

- pillar 必連同主題的 decision 與 scenario 文
- 衛星文必回連 pillar
- trust 文至少連 2 篇主題內文章

### guide -> service

- 每篇 guide 至少連 1 個主要 service
- 與門禁、對講、總機、監視主題直接對應的文，至少連 2 個 service

### guide -> product

- 比較文、選型文、升級文要連對應產品或分類頁
- 若產品尚未適合直接導流，可先連分類頁

### guide -> location

- 本輪僅保留台北案例互連
- 不新增新北版、桃園版 GEO guide

## 內容治理原則

現有 guide 依三類管理：

### A 類：可救

- 主題正確
- 只需修亂碼、補內容、補 FAQ、補 metadata

### B 類：需重寫

- 主題值得保留
- 內容過短或邏輯破碎
- 保留 slug，正文重做

### C 類：redirect 保留

- 舊文已由新 guide 完整覆蓋
- 不再維護正文
- 保留 301 與歷史關聯

## 現有 guide 總表

| slug | 主題 | 目前狀態 | 建議級別 | 執行策略 |
| --- | --- | --- | --- | --- |
| `2026-access-control-tco-analysis` | 門禁系統 | 已發布，但內容疑似亂碼且過短 | B | 保留 slug，重寫成核心 decision 文 |
| `office-access-control-upgrade-guide` | 門禁系統 | 已發布，但內容疑似亂碼且過短 | B | 保留 slug，重寫成核心 scenario 文 |
| `intercom-upgrade-comparison` | 對講機 | 已發布，但內容疑似亂碼且過短 | B | 保留 slug，重寫成核心 decision 文 |
| `cloud-vs-onprem-pbx` | 電話總機 | 已發布，但內容疑似亂碼且過短 | B | 保留 slug，重寫成核心 decision 文 |
| `2026-enterprise-access-control-guide` | 門禁系統 | 草稿 | A/B 之間 | 補成 pillar |
| `security-nda-compliance-guide` | 資通合規 | 草稿 | A/B 之間 | 補成 compliance pillar |
| `telecom-architecture-pbx-evaluation` | 電話總機 | 草稿 | A/B 之間 | 補成 pillar 或架構文 |
| `taipei-access-control-installation-case` | 門禁系統 | 草稿 | A | 補成台北案例文 |
| `legacy-access-control-tco-guide` | 門禁系統 | 舊 blog 對照 | C | 保留 redirect，內容不維護 |
| `legacy-office-access-control-guide` | 門禁系統 | 舊 blog 對照 | C | 保留 redirect，內容不維護 |
| `legacy-intercom-upgrade-guide` | 對講機 | 舊 blog 對照 | C | 保留 redirect，內容不維護 |
| `legacy-pbx-vs-cloud-telephony` | 電話總機 | 舊 blog 對照 | C | 保留 redirect，內容不維護 |

## 三階段執行

### 第一階段：基礎盤重建

目標：

- 盤清現有 slug 與內容狀態
- 先建立 12 篇核心內容的執行順序
- 補齊治理標準與 QA 缺口

交付：

- guide 總表
- 12 篇內容 brief
- guides QA 納管清單

### 第二階段：主題樞紐成型

目標：

- 完成 5 個主題的 pillar 與核心衛星文
- 讓 `guides` 真正具備主題權威基礎

交付：

- 至少 12 篇可上線核心文章
- 主題內連成網
- 列表頁與主題頁 schema 補強

### 第三階段：信任與案例擴張

目標：

- 補案例、FAQ、合規與風險內容
- 讓 AI 引用性與商業信任同步增強

交付：

- trust cluster
- 台北案例互連
- 舊內容持續刷新節奏

## QA 與技術治理

目前 `scripts/content-qa.ps1` 尚未納入 guides。執行內容重建時要同步完成：

1. 將 `/guides` 加入內容 QA
2. 至少納入 1 個 topic 頁
3. 至少納入 2 個 representative guide 頁
4. 將 `scripts/verify-guides-smoke.ts` 接到標準驗證流程
5. 補 `guides` 列表頁與 topic 頁 schema 檢查

## 執行限制

- 先不擴張新北版、桃園版
- 可保留並強化台北案例
- 先做內容品質與主題樞紐，暫不追求大量發文
