'use client';

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'admin';
  content: string;
  senderName?: string;
  createdAt: string;
}

interface ChatState {
  sessionId: string | null;
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  status: 'idle' | 'active' | 'transferred' | 'closed';
  extractedInfo: any;
}

interface ChatContextType extends ChatState {
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  sendMessage: (text: string) => Promise<void>;
  initSession: (source?: string, quoteId?: string, visitorName?: string, visitorContact?: string) => Promise<void>;
  requestTransfer: () => Promise<void>;
  /** Set session ID from an externally-created session (e.g. consultation flow) */
  setSessionFromExternal: (sessionId: string) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}

// Polling intervals
const POLL_INTERVAL_NORMAL = 3000;       // 3s for active/transferred
const POLL_INTERVAL_SLOW = 10000;        // 10s after 30 min idle
const POLL_IDLE_SLOW_MS = 30 * 60 * 1000;  // 30 min
const POLL_STOP_MS = 2 * 60 * 60 * 1000;   // 2 hours

export function ChatProvider({ children, source = 'web_home', quoteId }: {
  children: ReactNode;
  source?: string;
  quoteId?: string;
}) {
  const [state, setState] = useState<ChatState>({
    sessionId: null,
    messages: [],
    isOpen: false,
    isLoading: false,
    status: 'idle',
    extractedInfo: null,
  });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPollTimeRef = useRef<string>(new Date().toISOString());
  const lastMessageTimeRef = useRef<number>(Date.now());
  const pollIntervalRef = useRef<number>(POLL_INTERVAL_NORMAL);

  const openChat = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: true }));
  }, []);

  const closeChat = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const toggleChat = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const doPoll = useCallback(async (sessionId: string) => {
    try {
      // Check idle timeout — stop polling after 2 hours
      const idleMs = Date.now() - lastMessageTimeRef.current;
      if (idleMs >= POLL_STOP_MS) {
        stopPolling();
        return;
      }

      // Adaptive interval — slow down after 30 min idle
      const targetInterval = idleMs >= POLL_IDLE_SLOW_MS ? POLL_INTERVAL_SLOW : POLL_INTERVAL_NORMAL;
      if (targetInterval !== pollIntervalRef.current) {
        pollIntervalRef.current = targetInterval;
        // Restart interval with new timing
        stopPolling();
        pollRef.current = setInterval(() => doPoll(sessionId), targetInterval);
      }

      const after = lastPollTimeRef.current;
      const res = await fetch(`/api/public/chat/sessions/${sessionId}/messages?after=${after}`);
      if (!res.ok) return;
      const data = await res.json();
      
      if (data.messages?.length > 0) {
        lastMessageTimeRef.current = Date.now(); // Reset idle timer
        setState(prev => {
          const existingIds = new Set(prev.messages.map(m => m.id));
          // Only add non-user messages from polling.
          // User messages are always added optimistically and have local IDs (user-xxx)
          // that don't match DB UUIDs, causing duplicates. Skip them entirely.
          const newMsgs = data.messages.filter((m: ChatMessage) =>
            !existingIds.has(m.id) && m.role !== 'user'
          );
          if (newMsgs.length === 0) return prev;
          return { ...prev, messages: [...prev.messages, ...newMsgs] };
        });
        // Update last poll time to the latest message
        const lastMsg = data.messages[data.messages.length - 1];
        lastPollTimeRef.current = lastMsg.createdAt;
      }
      if (data.status) {
        setState(prev => {
          if (prev.status !== data.status) {
            return { ...prev, status: data.status };
          }
          return prev;
        });
        // Stop polling if closed
        if (data.status === 'closed') {
          stopPolling();
        }
      }
    } catch (e) {
      // Silent polling failure
    }
  }, [stopPolling]);

  const startPolling = useCallback((sessionId: string) => {
    stopPolling();
    // Set initial poll time to now (so we skip the welcome message already in DB)
    lastPollTimeRef.current = new Date().toISOString();
    lastMessageTimeRef.current = Date.now();
    pollIntervalRef.current = POLL_INTERVAL_NORMAL;
    
    pollRef.current = setInterval(() => doPoll(sessionId), POLL_INTERVAL_NORMAL);
  }, [doPoll, stopPolling]);

  const initSession = useCallback(async (src?: string, qId?: string, visitorName?: string, visitorContact?: string) => {
    if (state.sessionId) return; // Already initialized
    
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const res = await fetch('/api/public/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: src || source,
          quoteId: qId || quoteId,
          pageUrl: window.location.href,
          visitorName,
          visitorContact,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to create session');
      const data = await res.json();
      
      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: data.welcomeMessage,
        createdAt: new Date().toISOString(),
      };

      setState(prev => ({
        ...prev,
        sessionId: data.sessionId,
        messages: [welcomeMsg],
        status: 'active',
        isLoading: false,
      }));

      startPolling(data.sessionId);
    } catch (e) {
      console.error('Init session error:', e);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.sessionId, source, quoteId, startPolling]);

  const requestTransfer = useCallback(async () => {
    if (!state.sessionId || state.status !== 'active') return;

    // Pause polling to prevent picking up the DB-written transfer message (same pattern as sendMessage)
    stopPolling();

    try {
      const res = await fetch(`/api/public/chat/sessions/${state.sessionId}/transfer`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Transfer failed');
      const data = await res.json();

      // Add the transfer message to the conversation (local only — skip DB copy via polling)
      const transferMsg: ChatMessage = {
        id: `transfer-${Date.now()}`,
        role: 'assistant',
        content: data.message || '正在為您轉接專人，請稍候...',
        createdAt: new Date().toISOString(),
      };

      setState(prev => ({
        ...prev,
        status: 'transferred',
        messages: [...prev.messages, transferMsg],
      }));
    } catch (e) {
      console.error('Request transfer error:', e);
    } finally {
      // Advance poll cursor past the transfer message, then resume
      lastPollTimeRef.current = new Date().toISOString();
      lastMessageTimeRef.current = Date.now();
      if (state.sessionId) {
        startPolling(state.sessionId);
      }
    }
  }, [state.sessionId, state.status, stopPolling, startPolling]);

  const setSessionFromExternal = useCallback((extSessionId: string) => {
    // Reset session status to 'active' in DB (in case it was 'transferred' from previous flow)
    fetch(`/api/public/chat/sessions/${extSessionId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    }).catch(() => {});

    setState(prev => ({
      ...prev,
      sessionId: extSessionId,
      status: 'active',
      messages: [{
        id: 'welcome-free-chat',
        role: 'assistant' as const,
        content: '您好！有什麼其他問題想問的嗎？我會盡力為您解答 😊',
        createdAt: new Date().toISOString(),
      }],
    }));
    startPolling(extSessionId);
  }, [startPolling]);

  const sendMessage = useCallback(async (text: string) => {
    if (!state.sessionId || !text.trim()) return;

    // Pause polling during send to prevent race condition:
    // Without this, polling can pick up the AI message from DB
    // (with a UUID) while we're still streaming it locally (with a temp ID),
    // causing the response to appear twice.
    stopPolling();

    // Optimistic add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      isLoading: true,
    }));

    try {
      // Get Turnstile token for first message
      let turnstileToken: string | undefined;
      if (state.messages.filter(m => m.role === 'user').length === 0) {
        try {
          const getter = (window as any).__efanGetTurnstileToken;
          if (getter) {
            turnstileToken = await getter();
          }
        } catch (e) { /* Turnstile not available, continue */ }
      }

      const res = await fetch(`/api/public/chat/sessions/${state.sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, turnstileToken }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Send failed');
      }

      // Check if response is JSON (transferred/budget/limit) vs SSE stream
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.isTransferred || data.budgetExceeded || data.sessionLimitReached) {
          // Don't add an empty AI bubble — just show the status message if any
          if (data.message) {
            const sysMsg: ChatMessage = {
              id: `sys-${Date.now()}`,
              role: 'assistant',
              content: data.message,
              createdAt: new Date().toISOString(),
            };
            setState(prev => ({
              ...prev,
              messages: [...prev.messages, sysMsg],
              isLoading: false,
              status: data.isTransferred ? 'transferred' : prev.status,
            }));
          } else {
            setState(prev => ({ ...prev, isLoading: false }));
          }
          return;
        }
      }

      // Read SSE stream
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let aiContent = '';
      const aiMsgId = `ai-${Date.now()}`;

      // Add placeholder AI message
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          id: aiMsgId,
          role: 'assistant',
          content: '',
          createdAt: new Date().toISOString(),
        }],
      }));

      // SSE read with timeout safety net
      const SSE_TIMEOUT = 60000; // 60 seconds max
      const sseTimer = setTimeout(() => {
        reader.cancel().catch(() => {});
      }, SSE_TIMEOUT);

      let streamDone = false;
      try {
        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) {
                if (data.extractedInfo) {
                  setState(prev => ({ ...prev, extractedInfo: data.extractedInfo }));
                }
                // Handle AI-triggered transfer
                if (data.transferred) {
                  setState(prev => ({ ...prev, status: 'transferred' }));
                }
                streamDone = true; // Break outer loop immediately
                break; // Break inner for loop
              }
              if (data.text) {
                aiContent += data.text;
                setState(prev => ({
                  ...prev,
                  messages: prev.messages.map(m =>
                    m.id === aiMsgId ? { ...m, content: aiContent } : m
                  ),
                }));
              }
            } catch (e) {
              // JSON parse error on partial chunk
            }
          }
        }
      } finally {
        clearTimeout(sseTimer);
        reader.cancel().catch(() => {}); // Ensure stream is released
      }
    } catch (e) {
      console.error('Send message error:', e);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: '抱歉，訊息發送失敗，請稍後再試。',
        createdAt: new Date().toISOString(),
      };
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMsg],
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
      // Advance poll cursor past all messages we just sent/received,
      // then resume polling.
      lastPollTimeRef.current = new Date().toISOString();
      lastMessageTimeRef.current = Date.now();
      if (state.sessionId) {
        startPolling(state.sessionId);
      }
    }
  }, [state.sessionId, state.messages, startPolling, stopPolling]);

  return (
    <ChatContext.Provider value={{
      ...state,
      openChat,
      closeChat,
      toggleChat,
      sendMessage,
      initSession,
      requestTransfer,
      setSessionFromExternal,
    }}>
      {children}
    </ChatContext.Provider>
  );
}
