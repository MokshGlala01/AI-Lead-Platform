'use client';

// Top Navbar header with branding logos, keyboard shortcut indications, alerts bell, and modal popups
import React from 'react';
import Link from 'next/link';
import { GraduationCap, Bell, Plus, Search, LogOut } from 'lucide-react';
import { signOut } from '@/lib/auth';

interface NavbarProps {
  onAddLeadClick: () => void;
  hotCount?: number;
}

const Navbar: React.FC<NavbarProps> = ({ onAddLeadClick, hotCount = 0 }) => {
  return (
    <nav className="h-16 border-b border-slate-800/80 bg-brand-bg/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 group">
        <div className="p-2 bg-brand-primary rounded-xl text-white shadow-lg shadow-brand-primary/20 group-hover:scale-105 transition-transform">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-base text-brand-white tracking-tight leading-none font-heading">
            EFOS
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 mt-1">
            Console SaaS
          </span>
        </div>
      </Link>

      {/* Control Actions */}
      <div className="flex items-center gap-4">
        {/* Spotlight search hint */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-500 font-semibold select-none">
          <Search className="w-3.5 h-3.5" />
          <span>Press</span>
          <kbd className="font-mono bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-[10px]">Ctrl+K</kbd>
        </div>

        {/* Hot Leads Bell alert */}
        <div className="relative cursor-pointer p-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800/80 text-slate-400 hover:text-brand-primary transition-all">
          <Bell className="w-4.5 h-4.5" />
          {hotCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-brand-danger text-[9px] font-black text-brand-white rounded-full flex items-center justify-center animate-bounce shadow-md shadow-brand-danger/30">
              {hotCount}
            </span>
          )}
        </div>

        {/* Add Student CTA */}
        <button
          onClick={onAddLeadClick}
          className="inline-flex items-center gap-1.5 bg-brand-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-brand-primary/95 shadow-lg shadow-brand-primary/10 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Add Student
        </button>

        {/* Sign Out Action */}
        <button
          onClick={async () => {
            try {
              await signOut();
            } catch (err) {
              console.error('Logout error:', err);
            }
          }}
          className="p-2.5 bg-slate-950 border border-slate-800/80 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-brand-danger transition-all"
          title="Sign Out"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
