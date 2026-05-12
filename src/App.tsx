/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Send, RefreshCcw, ShieldCheck, Sparkles, Database, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as React from "react";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

const BACKEND_URL = "/api/chat";

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: Date;
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
  
  :root {
    --bg: #030303;
    --card: rgba(18, 18, 24, 0.4);
    --accent: #2dd4bf; 
    --accent-glow: rgba(45, 212, 191, 0.1);
    --text: #f8fafc;
    --text-muted: #94a3b8;
    --text-dim: #475569;
    --border: rgba(255, 255, 255, 0.08);
    --glass-bg: rgba(15, 15, 20, 0.6);
    --glass-border: rgba(255, 255, 255, 0.1);
    --font-display: 'Outfit', sans-serif;
    --font-main: 'Inter', sans-serif;
    --font-mono: 'DM Mono', monospace;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-main);
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
  }

  /* Refined Grainy Background */
  .bg-grid {
    position: fixed; inset: 0;
    background-image: 
      radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0);
    background-size: 32px 32px;
    z-index: -1;
  }

  .bg-spotlight {
    position: fixed; top: -15%; left: 50%; transform: translateX(-50%);
    width: 80vw; height: 60vh;
    background: radial-gradient(circle at 50% 0%, var(--accent-glow) 0%, transparent 70%);
    z-index: -1;
    pointer-events: none;
    filter: blur(100px);
  }

  .app-wrap {
    display: flex; flex-direction: column; height: 100vh;
    position: relative;
    max-width: 1200px;
    margin: 0 auto;
    border-left: 1px solid var(--border);
    border-right: 1px solid var(--border);
    background: rgba(0,0,0,0.25);
  }

  /* Glass Nav */
  nav {
    display: flex; justify-content: space-between; align-items: center;
    padding: 24px 40px;
    background: rgba(5, 5, 5, 0.4);
    backdrop-filter: blur(24px) saturate(160%);
    border-bottom: 1px solid var(--border);
    z-index: 50;
  }

  .brand {
    display: flex; align-items: center; gap: 16px;
    cursor: default;
  }

  .brand-logo-wrap {
    width: 40px; height: 40px;
    position: relative;
    display: flex; align-items: center; justify-content: center;
  }

  .brand-logo {
    width: 100%; height: 100%; 
    background: linear-gradient(135deg, var(--accent) 0%, #0d9488 100%);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 24px -8px var(--accent);
    transform: rotate(-3deg);
    transition: transform 0.3s ease;
  }

  .brand:hover .brand-logo {
    transform: rotate(0deg) scale(1.05);
  }

  .logo-text {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 24px;
    letter-spacing: -0.04em;
    color: var(--text);
    display: flex; flex-direction: column; line-height: 1;
  }
  
  .logo-text-sub {
    font-size: 10px; font-family: var(--font-mono);
    color: var(--accent); opacity: 0.8;
    text-transform: uppercase; letter-spacing: 0.2em;
    margin-top: 4px; font-weight: 600;
  }

  .nav-actions {
    display: flex; align-items: center; gap: 20px;
  }

  .status-pill {
    padding: 6px 16px; border-radius: 20px;
    background: rgba(45, 212, 191, 0.05);
    border: 1px solid rgba(45, 212, 191, 0.2);
    font-family: var(--font-mono);
    font-size: 10px; color: var(--accent);
    text-transform: uppercase; letter-spacing: 0.1em;
    display: flex; align-items: center; gap: 8px;
    font-weight: 600;
  }

  .pulse-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 10px var(--accent);
    position: relative;
  }

  .pulse-dot::after {
    content: ""; position: absolute; inset: -2px;
    border-radius: 50%; border: 1px solid var(--accent);
    animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
  }

  @keyframes ping {
    75%, 100% { transform: scale(2.5); opacity: 0; }
  }

  /* Chat Scaling & Layout */
  .chat-viewport {
    flex: 1; overflow-y: auto; padding: 40px 0;
    display: flex; flex-direction: column; align-items: center;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .chat-viewport::-webkit-scrollbar { display: none; }

  .chat-container {
    width: 100%; max-width: 800px;
    padding: 0 40px;
    display: flex; flex-direction: column; gap: 32px;
  }

  .msg-row { display: flex; width: 100%; }
  .msg-row-bot { justify-content: flex-start; }
  .msg-row-user { justify-content: flex-end; }

  .msg-content {
    max-width: 85%;
    display: flex; flex-direction: column; gap: 8px;
  }
  .msg-row-user .msg-content { align-items: flex-end; }

  .bubble {
    border-radius: 20px;
    padding: 20px 28px;
    font-size: 16px;
    line-height: 1.7;
    position: relative;
    border: 1px solid transparent;
  }

  .bubble-bot {
    background: var(--glass-bg);
    backdrop-filter: blur(20px) saturate(160%);
    border: 1px solid var(--glass-border);
    color: var(--text);
    border-bottom-left-radius: 4px;
    box-shadow: 0 8px 32px -12px rgba(0,0,0,0.5);
  }

  .bubble-user {
    background: var(--text);
    color: var(--bg);
    border-bottom-right-radius: 4px;
    font-weight: 500;
    box-shadow: 0 8px 24px -10px rgba(255,255,255,0.15);
  }

  .tool-call-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px 20px;
    display: flex; align-items: center; gap: 16px;
    margin: 12px 0;
    backdrop-filter: blur(4px);
  }

  .tool-icon { color: var(--accent); opacity: 0.9; }
  .tool-info { display: flex; flex-direction: column; gap: 1px; }
  .tool-label { font-family: var(--font-mono); font-size: 10px; color: var(--accent); text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600; }
  .tool-name { font-family: var(--font-mono); font-size: 13px; color: var(--text-muted); }

  .msg-meta {
    font-size: 11px; color: var(--text-dim); font-family: var(--font-mono);
    padding: 0 4px;
  }

  /* Input panel at bottom */
  .footer {
    padding: 0 40px 48px;
    z-index: 50;
    display: flex; flex-direction: column; align-items: center;
  }

  .input-panel {
    width: 100%; max-width: 800px;
    position: relative;
    background: rgba(18, 18, 22, 0.7);
    backdrop-filter: blur(32px) saturate(180%);
    border: 1px solid var(--glass-border);
    border-radius: 24px;
    padding: 12px 14px 12px 28px;
    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
    box-shadow: 0 32px 64px -16px rgba(0,0,0,0.8);
  }

  .input-panel:focus-within {
    border-color: rgba(45, 212, 191, 0.4);
    box-shadow: 0 40px 72px -12px rgba(0,0,0,0.9), 0 0 0 1px rgba(45, 212, 191, 0.1);
    transform: translateY(-4px);
  }

  .input-group { display: flex; align-items: center; gap: 20px; }

  textarea {
    flex: 1; background: none; border: none; outline: none;
    resize: none; color: var(--text); font-family: var(--font-main);
    font-size: 16px; padding: 12px 0; max-height: 140px;
    min-height: 48px;
    font-weight: 400;
    line-height: 1.6;
  }

  textarea::placeholder { color: var(--text-dim); }

  .action-btn {
    width: 52px; height: 52px; border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    border: none; cursor: pointer; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .btn-send { 
    background: var(--text); color: #000;
  }
  .btn-send:hover { 
    transform: scale(1.08) translateY(-2px); 
    box-shadow: 0 12px 24px -8px rgba(255,255,255,0.3);
  }
  .btn-send:disabled { background: rgba(255,255,255,0.1); color: var(--text-dim); cursor: not-allowed; transform: none; box-shadow: none; }

  .footer-sub {
    margin-top: 24px; display: flex; justify-content: center; gap: 40px;
    padding: 0 20px;
  }

  .footer-item { display: flex; align-items: center; gap: 10px; opacity: 0.5; transition: opacity 0.3s; cursor: default; }
  .footer-item:hover { opacity: 0.9; }
  .footer-label { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.15em; }

  /* Markdown content refined */
  .markdown-content p { margin-bottom: 16px; }
  .markdown-content p:last-child { margin-bottom: 0; }
  .markdown-content strong { color: var(--accent); font-weight: 600; }
  .markdown-content ul, .markdown-content ol { margin-left: 24px; margin-bottom: 16px; }
  .markdown-content li { margin-bottom: 8px; }
  .markdown-content li::marker { color: var(--accent); opacity: 0.5; }
  .markdown-content code { background: rgba(255,255,255,0.1); padding: 3px 8px; border-radius: 6px; font-family: var(--font-mono); font-size: 0.85em; color: var(--accent); }

  .typing-card {
    padding: 16px 28px; background: var(--glass-bg); backdrop-filter: blur(20px);
    border: 1px solid var(--border); border-radius: 20px; border-bottom-left-radius: 4px;
  }
  
  .reset-trigger {
    width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;
    border-radius: 14px; border: 1px solid var(--border); color: var(--text-muted); cursor: pointer;
    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); background: rgba(255,255,255,0.02);
  }
  .reset-trigger:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-glow); transform: rotate(180deg); }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

