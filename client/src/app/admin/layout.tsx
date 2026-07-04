'use client';

// Dashboard layout wrapping navigation templates and command spotlight widgets in a global React Context
import React, { useState, useEffect, createContext, useContext, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import CommandPalette from '../../components/CommandPalette';
import LeadForm from '../../components/LeadForm';
import { X, Loader2 } from 'lucide-react';

interface DashboardContextType {
  isModalOpen: boolean;
  setIsModalOpen: (val: boolean) => void;
  hotCount: number;
  setHotCount: (val: number) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hotCount, setHotCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
      } else {
        // Restrict access to counselors only
        const { data: counselor } = await supabase.from('counselors').select('id').eq('email', session.user.email).maybeSingle();
        if (!counselor) {
          router.replace('/dashboard');
        } else {
          setCheckingAuth(false);
        }
      }
    }
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/login');
      } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        const { data: counselor } = await supabase.from('counselors').select('id').eq('email', session.user.email).maybeSingle();
        if (!counselor) {
          router.replace('/dashboard');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#050816] text-[#F9FAFB] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">Verifying Session...</span>
      </div>
    );
  }

  return (
    <DashboardContext.Provider
      value={{
        isModalOpen,
        setIsModalOpen,
        hotCount,
        setHotCount,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      <div className="min-h-screen bg-[#050816] text-[#F9FAFB] flex flex-col font-sans relative">
        {/* Spotlight Command Search */}
        <CommandPalette />

        {/* Global Navbar */}
        <Navbar onAddLeadClick={() => setIsModalOpen(true)} hotCount={hotCount} />

        <div className="flex flex-1">
          {/* Global Sidebar wrapped in Suspense for Next.js build bailing out of CSR */}
          <Suspense fallback={<div className="w-60 bg-slate-950 min-h-[calc(100vh-64px)] hidden md:flex shrink-0 animate-pulse border-r border-slate-800/80" />}>
            <Sidebar />
          </Suspense>
          
          {/* Main workspace scroll panel */}
          <main className="flex-1 p-6 max-w-7xl mx-auto w-full overflow-y-auto page-transition">
            {children}
          </main>
        </div>

        {/* Manual registration overlay modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl shadow-brand-primary/5 overflow-hidden">
              {/* Outer neon border accent */}
              <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 rounded-2xl -z-10" />
              
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-bold font-heading text-brand-white border-b border-slate-800 pb-3 mb-4 select-none">
                Register New Student Lead
              </h3>

              <LeadForm
                isModal={true}
                onCancel={() => setIsModalOpen(false)}
                onSubmitSuccess={() => {
                  triggerRefresh();
                  setIsModalOpen(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardContext.Provider>
  );
}
