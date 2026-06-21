/**
 * @component AICoach
 * @description Minimal conversational Gemini AI coaching interface.
 * Google I/O 2026 aesthetic — iridescent gradient glow on active input, matte glass chat bubbles.
 *
 * API: src/services/geminiAPI.js
 * Security: OWASP A03 — all user text goes through validateText() before API call.
 * Rate limiting: handled inside geminiAPI.js (10 calls/session).
 *
 * Accessibility:
 *   - Live region for AI responses (aria-live="polite")
 *   - Keyboard-submittable textarea (Shift+Enter = new line, Enter = send)
 *   - Focus trap kept within the chat form
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { getCarbonCoachInsights, askClimateQuestion, getRemainingCalls } from '../services/geminiAPI.js';
import { validateText } from '../utils/validators.js';

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const T = {
  primary:  '#1A6B3C',
  accent:   '#F5A623',
  muted:    '#6B7280',
  baseline: '#E5E7EB',
  glass:    'rgba(248,251,247,0.88)',
  text:     '#111827',
  danger:   '#E53E3E',
};

// Iridescent glow keyframes — injected once as a style tag
const GLOW_STYLE_ID = 'cz-ai-glow';
if (typeof document !== 'undefined' && !document.getElementById(GLOW_STYLE_ID)) {
  const s = document.createElement('style');
  s.id = GLOW_STYLE_ID;
  s.textContent = `
    @keyframes czIridescentGlow {
      0%   { box-shadow: 0 0 0 3px rgba(26,107,60,0.15), 0 0 20px rgba(26,107,60,0.10); border-color: #1A6B3C; }
      25%  { box-shadow: 0 0 0 3px rgba(124,58,237,0.15), 0 0 20px rgba(124,58,237,0.10); border-color: #7C3AED; }
      50%  { box-shadow: 0 0 0 3px rgba(14,165,233,0.15), 0 0 24px rgba(14,165,233,0.12); border-color: #0EA5E9; }
      75%  { box-shadow: 0 0 0 3px rgba(245,166,35,0.15), 0 0 20px rgba(245,166,35,0.10); border-color: #F5A623; }
      100% { box-shadow: 0 0 0 3px rgba(26,107,60,0.15), 0 0 20px rgba(26,107,60,0.10); border-color: #1A6B3C; }
    }
    @keyframes czFadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes czDot {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40%            { transform: scale(1);   opacity: 1;   }
    }
  `;
  document.head.appendChild(s);
}

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '0.5rem 0' }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: T.primary,
          animation: `czDot 1.2s ${i * 0.18}s infinite ease-in-out`,
        }} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      animation: 'czFadeIn 0.28s ease-out',
      gap: 4,
    }}>
      <div style={{
        maxWidth: '82%',
        padding: '0.75rem 1rem',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser ? T.primary : '#fff',
        color: isUser ? '#fff' : T.text,
        fontSize: '0.875rem', lineHeight: 1.7,
        boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
        border: isUser ? 'none' : `1px solid ${T.baseline}`,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.content}
      </div>
      <p style={{ fontSize: '0.62rem', color: T.muted, margin: '0 0.25rem' }}>
        {isUser ? 'You' : '🌿 EcoCoach · Gemini AI'} · {msg.time}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Suggested prompts
// ---------------------------------------------------------------------------

const SUGGESTED_PROMPTS = [
  'How can I reduce my transport emissions the most?',
  'What diet changes will make the biggest impact?',
  'Explain carbon offsets in simple terms.',
  'How does India compare to global climate targets?',
  'What is the Paris Agreement?',
  'How does solar energy help reduce my footprint?',
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AICoach({ footprintResult = null }) {
  const [messages, setMessages]   = useState([
    {
      role: 'assistant',
      content: `Hi! I'm EcoCoach, your AI climate advisor powered by Google Gemini.\n\n${
        footprintResult
          ? `I can see your footprint is **${footprintResult.totalMonthly.toFixed(1)} kg CO₂e/month** (Grade ${footprintResult.grade}). Ask me anything about your results, or how to reduce your impact.`
          : 'Complete the Calculator first to unlock personalised insights — or ask me any climate science question!'
      }`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [inputFocused, setInputFocused] = useState(false);
  const chatEndRef                = useRef(null);
  const inputRef                  = useRef(null);
  const remaining                 = getRemainingCalls();

  // Auto-scroll to newest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text = input) => {
    const raw = text.trim();
    if (!raw || loading) return;

    // Validate + sanitize (OWASP A03)
    let sanitized;
    try {
      sanitized = validateText(raw, 600);
    } catch (e) {
      setError('Message too long (max 600 characters). Please shorten it.');
      return;
    }

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { role: 'user', content: sanitized, time }]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      let reply;
      if (footprintResult && (sanitized.toLowerCase().includes('my') || sanitized.toLowerCase().includes('footprint'))) {
        reply = await getCarbonCoachInsights(footprintResult);
      } else {
        reply = await askClimateQuestion(sanitized, footprintResult);
      }
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, time: replyTime }]);
    } catch (err) {
      const errTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `⚠️ ${err.message || 'Something went wrong. Please try again.'}`,
        time: errTime,
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, footprintResult]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <section
      style={{ width: '100%', maxWidth: 760, margin: '0 auto', padding: '2.5rem 1rem',
               display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
      aria-label="AI Climate Coach"
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: T.primary,
                       letterSpacing: '-0.03em', marginBottom: 4 }}>
            AI Climate Coach
          </h2>
          <p style={{ color: T.muted, fontSize: '0.9rem' }}>
            Powered by Google Gemini — personalised, India-context-aware climate advice.
          </p>
        </div>
        <div style={{
          fontSize: '0.72rem', fontWeight: 600,
          padding: '0.3rem 0.75rem', borderRadius: 20,
          background: remaining > 3 ? 'rgba(47,133,90,0.1)' : 'rgba(229,62,62,0.1)',
          color: remaining > 3 ? T.primary : T.danger,
        }}>
          {remaining} queries left this session
        </div>
      </div>

      {/* Chat window */}
      <div style={{
        background: T.glass,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 20,
        border: '1px solid rgba(229,231,235,0.65)',
        boxShadow: '0 4px 24px rgba(26,107,60,0.06)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Messages */}
        <div
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
          style={{
            flexGrow: 1, overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex', flexDirection: 'column', gap: '1rem',
            minHeight: 320, maxHeight: 460,
          }}
        >
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div style={{
                padding: '0.75rem 1rem', borderRadius: '18px 18px 18px 4px',
                background: '#fff', border: `1px solid ${T.baseline}`,
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              }}>
                <TypingIndicator />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: T.baseline }} />

        {/* Input area */}
        <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {error && (
            <p style={{ fontSize: '0.75rem', color: T.danger, margin: 0 }} role="alert">
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Ask EcoCoach anything… (Enter to send, Shift+Enter for new line)"
                rows={2}
                maxLength={600}
                disabled={loading || remaining <= 0}
                aria-label="Type your climate question"
                aria-disabled={loading || remaining <= 0}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 12,
                  border: `1.5px solid ${inputFocused && !loading ? 'transparent' : T.baseline}`,
                  outline: 'none',
                  resize: 'none',
                  fontSize: '0.875rem', fontFamily: 'Inter, sans-serif',
                  lineHeight: 1.6, color: T.text,
                  background: remaining <= 0 ? 'rgba(229,231,235,0.4)' : '#fff',
                  cursor: remaining <= 0 ? 'not-allowed' : 'text',
                  transition: 'border-color 0.2s',
                  // Active processing: iridescent glow animation
                  animation: loading
                    ? 'czIridescentGlow 2s linear infinite'
                    : inputFocused
                    ? 'none'
                    : 'none',
                  boxShadow: inputFocused && !loading
                    ? '0 0 0 3px rgba(26,107,60,0.08)'
                    : loading
                    ? undefined  // handled by animation
                    : 'none',
                }}
              />
              {input.length > 500 && (
                <p style={{
                  position: 'absolute', bottom: 6, right: 10,
                  fontSize: '0.62rem', color: input.length > 580 ? T.danger : T.muted,
                }}>
                  {input.length}/600
                </p>
              )}
            </div>

            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim() || remaining <= 0}
              aria-label="Send message"
              style={{
                minWidth: 44, minHeight: 44,
                width: 44, height: 44,
                borderRadius: '50%', border: 'none',
                background: loading || !input.trim() || remaining <= 0 ? T.baseline : T.primary,
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: loading || !input.trim() || remaining <= 0 ? 'not-allowed' : 'pointer',
                fontSize: '1.1rem',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!loading && input.trim() && remaining > 0) {
                  e.currentTarget.style.transform = 'scale(1.08)';
                  e.currentTarget.style.boxShadow = `0 4px 14px rgba(26,107,60,0.35)`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {loading ? '⏳' : '➤'}
            </button>
          </div>

          {/* Suggested prompts */}
          {messages.length <= 1 && !loading && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  disabled={remaining <= 0}
                  style={{
                    padding: '0.25rem 0.75rem', borderRadius: 20,
                    border: `1px solid ${T.baseline}`, background: 'transparent',
                    fontSize: '0.72rem', color: T.muted, cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = T.primary;
                    e.currentTarget.style.color = T.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = T.baseline;
                    e.currentTarget.style.color = T.muted;
                  }}
                  aria-label={`Ask: ${p}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {remaining <= 0 && (
            <p style={{ fontSize: '0.75rem', color: T.danger, textAlign: 'center' }} role="alert">
              Session limit reached (10 queries). Refresh the page to continue.
            </p>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <p style={{ fontSize: '0.68rem', color: T.muted, textAlign: 'center', lineHeight: 1.6 }}>
        EcoCoach uses Google Gemini to generate responses. Always verify specific numerical claims
        against authoritative sources (IPCC, CEA, DEFRA). Not financial or medical advice.
      </p>
    </section>
  );
}
