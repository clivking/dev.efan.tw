'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { ChatProvider, useChatContext } from './ChatContext';
import ChatHeader from './ChatHeader';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import ConsultationFlow from './ConsultationFlow';

// ─── PreChatForm (web_quote only) ───────────────────────────────

function PreChatForm({ onSubmit, isLoading }: {
  onSubmit: (name: string, phone: string) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const validate = () => {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = '請輸入姓名';
    if (!phone.trim()) errs.phone = '請輸入電話';
    else if (!/^(0[2-9]\d{7,8}|09\d{8})$/.test(phone.replace(/[-\s]/g, ''))) {
      errs.phone = '請輸入正確的電話號碼';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isLoading) return;
    onSubmit(name.trim(), phone.replace(/[-\s]/g, ''));
  };

  return (
    <div className="flex-1 overflow-y-auto px-5 py-6 sm:flex sm:flex-col sm:justify-center sm:px-6 sm:py-8">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">👋</span>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">歡迎來到一帆客服</h3>
        <p className="text-xs text-gray-500">請先留下聯絡資訊，讓我們能更好地為您服務</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            姓名 <span className="text-red-400">*</span>
          </label>
          <input
            ref={nameRef}
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })); }}
            placeholder="例：王先生"
            className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all ${
              errors.name ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-emerald-200'
            } focus:ring-2 focus:border-transparent`}
          />
          {errors.name && <p className="text-[11px] text-red-500 mt-0.5 ml-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            聯絡電話 <span className="text-red-400">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => { setPhone(e.target.value); setErrors(prev => ({ ...prev, phone: undefined })); }}
            placeholder="例：0912345678"
            className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all ${
              errors.phone ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-emerald-200'
            } focus:ring-2 focus:border-transparent`}
          />
          {errors.phone && <p className="text-[11px] text-red-500 mt-0.5 ml-1">{errors.phone}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 active:scale-[0.98] transition-all disabled:opacity-60 text-sm"
        >
          {isLoading ? '連線中...' : '開始對話 💬'}
        </button>
      </form>

      <p className="text-[10px] text-gray-400 text-center mt-4">
        我們重視您的隱私，資訊僅用於客服聯繫
      </p>
    </div>
  );
}

// ─── ChatWidgetInner: source-based routing ──────────────────────

