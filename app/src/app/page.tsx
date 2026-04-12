export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,rgba(190,242,100,0.35),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] text-slate-950">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-between gap-12 px-6 py-12 sm:px-10 lg:px-12 lg:py-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-lime-700">
              dev.efan.tw
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              一帆安全整合重建基線
            </h1>
          </div>
          <div className="rounded-full border border-slate-300/80 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur">
            Next.js + TypeScript + pnpm + PostgreSQL
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="max-w-2xl text-lg leading-8 text-slate-700">
              這裡是新的開發起點。我們會先把環境、部署流程與資料流整理乾淨，再分批把舊內容審核導入，避免把舊問題一起搬回來。
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <article className="rounded-3xl bg-slate-950 p-5 text-slate-50">
                <p className="text-sm uppercase tracking-[0.2em] text-lime-300">
                  Code Flow
                </p>
                <p className="mt-4 text-lg font-medium">dev -&gt; pre -&gt; www</p>
              </article>
              <article className="rounded-3xl bg-slate-900/90 p-5 text-slate-50">
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
                  Data Flow
                </p>
                <p className="mt-4 text-lg font-medium">www -&gt; pre / dev</p>
              </article>
              <article className="rounded-3xl bg-slate-100 p-5 text-slate-900">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                  Rule
                </p>
                <p className="mt-4 text-lg font-medium">
                  正式資料庫不回寫自開發環境
                </p>
              </article>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-slate-50 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <p className="text-sm uppercase tracking-[0.2em] text-lime-300">
              第一階段
            </p>
            <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
              <li>建立乾淨的本機開發骨架</li>
              <li>補齊 Docker 與環境變數範本</li>
              <li>建立匯入審核區隔離舊備份</li>
              <li>之後再逐批導入舊內容與商業邏輯</li>
            </ul>
          </aside>
        </div>
      </section>
    </main>
  );
}
