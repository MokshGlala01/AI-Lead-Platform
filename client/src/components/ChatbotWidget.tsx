'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageSquare, X, Send, Loader2, BookOpen, Award, ArrowRight } from 'lucide-react';
import axios from 'axios';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: "Hi! I am **CampusFlow AI**, your virtual admissions assistant. Ask me anything about our courses, fees, or merit-based scholarships!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { text: 'Suggest Courses', icon: BookOpen },
    { text: 'Scholarships?', icon: Award },
    { text: 'BTech CS Fees?', icon: ArrowRight }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: Message = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const chatHistory = [...messages, userMessage];
      const res = await axios.post('/api/chat', { messages: chatHistory });
      
      setMessages((prev) => [...prev, { sender: 'ai', text: res.data.reply }]);
    } catch (err) {
      console.error('Failed to chat:', err);
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: "I'm experiencing connectivity issues. Please try again or reach out to your admissions coordinator." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to convert markdown bold **text** to HTML
  const formatText = (text: string) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const bulletRegex = /^\-\s(.*)$/gm;
    let formatted = text.replace(boldRegex, '<strong>$1</strong>');
    formatted = formatted.replace(bulletRegex, '<li class="ml-4 list-disc">$1</li>');
    return formatted;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans select-none">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-brand-primary/30 hover:shadow-brand-primary/50 hover:bg-brand-primary-light active:scale-95 transition-all cursor-pointer relative group border border-brand-primary/10"
        >
          <div className="absolute inset-0 bg-brand-primary rounded-full animate-ping opacity-25 group-hover:animate-none" />
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat window panel */}
      {isOpen && (
        <div className="w-[360px] h-[480px] bg-slate-900/90 border border-slate-800 backdrop-blur-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in relative">
          {/* Neon outer border accent */}
          <div className="absolute -inset-[1px] bg-gradient-to-b from-brand-primary/15 via-transparent to-brand-accent/15 rounded-2xl -z-10 pointer-events-none" />

          {/* Drawer Header */}
          <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7.5 h-7.5 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-brand-white leading-none">CampusFlow AI</span>
                <span className="text-[9px] font-bold text-brand-green uppercase tracking-wider mt-1">Live assistant</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-350 hover:bg-slate-850/60 transition-all cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] ${
                  m.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <div
                  className={`px-3.5 py-2.5 text-xs rounded-2xl leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-brand-primary text-white rounded-tr-none border border-brand-primary/10'
                      : 'bg-slate-950/60 text-slate-300 rounded-tl-none border border-slate-850'
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatText(m.text) }}
                />
              </div>
            ))}

            {loading && (
              <div className="self-start flex items-center gap-2.5 bg-slate-950/60 border border-slate-850 px-3.5 py-2.5 rounded-2xl rounded-tl-none max-w-[85%]">
                <Loader2 className="w-3.5 h-3.5 text-brand-primary animate-spin" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Analyzing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Panel */}
          {messages.length === 1 && !loading && (
            <div className="px-5 pb-3 flex flex-wrap gap-2">
              {quickPrompts.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(p.text)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-full text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-all cursor-pointer select-none"
                  >
                    <Icon className="w-3 h-3 text-brand-primary" />
                    {p.text}
                  </button>
                );
              })}
            </div>
          )}

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="px-5 py-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-slate-950 border border-slate-850 text-xs px-3.5 py-2.5 rounded-xl text-brand-white focus:outline-none focus:border-brand-primary placeholder:text-slate-655"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-brand-primary/10 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
