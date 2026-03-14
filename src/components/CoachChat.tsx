'use client';

import { useState, useRef, useEffect } from 'react';
import { CoachMessage } from '@/lib/types';
import { getSessions } from '@/lib/storage';

export default function CoachChat() {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function buildSessionContext(): string {
    const sessions = getSessions().slice(0, 20);
    if (sessions.length === 0) return '';

    return sessions
      .map((s) => {
        const parts = [`${s.date} - ${s.type} (${s.durationMinutes}min)`];
        if (s.type === 'match') {
          parts.push(
            `vs ${s.opponent || 'unknown'}, ${s.score || 'no score'}, ${s.result}`
          );
        }
        if (s.drills?.length) parts.push(`Drills: ${s.drills.join(', ')}`);
        if (s.notes) parts.push(`Notes: ${s.notes}`);
        return parts.join(' | ');
      })
      .join('\n');
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: CoachMessage = { role: 'user', content: input.trim() };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
          sessionContext: buildSessionContext(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to get response');
      }

      const data = await res.json();
      setMessages([
        ...updated,
        { role: 'assistant', content: data.message },
      ]);
    } catch (err) {
      setMessages([
        ...updated,
        {
          role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : 'Something went wrong'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 && (
          <div className="text-center text-neutral-500 py-8">
            <p className="text-lg mb-2">Ask your AI Coach</p>
            <div className="space-y-1 text-sm">
              <p>&quot;What should I work on next?&quot;</p>
              <p>&quot;How do I improve my serve?&quot;</p>
              <p>&quot;Analyze my recent match results&quot;</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-green-600 text-white'
                  : 'bg-neutral-800 text-neutral-200 border border-neutral-700'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-neutral-400">
              Thinking...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-neutral-800">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your coach..."
          className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}
