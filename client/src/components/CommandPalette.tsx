'use client';

// Command Palette (Spotlight search) modal triggered with Ctrl+K / Cmd+K
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, LayoutDashboard, BarChart3, GraduationCap, X, ChevronRight } from 'lucide-react';
import axios from 'axios';

interface SearchResult {
  id: string;
  name: string;
  phone: string;
  courseInterest: string;
  category: string;
}

const CommandPalette: React.FC = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Listen for hotkeys Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // 2. Debounced API search on query change
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await axios.get(apiUrl + '/api/leads', {
          params: { search: query, limit: 5 }
        });
        setResults(res.data.leads || []);
      } catch (err) {
        console.error('Command palette search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Quick navigation helpers
  const navigateTo = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          {/* Glass Overlay Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
          />

          {/* Floating Command Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-xl bg-slate-900/80 border border-brand-primary/25 rounded-2xl shadow-2xl shadow-brand-primary/10 overflow-hidden backdrop-blur-2xl z-10"
          >
            {/* Input Header */}
            <div className="flex items-center border-b border-slate-800 px-4 py-3.5 gap-3">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search leads or type command..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-brand-white focus:outline-none placeholder:text-slate-500"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content List */}
            <div className="max-h-[300px] overflow-y-auto p-2">
              {/* Static Quick Navigation Links */}
              {!query && (
                <div className="flex flex-col gap-0.5">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Quick Navigation
                  </div>

                  <button
                    onClick={() => navigateTo('/dashboard')}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-brand-white hover:bg-brand-primary/10 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <LayoutDashboard className="w-4 h-4 text-slate-400 group-hover:text-brand-primary" />
                      Dashboard Page
                    </div>
                    <kbd className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-400 uppercase">
                      ⌥D
                    </kbd>
                  </button>

                  <button
                    onClick={() => navigateTo('/dashboard/analytics')}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-brand-white hover:bg-brand-primary/10 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-4 h-4 text-slate-400 group-hover:text-brand-purple" />
                      Analytics Page
                    </div>
                    <kbd className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-400 uppercase">
                      ⌥A
                    </kbd>
                  </button>

                  <button
                    onClick={() => navigateTo('/')}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-brand-white hover:bg-brand-primary/10 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <GraduationCap className="w-4 h-4 text-slate-400 group-hover:text-brand-accent" />
                      Enrollment Public Form
                    </div>
                    <kbd className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-400 uppercase">
                      ⌥L
                    </kbd>
                  </button>
                </div>
              )}

              {/* Dynamic Lead search results */}
              {query && (
                <div className="flex flex-col gap-0.5">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-purple fill-brand-purple/10" />
                    Lead Matches {searching && <Loader2 className="w-3 h-3 animate-spin inline-block" />}
                  </div>

                  {results.length > 0 ? (
                    results.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => navigateTo(`/dashboard/leads/${lead.id}`)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-brand-white hover:bg-brand-primary/10 transition-all text-left"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-200">{lead.name}</span>
                          <span className="text-[10px] text-slate-500 font-medium">{lead.phone} • {lead.courseInterest || 'General'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded border ${
                            lead.category === 'Hot' ? 'bg-red-950/30 text-brand-hot border-brand-hot/30' :
                            lead.category === 'Warm' ? 'bg-orange-950/30 text-brand-warm border-brand-warm/30' :
                            'bg-blue-950/30 text-brand-cold border-brand-cold/30'
                          }`}>
                            {lead.category}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </div>
                      </button>
                    ))
                  ) : (
                    !searching && (
                      <div className="px-3 py-4 text-center text-xs text-slate-500 font-semibold">
                        No students found matching "{query}"
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Footer Commands help */}
            <div className="bg-slate-950/60 border-t border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider select-none">
              <span>Use arrow keys to navigate</span>
              <span>ESC to close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Loader icon component
const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default CommandPalette;
