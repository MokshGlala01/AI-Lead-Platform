'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ThreeDHeroCanvas from '../components/3d/ThreeDHeroCanvas';
import { supabase } from '../lib/supabase';
import { Target, Users, Code, Award, GraduationCap, ArrowRight, Zap, Shield, Sparkles, Loader2 } from 'lucide-react';

const LandingPage: React.FC = () => {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCheckingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleApplyClick = async () => {
    if (!session) {
      router.push('/login?redirect=/application');
      return;
    }

    setRedirecting(true);
    try {
      // Check if they are counselor
      const { data: counselor } = await supabase.from('counselors').select('id').eq('email', session.user.email).maybeSingle();
      if (counselor) {
        router.push('/admin');
        return;
      }

      // Check if they already have an application
      const { data: lead } = await supabase.from('leads').select('id').eq('email', session.user.email).maybeSingle();
      if (lead) {
        router.push('/dashboard');
      } else {
        router.push('/application');
      }
    } catch (err) {
      console.error(err);
      router.push('/application');
    } finally {
      setRedirecting(false);
    }
  };
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
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-base text-brand-white tracking-tight leading-none font-heading">
            EFOS Education
          </span>
        </div>
        <div className="flex items-center gap-4">
          {checkingAuth ? (
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider animate-pulse">Checking Auth...</span>
          ) : session ? (
            <button
              onClick={async () => {
                try {
                  const { data: counselor } = await supabase.from('counselors').select('id').eq('email', session.user.email).maybeSingle();
                  if (counselor) {
                    router.push('/admin');
                  } else {
                    const { data: lead } = await supabase.from('leads').select('id').eq('email', session.user.email).maybeSingle();
                    if (lead) {
                      router.push('/dashboard');
                    } else {
                      router.push('/application');
                    }
                  }
                } catch (err) {
                  router.push('/dashboard');
                }
              }}
              className="text-[10px] font-extrabold text-brand-primary hover:text-brand-white bg-brand-primary/10 hover:bg-brand-primary/20 px-3.5 py-2 rounded-xl transition-all border border-brand-primary/20 uppercase tracking-wider"
            >
              My Console
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="text-[10px] font-extrabold text-slate-400 hover:text-brand-white transition-all uppercase tracking-wider hover:underline"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Hero and registration split layout */}
      <main className="max-w-6xl mx-auto px-6 py-16 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Side: Visual Pitch (Lg: 7 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-8 text-left animate-fade-in">
          {/* Neon Alert Label */}
          <div className="inline-flex items-center gap-2 bg-brand-primary/10 border border-brand-primary/30 px-3.5 py-1.5 rounded-full self-start text-[10px] font-extrabold uppercase tracking-widest text-brand-accent">
            <Sparkles className="w-3.5 h-3.5 text-brand-accent fill-brand-accent/15" />
            AI-Powered Student Qualification
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="text-4xl sm:text-6xl font-black font-heading leading-tight tracking-tight text-glow text-brand-white">
              AI-Powered Student <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent">
                Lead Qualification
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 font-medium max-w-lg leading-relaxed">
              Automate lead collection, run neural grading, generate personalized WhatsApp and Email campaigns, and assign hot leads round-robin to coordinators.
            </p>
          </div>

          {/* Core Feature Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md flex gap-4 items-start">
              <div className="p-2.5 bg-red-500/10 text-brand-hot rounded-xl border border-brand-hot/20 shrink-0">
                <Target className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-bold text-slate-200">Workload Balancer</h3>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                  Hot leads (score ≥ 80) automatically route toavailable counselors with the lowest workload.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md flex gap-4 items-start">
              <div className="p-2.5 bg-brand-accent/10 text-brand-accent rounded-xl border border-brand-accent/20 shrink-0">
                <Zap className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-bold text-slate-200">Neural Scoring Matrix</h3>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                  Lead score computed dynamically based on course profiles, credentials, age brackets, and sites visits.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md flex gap-4 items-start">
              <div className="p-2.5 bg-brand-green/10 text-brand-green rounded-xl border border-brand-green/20 shrink-0">
                <Code className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-bold text-slate-200">Practical Framework</h3>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                  Next.js 15, Supabase PostgreSQL, Supabase Auth, Realtime, AI-powered automation.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md flex gap-4 items-start">
              <div className="p-2.5 bg-brand-secondary/10 text-brand-secondary rounded-xl border border-brand-secondary/20 shrink-0">
                <Shield className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-bold text-slate-200">Secure RLS Directives</h3>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                  Supabase database policies protect communication logs and sequences data tables.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Glass CTA Card (Lg: 5 Columns) */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/80 p-8 rounded-2xl shadow-2xl shadow-brand-primary/5 backdrop-blur-xl flex flex-col gap-6 relative justify-center text-center">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-primary/20 via-brand-secondary/20 to-brand-accent/20 rounded-2xl -z-10 pointer-events-none blur-sm" />
          
          <div className="w-12 h-12 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary mx-auto shadow-inner shadow-brand-primary/5">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>

          <div className="flex flex-col gap-2 select-none">
            <h2 className="text-xl font-bold font-heading text-brand-white tracking-tight">
              Start Your Admission
            </h2>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Submit your credentials to run our AI-powered qualification analysis, get matched with an expert mentor, and view your customized progression path in real-time.
            </p>
          </div>

          <button
            onClick={handleApplyClick}
            disabled={redirecting}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-brand-primary text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-brand-primary/25 hover:bg-brand-primary-light active:scale-[0.98] transition-all border border-brand-primary/15 disabled:opacity-50 select-none group cursor-pointer"
          >
            {redirecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Configuring Portal...
              </>
            ) : (
              <>
                Apply For Counseling
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      </main>

      {/* Footer marquee panel */}
      <footer className="bg-slate-950/80 border-t border-slate-900/60 py-8 px-6 text-center text-[10px] font-bold text-slate-500 tracking-widest uppercase relative z-10 select-none">
        © 2026 EFOS Inc. All Rights Reserved. Dark SaaS Edition v1.0.0
      </footer>
    </div>
  );
};

export default LandingPage;
