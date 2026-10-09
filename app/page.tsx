'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './components/MessageBubble';
import { StatusIndicator } from './components/StatusIndicator';
import { SuggestedPrompts } from './components/SuggestedPrompts';
import { Header } from './components/Header';

const STORAGE_KEY = 'agentforge-chat';

export default function ChatPage() {
  const { messages, sendMessage, stop, status, setMessages } = useChat();
  const [input, setInput] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const isLoading = status === 'streaming' || status === 'submitted';

  // Restore persisted messages after mount (client-only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setMessages(JSON.parse(stored));
    } catch {}
    setHydrated(true);
  }, []);

  // Persist messages to localStorage on every change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll-to-bottom
  const listRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollToBottom = () => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  };

  // Auto-scroll when new messages arrive, only if already near the bottom
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distFromBottom < 100) scrollToBottom();
  }, [messages]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 100);
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    setShowScrollBtn(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <main className="flex flex-col h-screen max-w-2xl mx-auto relative">
      <Header onClear={clearChat} disabled={isLoading} />

      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-4 p-4"
      >
        {hydrated && messages.length === 0 && (
          <SuggestedPrompts
            onSelect={(p) => { sendMessage({ text: p }); }}
            disabled={isLoading}
          />
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <StatusIndicator messages={messages} status={status} />
      </div>

      {showScrollBtn && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none">
          <button
            onClick={scrollToBottom}
            className="pointer-events-auto bg-white border border-gray-200 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:shadow-lg text-gray-500 hover:text-gray-700 transition-all"
            title="Scroll to bottom"
          >
            ↓
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-gray-100 bg-white shrink-0">
        <input
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm outline-none focus:border-blue-500"
          value={input}
          placeholder="Type a message…"
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        {isLoading ? (
          <button
            type="button"
            onClick={stop}
            className="bg-red-500 text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-red-600 transition-colors"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-blue-600 text-white rounded-full px-5 py-2 text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            Send
          </button>
        )}
      </form>
    </main>
  );
}
