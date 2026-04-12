'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ChatBubble from '@/components/chat/ChatBubble';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'admin';
  content: string;
  senderName?: string;
  createdAt: string;
}

interface Session {
  id: string;
  source: string;
  status: string;
  visitorName: string | null;
  customerName: string;
  transferredTo: string | null;
  lastMessage: { content: string; role: string; createdAt: string } | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface SessionDetail {
  session: any;
  customer: any;
  quote: any;
  messages: Message[];
  aggregatedInfo: any;
}

type SessionFilter = 'all' | 'active' | 'transferred' | 'closed';

const POLL_INTERVAL_MS = 3000;

function statusLabel(status: string) {
  switch (status) {
    case 'active':
      return { text: 'AI 處理中', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'transferred':
      return { text: '真人接手', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'closed':
      return { text: '已結案', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    default:
      return { text: status, color: 'bg-slate-100 text-slate-600 border-slate-200' };
  }
}

function sourceLabel(source: string) {
  switch (source) {
    case 'web_quote':
      return '互動報價';
    case 'consultation':
      return '官網諮詢';
    case 'transfer_request':
      return '轉真人';
    default:
      return '官網客服';
  }
}

function sessionDisplayName(session: SessionDetail['session'], customer: SessionDetail['customer']) {
  return session?.visitorName || customer?.contacts?.[0]?.name || customer?.companyNames?.[0]?.companyName || '匿名訪客';
}

function formatSessionTime(value: string) {
  return new Date(value).toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminChatPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [adminInput, setAdminInput] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<SessionFilter>('all');
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [cleaningDays, setCleaningDays] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/sessions');
      if (!res.ok) return;
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Fetch sessions error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/chat/sessions/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setDetail(data);
    } catch (error) {
      console.error('Fetch detail error:', error);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get('session');
    if (sessionParam) {
      setSelectedId(sessionParam);
      fetchDetail(sessionParam);
    }
  }, [fetchDetail, fetchSessions]);

  useEffect(() => {
    pollRef.current = setInterval(async () => {
      await fetchSessions();
      if (selectedId) {
        await fetchDetail(selectedId);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchDetail, fetchSessions, selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detail?.messages]);

  const filteredSessions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return sessions.filter((session) => {
      const matchesFilter = filter === 'all' ? true : session.status === filter;
      if (!matchesFilter) return false;
      if (!keyword) return true;
      const haystack = [session.customerName, session.visitorName, session.lastMessage?.content, session.id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [filter, search, sessions]);

  const activeCount = useMemo(() => sessions.filter((session) => session.status === 'active').length, [sessions]);
  const selectedSession = useMemo(() => sessions.find((session) => session.id === selectedId) ?? null, [selectedId, sessions]);

  const selectSession = useCallback((id: string) => {
    setSelectedId(id);
    setShowInfoDialog(false);
    fetchDetail(id);
  }, [fetchDetail]);

  const refreshSelectedSession = useCallback(async () => {
    if (!selectedId) return;
    await Promise.all([fetchSessions(), fetchDetail(selectedId)]);
  }, [fetchDetail, fetchSessions, selectedId]);

  const handleTransfer = useCallback(async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/chat/sessions/${selectedId}/transfer`, { method: 'POST' });
      if (res.ok) await refreshSelectedSession();
    } catch (error) {
      console.error(error);
    }
  }, [refreshSelectedSession, selectedId]);

  const handleRelease = useCallback(async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/chat/sessions/${selectedId}/release`, { method: 'POST' });
      if (res.ok) await refreshSelectedSession();
    } catch (error) {
      console.error(error);
    }
  }, [refreshSelectedSession, selectedId]);

  const handleCloseSession = useCallback(async () => {
    if (!selectedId || !window.confirm('確定要將這個對話結案嗎？')) return;
    try {
      const res = await fetch(`/api/chat/sessions/${selectedId}/close`, { method: 'POST' });
      if (res.ok) await refreshSelectedSession();
    } catch (error) {
      console.error(error);
    }
  }, [refreshSelectedSession, selectedId]);

  const handleDeleteSession = useCallback(async (id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (!window.confirm('確定要永久刪除這段客服對話嗎？此操作無法復原。')) return;
    try {
      const res = await fetch(`/api/chat/sessions/${id}`, { method: 'DELETE' });
      if (!res.ok) return;
      if (selectedId === id) {
        setSelectedId(null);
        setDetail(null);
      }
      await fetchSessions();
    } catch (error) {
      console.error(error);
    }
  }, [fetchSessions, selectedId]);

  const handleBatchDelete = useCallback(async (days: number) => {
    if (!window.confirm(`確定要刪除 ${days} 天前的客服對話嗎？`)) return;
    setCleaningDays(days);
    try {
      const res = await fetch('/api/chat/sessions/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ olderThanDays: days }),
      });
      if (!res.ok) {
        window.alert('清理失敗，請稍後再試。');
        return;
      }
      const data = await res.json();
      window.alert(data.message);
      setSelectedId(null);
      setDetail(null);
      await fetchSessions();
    } catch (error) {
      console.error(error);
    } finally {
      setCleaningDays(null);
      setShowCleanupDialog(false);
    }
  }, [fetchSessions]);

  const handleSendAdmin = useCallback(async () => {
    if (!selectedId || !adminInput.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chat/sessions/${selectedId}/admin-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: adminInput.trim() }),
      });
      if (!res.ok) return;
      setAdminInput('');
      await fetchDetail(selectedId);
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  }, [adminInput, fetchDetail, selectedId, sending]);

