"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { chatApi } from "@/lib/api";
import { MessageSquare, X, Send, Sparkles, Loader2, Bot } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  data?: any[];
  queryType?: string;
}

const SUGGESTIONS = [
  "Show me all failed test cases",
  "How many open defects are there?",
  "What's the execution summary?",
  "Show recent test activity",
];

export function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", text };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await chatApi.query(text);
      const d = res.data;
      const assistantText = d.query_type === "unknown"
        ? "I couldn't find information for that query. Try asking about failed tests, open defects, or execution summaries."
        : `${d.answer_prefix} I found ${d.count} result${d.count !== 1 ? "s" : ""}.`;
      setMessages(m => [...m, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: assistantText,
        data: d.data,
        queryType: d.query_type,
      }]);
    } catch {
      setMessages(m => [...m, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: "Something went wrong. Make sure the backend is running and AI_API_KEY is set.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg flex items-center justify-center transition-colors"
        title="Ask AI about your test data"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="w-5 h-5" /></motion.div>
            : <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><MessageSquare className="w-5 h-5" /></motion.div>
          }
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-22 right-6 z-50 w-80 h-[480px] card shadow-2xl flex flex-col overflow-hidden"
            style={{ bottom: "5.5rem" }}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-raised))]">
              <div className="w-7 h-7 rounded-full bg-purple-600/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Ask TestLink AI</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Query your test data in plain English</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <div className="flex gap-2 items-start">
                    <div className="w-6 h-6 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <div className="bg-[hsl(var(--surface-raised))] rounded-lg rounded-tl-none px-3 py-2 text-sm">
                      Hi! Ask me anything about your test data. Here are some examples:
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 pl-8">
                    {SUGGESTIONS.map(s => (
                      <button key={s} onClick={() => sendMessage(s)}
                        className="text-left text-xs px-2.5 py-1.5 rounded-lg border border-purple-500/20 bg-purple-500/5 text-purple-400 hover:bg-purple-500/10 transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2 items-start ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                  )}
                  <div className={`max-w-[85%] space-y-1.5 ${msg.role === "user" ? "items-end flex flex-col" : ""}`}>
                    <div className={`rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-[hsl(var(--surface-raised))] rounded-tl-none"
                    }`}>
                      {msg.text}
                    </div>
                    {/* Data results */}
                    {msg.data && msg.data.length > 0 && (
                      <div className="w-full space-y-1">
                        {msg.data.slice(0, 5).map((item: any, i: number) => (
                          <div key={i} className="text-xs px-2.5 py-1.5 rounded-md bg-[hsl(var(--surface-overlay))] border border-[hsl(var(--border))]">
                            {item.title || item.name || JSON.stringify(item).slice(0, 60)}
                            {item.status && <span className={`ml-2 badge-${item.status} px-1.5 py-0.5 rounded-full`}>{item.status}</span>}
                            {item.severity && <span className={`ml-1 badge-${item.severity} px-1.5 py-0.5 rounded-full`}>{item.severity}</span>}
                          </div>
                        ))}
                        {msg.data.length > 5 && (
                          <p className="text-[10px] text-[hsl(var(--muted-foreground))] pl-1">+{msg.data.length - 5} more</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2 items-start">
                  <div className="w-6 h-6 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0">
                    <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                  </div>
                  <div className="bg-[hsl(var(--surface-raised))] rounded-lg rounded-tl-none px-3 py-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[hsl(var(--border))]">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your test data..."
                  disabled={loading}
                  className="flex-1 px-3 py-2 rounded-lg bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-1 focus:ring-purple-500/40 disabled:opacity-60"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-colors disabled:opacity-50 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}