function ChatWidgetInner({ source }: { source: string }) {
  const {
    isOpen, messages, isLoading, status,
    toggleChat, closeChat, sendMessage, initSession, sessionId,
    requestTransfer, setSessionFromExternal,
  } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [showProactiveBubble, setShowProactiveBubble] = useState(false);

  useEffect(() => {
    // 透過 sessionStorage 讓狀態在不同頁面跳轉時保持記憶
    // 當客戶手動關閉過，或是正在使用客服系統，都不再彈出打擾
    const isDismissed = typeof window !== 'undefined' && sessionStorage.getItem('efan-dismissed-proactive-chat');
    if (isDismissed === 'true' || isOpen) {
      setShowProactiveBubble(false);
      return;
    }
    // 進站 5 秒後自動彈出，給予引導但不突兀
    const timer = setTimeout(() => setShowProactiveBubble(true), 5000);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Track whether we're in consultation flow or free chat (for non-web_quote sources)
  const [mode, setMode] = useState<'consultation' | 'free_chat'>(
    source === 'web_quote' ? 'free_chat' : 'consultation'
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleOpen = () => {
    toggleChat();
  };

  // ── web_quote form handler ──
  const handleFormSubmit = async (name: string, phone: string) => {
    setIsInitializing(true);
    try {
      await initSession(undefined, undefined, name, phone);
    } finally {
      setIsInitializing(false);
    }
  };

  // ── Turnstile Integration ──
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);
  const turnstileTokenRef = useRef<string>('');
  const turnstileResolveRef = useRef<((token: string) => void) | null>(null);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState<string | null>(null);

  // Fetch site config to get turnstile key
  useEffect(() => {
    fetch('/api/public/site-config')
      .then(r => r.json())
      .then(cfg => {
        if (cfg.turnstileEnabled && cfg.turnstileSiteKey) {
          setTurnstileSiteKey(cfg.turnstileSiteKey);
        }
      })
      .catch(() => {});
  }, []);

  // Load Turnstile script and render widget (compact, hidden via CSS)
  useEffect(() => {
    if (!turnstileSiteKey) return;

    const w = window as any;
    const onToken = (token: string) => {
      turnstileTokenRef.current = token;
      if (turnstileResolveRef.current) {
        turnstileResolveRef.current(token);
        turnstileResolveRef.current = null;
      }
    };

    const renderWidget = () => {
      if (turnstileRef.current && w.turnstile && !turnstileWidgetId.current) {
        try {
          turnstileWidgetId.current = w.turnstile.render(turnstileRef.current, {
            sitekey: turnstileSiteKey,
            size: 'compact',
            callback: onToken,
            'error-callback': () => { console.error('[Turnstile] Challenge error'); },
            'expired-callback': () => { turnstileTokenRef.current = ''; },
          });
        } catch (e) {
          console.error('[Turnstile] Render error:', e);
        }
      }
    };

    if (w.turnstile) {
      renderWidget();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad';
    script.async = true;
    w.onTurnstileLoad = () => renderWidget();
    document.head.appendChild(script);

    return () => {
      if (turnstileWidgetId.current && w.turnstile) {
        try { w.turnstile.remove(turnstileWidgetId.current); } catch {}
        turnstileWidgetId.current = null;
      }
    };
  }, [turnstileSiteKey]);

  const getTurnstileToken = useCallback(async (): Promise<string> => {
    // If we already have a cached token, return it and reset for next use
    if (turnstileTokenRef.current) {
      const token = turnstileTokenRef.current;
      turnstileTokenRef.current = '';
      const w = window as any;
      if (w.turnstile && turnstileWidgetId.current) {
        w.turnstile.reset(turnstileWidgetId.current);
      }
      return token;
    }

    // No token yet — reset and wait for callback
    const w = window as any;
    if (w.turnstile && turnstileWidgetId.current) {
      w.turnstile.reset(turnstileWidgetId.current);
    }

    return new Promise<string>((resolve) => {
      turnstileResolveRef.current = resolve;
      setTimeout(() => {
        if (turnstileResolveRef.current === resolve) {
          turnstileResolveRef.current = null;
          resolve('');
        }
      }, 15000);
    });
  }, []);

  // Expose getTurnstileToken globally for ChatContext to use
  useEffect(() => {
    (window as any).__efanGetTurnstileToken = getTurnstileToken;
  }, [getTurnstileToken]);

  const handleEnterFreeChat = useCallback((consultationSessionId: string) => {
    // Switch from consultation flow to free chat mode
    setSessionFromExternal(consultationSessionId);
    setMode('free_chat');
  }, [setSessionFromExternal]);

  const handleTransfer = async () => {
    setShowTransferConfirm(false);
    await requestTransfer();
  };

  const isWebQuote = source === 'web_quote';

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 z-50 flex items-end gap-3 sm:bottom-8 sm:right-6" id="chat-widget-button">
          
          {/* Proactive AI Chat Bubble */}
          {showProactiveBubble && (
            <div 
              className="relative hidden max-w-[min(20rem,calc(100vw-7rem))] cursor-pointer items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-4 py-3.5 shadow-[0_8px_30px_rgba(16,185,129,0.2)] transition-all duration-500 group hover:bg-emerald-50 active:scale-95 sm:flex animate-in slide-in-from-right-5 fade-in origin-bottom-right"
              onClick={handleOpen}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <span className="text-lg animate-bounce" style={{ animationDuration: '2s' }}>👋</span>
              </div>
              <div className="text-sm font-bold text-gray-700 group-hover:text-emerald-700 leading-tight">
                 需要 AI 幫您評估預算嗎？<br/>
                 <span className="text-[11px] text-emerald-500 font-medium mt-0.5 inline-block">點我立即由客服智庫支援</span>
              </div>
              <button 
                className="absolute -top-1.5 -left-1.5 bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm hover:bg-gray-200 transition-colors"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setShowProactiveBubble(false); 
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('efan-dismissed-proactive-chat', 'true');
                  }
                }}
              >
                ✕
              </button>
            </div>
          )}

          <button
            onClick={handleOpen}
            className="group relative flex h-14 items-center gap-0 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-500 pl-0 pr-[56px] text-white shadow-[0_8px_30px_rgba(16,185,129,0.4)] transition-all duration-500 hover:gap-3 hover:pl-5 hover:pr-[60px] hover:shadow-[0_8px_40px_rgba(16,185,129,0.6)] active:scale-95 sm:h-[60px] sm:pr-[60px] sm:hover:pr-[64px] sm:hover:pl-6"
            aria-label="開啟客服對話"
          >
            <span className="max-w-0 group-hover:max-w-[160px] overflow-hidden whitespace-nowrap text-sm font-bold transition-all duration-500 opacity-0 group-hover:opacity-100">
              線上客服
            </span>
            <div className="absolute right-0 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/30 bg-gradient-to-br from-emerald-400 to-teal-500 sm:h-[60px] sm:w-[60px]">
              <svg className="w-7 h-7 text-white drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full" />
            </span>
            <span className="pointer-events-none absolute right-0 h-14 w-14 rounded-full bg-emerald-400 opacity-15 animate-ping sm:h-[60px] sm:w-[60px]" />
            <span className="pointer-events-none absolute right-0 h-14 w-14 rounded-full bg-emerald-300 opacity-10 animate-ping sm:h-[60px] sm:w-[60px]" style={{ animationDelay: '0.5s' }} />
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed inset-x-0 bottom-0 right-0 z-50 flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col bg-white shadow-[0_25px_60px_-12px_rgba(0,0,0,0.2)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[min(100dvh-3rem,640px)] sm:max-h-[calc(100vh-3rem)] sm:w-[440px] sm:max-w-[calc(100vw-2rem)] sm:rounded-3xl"
          id="chat-widget-window"
        >
          {/* Header */}
          <ChatHeader
            onClose={closeChat}
            status={sessionId ? status : (mode === 'consultation' ? 'consultation' : 'idle')}
          />

          {/* ── web_quote: original PreChatForm → free chat flow ── */}
          {isWebQuote ? (
            <>
              {!sessionId ? (
                <PreChatForm onSubmit={handleFormSubmit} isLoading={isInitializing} />
              ) : (
                <>
                  <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white p-4 space-y-1">
                    {messages.map((msg, i) => (
                      <ChatBubble
                        key={msg.id}
                        role={msg.role}
                        content={msg.content}
                        senderName={msg.senderName}
                        timestamp={msg.createdAt}
                        isStreaming={isLoading && i === messages.length - 1 && msg.role === 'assistant'}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {status !== 'closed' ? (
                    <div className="shrink-0 bg-white">
                      <ChatInput
                        onSend={sendMessage}
                        disabled={isLoading}
                        placeholder={status === 'transferred' ? '專人處理中，您可以繼續留言...' : '輸入訊息...'}
                      />
                      {status === 'active' && !isLoading && (
                        <div className="px-4 pb-2 -mt-1">
                          <button
                            onClick={() => setShowTransferConfirm(true)}
                            className="text-[11px] text-gray-400 hover:text-emerald-600 transition-colors"
                          >
                            💬 轉接專人
                          </button>
                        </div>
                      )}
                      {status === 'transferred' && (
                        <div className="px-4 pb-2 -mt-1">
                          <span className="text-[11px] text-amber-500 font-medium">
                            ⏳ 已轉接專人，請稍候回覆
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-center text-xs text-gray-400 border-t border-gray-100">
                      此對話已結束。如需協助請撥打 <strong>02-7730-1158</strong>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            /* ── Non-web_quote: consultation flow → free chat ── */
            <>
              {mode === 'consultation' ? (
                <div className="min-h-0 flex-1 overflow-y-auto consultation-scroll">
                  <ConsultationFlow
                    onEnterFreeChat={handleEnterFreeChat}
                    getTurnstileToken={getTurnstileToken}
                  />
                </div>
              ) : (
                /* Free chat mode (after Step 4 → "still have questions") */
                <>
                  <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white p-4 space-y-1">
                    {messages.map((msg, i) => (
                      <ChatBubble
                        key={msg.id}
                        role={msg.role}
                        content={msg.content}
                        senderName={msg.senderName}
                        timestamp={msg.createdAt}
                        isStreaming={isLoading && i === messages.length - 1 && msg.role === 'assistant'}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {status !== 'closed' ? (
                    <div className="shrink-0 bg-white">
                      <ChatInput
                        onSend={sendMessage}
                        disabled={isLoading}
                        placeholder="輸入訊息..."
                      />
                      <div className="px-4 pb-2 -mt-1 flex justify-between items-center">
                        <button
                          onClick={() => setShowTransferConfirm(true)}
                          className="text-[11px] text-gray-400 hover:text-emerald-600 transition-colors"
                        >
                          👤 轉接真人客服
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-center text-xs text-gray-400 border-t border-gray-100">
                      此對話已結束。如需協助請撥打 <strong>02-7730-1158</strong>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Transfer confirmation overlay */}
      {showTransferConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 mx-4 max-w-xs w-full animate-in zoom-in-95 duration-200">
            <h4 className="font-bold text-gray-800 mb-2">轉接專人</h4>
            <p className="text-sm text-gray-500 mb-4">
              確定要轉接專人嗎？專人可能需要幾分鐘回覆。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTransferConfirm(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleTransfer}
                className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all"
              >
                確定轉接
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Turnstile widget */}
      <div ref={turnstileRef} style={{ overflow: 'hidden', height: 0, width: 0 }} />

    </>
  );
}

/**
 * ChatWidget — Floating customer service chat widget
 * Mount this in the frontend layout (all pages)
 *
 * source === 'web_quote': original PreChatForm → free chat flow
 * source !== 'web_quote': new ConsultationFlow → optional free chat
 */
export default function ChatWidget({ source = 'web_home', quoteId }: {
  source?: string;
  quoteId?: string;
}) {
  return (
    <ChatProvider source={source} quoteId={quoteId}>
      <ChatWidgetInner source={source} />
    </ChatProvider>
  );
}