  const handleComposerKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendAdmin();
    }
  }, [handleSendAdmin]);

  const showMobileDetail = Boolean(selectedId);
  const detailName = detail ? sessionDisplayName(detail.session, detail.customer) : '未選取對話';

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-b-2 border-efan-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:gap-6">
        <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/50 to-cyan-50/70 p-5 shadow-sm lg:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-500">Customer Service Center</p>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 lg:text-4xl">客服中心</h1>
                <p className="mt-1 text-sm text-slate-500 lg:text-base">
                  手機優先的客服工作台，讓你在行動裝置也能快速看、回、切換與結案。
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-emerald-200 bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Active</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.16)]" />
                  <span className="text-2xl font-black text-slate-900">{activeCount}</span>
                  <span className="text-sm font-medium text-slate-500">進行中</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCleanupDialog(true)}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 transition hover:border-red-300 hover:bg-red-50"
              >
                清理舊對話
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(320px,380px)_1fr] lg:gap-6">
          <section
            className={`overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm ${
              showMobileDetail ? 'hidden lg:flex' : 'flex'
            } flex-col`}
          >
            <div className="border-b border-slate-100 p-4 lg:p-5">
              <div className="flex flex-col gap-3">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">對話列表</h2>
                  <p className="mt-1 text-xs text-slate-400">共 {filteredSessions.length} 筆，會自動每 3 秒更新。</p>
                </div>

                <label className="relative block">
                  <span className="sr-only">搜尋對話</span>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="搜尋姓名、內容或 session id"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                </label>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {[
                    { id: 'all', label: '全部' },
                    { id: 'active', label: 'AI 處理中' },
                    { id: 'transferred', label: '真人接手' },
                    { id: 'closed', label: '已結案' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFilter(item.id as SessionFilter)}
                      className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-bold transition ${
                        filter === item.id
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="max-h-[calc(100dvh-21rem)] min-h-[360px] flex-1 overflow-y-auto divide-y divide-slate-100 lg:max-h-[calc(100dvh-18rem)]">
              {filteredSessions.length === 0 ? (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-6 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">💬</div>
                  <h3 className="text-lg font-bold text-slate-700">目前沒有符合條件的對話</h3>
                  <p className="mt-2 max-w-sm text-sm text-slate-400">
                    可以調整搜尋字詞或篩選條件，快速找到需要處理的客服對話。
                  </p>
                </div>
              ) : (
                filteredSessions.map((session) => {
                  const status = statusLabel(session.status);
                  const isSelected = session.id === selectedId;

                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => selectSession(session.id)}
                      className={`w-full px-4 py-4 text-left transition lg:px-5 ${
                        isSelected ? 'bg-emerald-50/80' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                            session.status === 'active'
                              ? 'bg-emerald-400'
                              : session.status === 'transferred'
                              ? 'bg-amber-400'
                              : 'bg-slate-300'
                          }`}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-slate-900">
                                {session.customerName || session.visitorName || '匿名訪客'}
                              </p>
                              <p className="mt-1 truncate text-xs text-slate-500">
                                {session.lastMessage?.content || '尚無訊息內容'}
                              </p>
                            </div>

                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${status.color}`}>
                                {status.text}
                              </span>
                              <span className="text-[10px] font-medium text-slate-400">{sourceLabel(session.source)}</span>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <p className="text-[11px] text-slate-400">
                              {formatSessionTime(session.updatedAt)} · {session.messageCount} 則訊息
                            </p>
                            <button
                              type="button"
                              onClick={(event) => handleDeleteSession(session.id, event)}
                              className="inline-flex min-h-9 items-center justify-center rounded-full border border-slate-200 px-3 text-[11px] font-bold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            >
                              刪除
                            </button>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            {!selectedId ? (
              <div className="flex min-h-[560px] flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-4xl">🧭</div>
                <h3 className="text-2xl font-black text-slate-900">選一個對話開始處理</h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                  手機版會先顯示對話列表，點進去後進入完整對話工作台；桌機版則會保留雙欄視圖。
                </p>
              </div>
            ) : detailLoading && !detail ? (
              <div className="flex min-h-[560px] items-center justify-center">
                <div className="h-9 w-9 animate-spin rounded-full border-b-2 border-efan-primary" />
              </div>
            ) : detail ? (
              <div className="flex min-h-[560px] flex-col lg:min-h-[calc(100dvh-18rem)]">
                <div className="border-b border-slate-100 bg-white/95 px-4 py-4 backdrop-blur lg:px-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-3 flex items-center gap-2 lg:hidden">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedId(null);
                              setDetail(null);
                            }}
                            className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                          >
                            返回列表
                          </button>
                          <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Session</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-xl font-black text-slate-900 lg:text-2xl">{detailName}</h2>
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusLabel(detail.session.status).color}`}>
                            {statusLabel(detail.session.status).text}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                            {sourceLabel(detail.session.source)}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                          最近更新於 {formatSessionTime(detail.session.updatedAt)}
                          {detail.session.transferredTo?.name ? ` · 目前由 ${detail.session.transferredTo.name} 接手` : ''}
                        </p>
                      </div>

                      <div className="hidden lg:flex lg:items-center lg:gap-2">
                        {detail.session.status === 'active' && <ActionButton tone="amber" label="轉真人客服" onClick={handleTransfer} />}
                        {detail.session.status === 'transferred' && <ActionButton tone="slate" label="交還 AI" onClick={handleRelease} />}
                        {detail.session.status !== 'closed' && <ActionButton tone="red" label="結案" onClick={handleCloseSession} />}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:hidden">
                      <button
                        type="button"
                        onClick={() => setShowInfoDialog(true)}
                        className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        查看資料
                      </button>
                      {detail.session.status === 'active' && <ActionButton tone="amber" label="轉真人客服" onClick={handleTransfer} compact />}
                      {detail.session.status === 'transferred' && <ActionButton tone="slate" label="交還 AI" onClick={handleRelease} compact />}
                      {detail.session.status !== 'closed' && <ActionButton tone="red" label="結案" onClick={handleCloseSession} compact />}
                    </div>
                  </div>
                </div>

                <div className="flex min-h-0 flex-1">
                  <div className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/80 via-white to-white px-4 py-4 lg:px-6">
                      <div className="mx-auto w-full max-w-4xl">
                        {detail.messages.length === 0 ? (
                          <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">💭</div>
                            <h3 className="text-lg font-bold text-slate-700">這段對話還沒有訊息</h3>
                            <p className="mt-2 text-sm text-slate-400">客戶傳送新訊息後，會即時顯示在這裡。</p>
                          </div>
                        ) : (
                          detail.messages.map((message) => (
                            <ChatBubble
                              key={message.id}
                              role={message.role}
                              content={message.content}
                              senderName={message.senderName}
                              timestamp={message.createdAt}
                            />
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    {detail.session.status !== 'closed' ? (
                      <div className="border-t border-slate-100 bg-white px-4 py-3 lg:px-6">
                        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
                          <textarea
                            value={adminInput}
                            onChange={(event) => setAdminInput(event.target.value)}
                            onKeyDown={handleComposerKeyDown}
                            rows={1}
                            placeholder="輸入回覆內容，按 Enter 送出，Shift + Enter 換行"
                            className="min-h-[52px] w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                            disabled={sending}
                          />
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-slate-400">對話狀態：{statusLabel(detail.session.status).text}</p>
                            <button
                              type="button"
                              onClick={handleSendAdmin}
                              disabled={!adminInput.trim() || sending}
                              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-efan-primary px-5 text-sm font-black text-white transition hover:bg-efan-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {sending ? '送出中…' : '送出回覆'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 text-center text-sm text-slate-500 lg:px-6">
                        這段對話已結案，如需協助請引導客戶重新發起新對話或致電
                        <strong className="ml-1 text-slate-700">02-7730-1158</strong>
                      </div>
                    )}
                  </div>

                  <aside className="hidden w-[300px] shrink-0 border-l border-slate-100 bg-slate-50/80 xl:block">
                    <SessionInfoPanel detail={detail} selectedSession={selectedSession} />
                  </aside>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>

      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent
          className="top-auto bottom-0 left-0 right-0 max-h-[85dvh] translate-x-0 translate-y-0 rounded-t-[28px] rounded-b-none border-slate-200 p-0 sm:max-w-none"
          showCloseButton={false}
        >
          <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-slate-200" />
          <div className="max-h-[calc(85dvh-1rem)] overflow-y-auto">
            {detail ? <SessionInfoPanel detail={detail} selectedSession={selectedSession} mobile /> : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
        <DialogContent className="max-w-md rounded-[28px] border-slate-200 p-0">
          <div className="p-6">
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl font-black text-slate-900">清理舊對話</DialogTitle>
              <DialogDescription className="text-sm leading-6 text-slate-500">
                這會刪除指定天數以前的客服對話。建議只清理已不需要追蹤的歷史資料。
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 grid gap-3">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handleBatchDelete(days)}
                  disabled={cleaningDays !== null}
                  className="flex min-h-14 items-center justify-between rounded-2xl border border-slate-200 px-4 text-left transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div>
                    <p className="text-sm font-black text-slate-900">刪除 {days} 天前的對話</p>
                    <p className="mt-1 text-xs text-slate-500">適合定期清理已結案的歷史紀錄。</p>
                  </div>
                  <span className="text-sm font-bold text-red-500">{cleaningDays === days ? '處理中…' : '執行'}</span>
                </button>
              ))}
            </div>

            <DialogFooter className="mt-6">
              <button
                type="button"
                onClick={() => setShowCleanupDialog(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                取消
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ActionButton({
  label,
  onClick,
  tone,
  compact = false,
}: {
  label: string;
  onClick: () => void;
  tone: 'amber' | 'red' | 'slate';
  compact?: boolean;
}) {
  const toneClass =
    tone === 'amber'
      ? 'bg-amber-500 text-white hover:bg-amber-600'
      : tone === 'red'
      ? 'bg-red-50 text-red-600 hover:bg-red-100'
      : 'bg-slate-200 text-slate-700 hover:bg-slate-300';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center rounded-2xl px-4 text-sm font-black transition ${toneClass} ${
        compact ? 'flex-1' : ''
      }`}
    >
      {label}
    </button>
  );
}

function SessionInfoPanel({
  detail,
  selectedSession,
  mobile = false,
}: {
  detail: SessionDetail;
  selectedSession: Session | null;
  mobile?: boolean;
}) {
  const aggregatedInfo = detail.aggregatedInfo ?? {};
  const hasAggregatedInfo = Object.keys(aggregatedInfo).length > 0;

  return (
    <div className={mobile ? 'p-5 pb-8' : 'h-full overflow-y-auto p-5'}>
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Conversation Data</p>
        <h3 className="mt-2 text-xl font-black text-slate-900">對話資料</h3>
        <p className="mt-1 text-sm text-slate-500">快速查看客戶資訊、關聯報價與客戶檔案。</p>
      </div>

      <div className="space-y-5">
        <InfoCard title="對話概況">
          <InfoItem label="來源" value={sourceLabel(detail.session.source)} />
          <InfoItem label="狀態" value={statusLabel(detail.session.status).text} />
          <InfoItem
            label="更新時間"
            value={formatSessionTime(detail.session.updatedAt || selectedSession?.updatedAt || detail.session.createdAt)}
          />
          <InfoItem label="訊息數" value={`${detail.messages.length || selectedSession?.messageCount || 0} 則`} />
        </InfoCard>

        <InfoCard title="擷取資訊">
          {hasAggregatedInfo ? (
            <div className="space-y-3">
              {aggregatedInfo.contactName && <InfoItem label="聯絡人" value={aggregatedInfo.contactName} />}
              {aggregatedInfo.mobile && <InfoItem label="手機" value={aggregatedInfo.mobile} />}
              {aggregatedInfo.phone && <InfoItem label="電話" value={aggregatedInfo.phone} />}
              {aggregatedInfo.email && <InfoItem label="Email" value={aggregatedInfo.email} />}
              {aggregatedInfo.companyName && <InfoItem label="公司" value={aggregatedInfo.companyName} />}
              {aggregatedInfo.address && <InfoItem label="地址" value={aggregatedInfo.address} />}
              {aggregatedInfo.services?.length > 0 && <InfoItem label="需求類型" value={aggregatedInfo.services.join('、')} />}
              {aggregatedInfo.requirements && <InfoItem label="需求描述" value={aggregatedInfo.requirements} />}
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-400">這段對話目前還沒有 AI 擷取出的完整客戶資料。</p>
          )}
        </InfoCard>

        {detail.quote && (
          <InfoCard title="關聯報價">
            <Link
              href={`/admin/quotes/${detail.quote.quoteNumber}`}
              className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-emerald-300 hover:bg-emerald-50/40"
            >
              <p className="text-sm font-black text-efan-primary">{detail.quote.quoteNumber}</p>
              <p className="mt-1 text-xs text-slate-500">NT$ {Number(detail.quote.totalAmount || 0).toLocaleString()}</p>
            </Link>
          </InfoCard>
        )}

        {detail.customer && (
          <InfoCard title="客戶檔案">
            <Link
              href={`/admin/customers/${detail.customer.id}`}
              className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-emerald-300 hover:bg-emerald-50/40"
            >
              <p className="text-sm font-black text-slate-900">
                {detail.customer.companyNames?.[0]?.companyName || detail.customer.contacts?.[0]?.name || '客戶資料'}
              </p>
              <p className="mt-1 text-xs text-slate-500">{detail.customer.customerNumber}</p>
            </Link>
          </InfoCard>
        )}
      </div>
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">{title}</h4>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}
