'use client';

import { useRef, useEffect } from 'react';

interface ChatBubbleProps {
  role: 'user' | 'assistant' | 'admin';
  content: string;
  senderName?: string;
  timestamp?: string;
  isStreaming?: boolean;
}

/** Detect URLs in text and render them as clickable links */
function linkify(text: string, isUserBubble: boolean) {
  // Match http/https URLs
  const urlRegex = /(https?:\/\/[^\s，。！？,!?\u3002\uff01\uff1f]+)/g;
  const parts = text.split(urlRegex);
  if (parts.length === 1) return text; // No URLs found

  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      // Reset lastIndex since we're reusing the regex
      urlRegex.lastIndex = 0;
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline font-semibold break-all ${
            isUserBubble
              ? 'text-white/90 hover:text-white'
              : 'text-emerald-600 hover:text-emerald-700'
          }`}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export default function ChatBubble({ role, content, senderName, timestamp, isStreaming }: ChatBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bubbleRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [content]);

  const isUser = role === 'user';
  const isAdmin = role === 'admin';

  return (
    <div ref={bubbleRef} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
        isUser ? 'bg-blue-500 text-white' :
        isAdmin ? 'bg-amber-500 text-white' :
        'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'
      }`}>
        {isUser ? '👤' : isAdmin ? '👨‍💼' : '🤖'}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] space-y-1`}>
        {/* Sender label */}
        {(isAdmin && senderName) && (
          <span className="text-[10px] font-bold text-amber-600 ml-1">{senderName}</span>
        )}
        {!isUser && role === 'assistant' && (
          <span className="text-[10px] font-bold text-emerald-600 ml-1">AI 客服</span>
        )}

        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-md'
            : isAdmin
            ? 'bg-amber-50 text-gray-800 border border-amber-200 rounded-bl-md'
            : 'bg-gray-100 text-gray-800 rounded-bl-md'
        }`}>
          {content ? linkify(content, isUser) : (isStreaming ? (
            <span className="inline-flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          ) : null)}
          {isStreaming && content && (
            <span className="inline-block w-0.5 h-4 bg-gray-400 animate-pulse ml-0.5 align-text-bottom" />
          )}
        </div>

        {/* Timestamp */}
        {timestamp && (
          <p className={`text-[10px] text-gray-400 ${isUser ? 'text-right mr-1' : 'ml-1'}`}>
            {new Date(timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}
