'use client';

interface ChatHeaderProps {
  onClose: () => void;
  status: string;
}

function statusText(status: string) {
  if (status === 'transferred') return '真人客服已接手';
  if (status === 'closed') return '對話已結束';
  if (status === 'consultation') return '快速需求諮詢';
  return 'AI 客服在線';
}

export default function ChatHeader({ onClose, status }: ChatHeaderProps) {
  return (
    <div className="relative overflow-hidden border-b border-teal-800/50 bg-gradient-to-br from-slate-800 via-teal-900 to-emerald-900 px-4 py-3.5 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-white shadow-[0_4px_20px_rgba(0,0,0,0.15)] sm:rounded-t-3xl sm:px-5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal-400/20 blur-[40px]" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-emerald-500/20 blur-[40px]" />

      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md shadow-[0_0_15px_rgba(52,211,153,0.3)]">
            <span className="text-lg">💬</span>
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-extrabold tracking-wide drop-shadow-sm">一帆客服</h3>
            <p className="text-[11px] font-medium text-white/80">{statusText(status)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status !== 'closed' && (
            <span className="h-2.5 w-2.5 rounded-full border border-white/50 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
          )}
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 hover:bg-white/20 hover:backdrop-blur-md active:scale-95"
            aria-label="關閉客服視窗"
          >
            <svg className="h-4 w-4 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
