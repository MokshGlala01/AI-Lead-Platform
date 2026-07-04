'use client';

// Futuristic public enrollment portal with WebGL floating network background and registration form
import React from 'react';
import ThreeDHeroCanvas from '../components/3d/ThreeDHeroCanvas';
import LeadForm from '../components/LeadForm';
import { Target, Users, Code, Award, GraduationCap, ArrowRight, Zap, Shield, Sparkles } from 'lucide-react';

const LandingPage: React.FC = () => {
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
        <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <span>Console Edition v1.0</span>
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
                  Full stack Next.js 15, Express, Prisma ORM, and PostgreSQL engine built for scale.
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

        {/* Right Side: Glass Form Card (Lg: 5 Columns) */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-2xl shadow-brand-primary/5 backdrop-blur-xl flex flex-col gap-6 relative">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-primary/20 via-brand-secondary/20 to-brand-accent/20 rounded-2xl -z-10 pointer-events-none blur-sm" />
          <div className="flex flex-col gap-1 border-b border-slate-800/60 pb-4 select-none">
            <h2 className="text-lg font-bold font-heading text-brand-white flex items-center gap-2">
              Apply For Counseling
            </h2>
            <p className="text-xs text-slate-500 font-semibold">
              Fill in your details below to evaluate your admission probability score.
            </p>
          </div>
          <LeadForm />
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