`;

const SHOPPING_JOKES = [
  "I told my wife she should embrace her mistakes. She gave me a hug.",
  "Why don't shopping centers play hide and seek? Because you're always checking out!",
  "My bank account is like a checklist. I'm just waiting for the next withdrawal.",
  "I'm on a seafood diet. I see food and I buy it.",
  "Shopping is my cardio. Especially running away from the bill.",
  "I have enough clothes – said no one ever.",
  "Cinderella is proof that a new pair of shoes can change your life.",
  "Window shopping is like looking at the menu when you're on a diet.",
  "My wallet is like an onion. When I open it, it makes me cry.",
  "Online shopping: because it's frowned upon to be in a store in your pajamas."
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "bot",
      text: "Welcome to ShopEase Support. I am your AI-powered agent with live access to orders, returns, and inventory. How may I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [jokeIndex, setJokeIndex] = useState(0);
  const [sessionId] = useState(() => `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const timer = setInterval(() => {
      setJokeIndex((prev) => (prev + 1) % SHOPPING_JOKES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  const query_support_agent = async (userMessage: string, history: any[]) => {
    try {
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: history,
          session_id: sessionId
        }),
      });

      const contentType = response.headers.get("content-type");
      if (response.ok && contentType && contentType.includes("application/json")) {
        const data = await response.json();
        const rawText = data.result ||
                        data.response || 
                        data.message || 
                        data.text || 
                        data.output || 
                        data.choices?.[0]?.message?.content;
        
        if (!rawText) {
          console.error("Unknown response format:", data);
          throw new Error("Chat agent responded but the response format was unrecognized.");
        }

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "bot",
            text: rawText, // Displaying exactly as received
            timestamp: new Date(),
          },
        ]);
      } else {
        const errorData = response.ok ? {} : await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Upstream issue (${response.status})`;
        const debugDetail = errorData.debug || errorData.details ? ` (${errorData.debug || errorData.details})` : '';
        const targetDetail = errorData.target ? ` @ ${errorData.target}` : '';
        throw new Error(`${errorMessage}${debugDetail}${targetDetail}`);
      }
    } catch (error: any) {
      console.error("Critical communication failure:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "bot",
          text: `Connection Error: ${error.message}. Please verify your ngrok URL and backend status.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    const currentHistory = messages.map((m) => ({ role: m.role, text: m.text }));
    
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsLoading(true);

    // Forwarding EVERY message to the backend via query_support_agent
    await query_support_agent(currentInput, currentHistory);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const fmt = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <style>{styles}</style>
      <div className="bg-grid" />
      <div className="bg-spotlight" />

      <div className="app-wrap">
        <nav>
          <div className="brand">
            <div className="brand-logo-wrap">
              <div className="brand-logo">
                <Sparkles size={20} color="#000" strokeWidth={3} />
              </div>
            </div>
            <div className="logo-text">
              <span>ShopEase</span>
              <span className="logo-text-sub">Elite Support</span>
            </div>
          </div>

          <div className="nav-actions">
            <div className="status-pill">
              <div className="pulse-dot" />
              <span>Agent Online</span>
            </div>
            <button
              className="reset-trigger"
              onClick={() =>
                setMessages([
                  {
                    id: "1",
                    role: "bot",
                    text: "How may we serve you now?",
                    timestamp: new Date(),
                  },
                ])
              }
              title="New conversation"
            >
              <RefreshCcw size={14} />
            </button>
          </div>
        </nav>

        <div className="chat-viewport">
          <div className="chat-container">
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  className={`msg-row ${msg.role === "user" ? "msg-row-user" : "msg-row-bot"}`}
                >
                  <div className="msg-content">
                    <div className={`bubble ${msg.role === "bot" ? "bubble-bot" : "bubble-user"}`}>
                      <div className="markdown-content">
                        {msg.role === "bot" && /^[a-z0-9_]+\s*\{.*\}$/is.test(msg.text.trim()) ? (
                          <div className="tool-call-card">
                            <Terminal size={14} className="tool-icon" />
                            <div className="tool-info">
                              <span className="tool-label">Executing Task</span>
                              <span className="tool-name">{msg.text.trim().split('{')[0]}</span>
                            </div>
                          </div>
                        ) : (
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        )}
                      </div>
                    </div>
                    <span className="msg-meta">{fmt(msg.timestamp)}</span>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="msg-row msg-row-bot"
                >
                  <div className="msg-content">
                    <div className="typing-card">
                      <div className="dot-flashing" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} style={{ height: 10 }} />
          </div>
        </div>

        <footer className="footer">
          <div className="input-panel">
            <div className="input-group">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => { setInput(e.target.value); autoResize(); }}
                onKeyDown={handleKeyDown}
                placeholder="Message concierge…"
              />
              <button
                className="action-btn btn-send"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
              >
                <Send size={18} />
              </button>
            </div>

            <div className="footer-sub">
              <div className="footer-item">
                <ShieldCheck size={12} color="var(--text-dim)" />
                <span className="footer-label">Verified Concierge</span>
              </div>
              <div className="footer-item">
                <Database size={12} color="var(--text-dim)" />
                <span className="footer-label">Live Data Sync</span>
              </div>
            </div>
            
            <div style={{ height: '20px', display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={jokeIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="footer-label"
                  style={{ textTransform: 'none', fontStyle: 'italic', color: 'var(--text-muted)' }}
                >
                  {SHOPPING_JOKES[jokeIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}