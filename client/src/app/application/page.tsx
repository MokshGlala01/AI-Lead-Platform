'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LeadForm from '@/components/LeadForm';
import ThreeDHeroCanvas from '@/components/3d/ThreeDHeroCanvas';
import { School, Loader2, LogOut } from 'lucide-react';
import { signOut } from '@/lib/auth';

export default function ApplicationPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login?redirect=/application');
      } else {
        setEmail(session.user.email || '');
        // Check if they already have an application
        supabase.from('leads').select('id').eq('email', session.user.email).limit(1).then(({ data }) => {
          if (data && data.length > 0) {
            router.replace('/dashboard');
          } else {
            setLoading(false);
          }
        });
      }
    });
  }, [router]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] text-[#F9FAFB] flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin mb-2" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Configuring Form...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050816] text-[#F9FAFB] flex flex-col relative overflow-hidden font-sans">
      {/* 3D WebGL Background Particle Layer */}
      <ThreeDHeroCanvas />

      {/* Grid Overlay Pattern */}
      <div className="absolute inset-0 grid-overlay opacity-30 z-0 pointer-events-none" />

      {/* Header Glass Navbar */}
      <header className="h-16 bg-[#050816]/75 border-b border-slate-800/60 px-6 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md select-none">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-brand-primary rounded-xl text-white shadow-lg shadow-brand-primary/20">
            <School className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-base text-brand-white tracking-tight leading-none font-heading">
            CampusFlow Admissions
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-900 rounded-xl text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-all uppercase tracking-wider cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </header>

      {/* Form Container */}
      <main className="max-w-2xl mx-auto px-6 py-12 flex-1 w-full flex items-center justify-center relative z-10">
        <div className="w-full bg-slate-900/60 border border-slate-800/80 p-8 rounded-2xl shadow-2xl shadow-brand-primary/5 backdrop-blur-xl flex flex-col gap-6 relative">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-primary/10 via-brand-secondary/10 to-brand-accent/10 rounded-2xl -z-10 pointer-events-none blur-sm" />
          
          <div className="flex flex-col gap-1 border-b border-slate-800/60 pb-4 select-none">
            <h2 className="text-xl font-bold font-heading text-brand-white tracking-tight">
              Application for Counseling
            </h2>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Fill in your details below to evaluate your profile. Your verified login email is locked for security.
            </p>
          </div>

          <LeadForm prefilledEmail={email} />
        </div>
      </main>
    </div>
  );
}
