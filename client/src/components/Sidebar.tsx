'use client';

// Sidebar navigation drawer containing console links and shortcut status filters
import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { LayoutDashboard, BarChart3, Tag } from 'lucide-react';

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatusFilter = searchParams.get('status');

  const statusShortcuts = [
    { label: 'New Leads', value: 'New', color: 'bg-slate-500' },
    { label: 'Contacted', value: 'Contacted', color: 'bg-brand-cold' },
    { label: 'Interested', value: 'Interested', color: 'bg-brand-green' },
    { label: 'Follow-Up', value: 'Follow-Up', color: 'bg-brand-warning' },
    { label: 'Qualified', value: 'Qualified', color: 'bg-brand-secondary' },
    { label: 'Enrolled', value: 'Enrolled', color: 'bg-emerald-500' },
    { label: 'Rejected', value: 'Rejected', color: 'bg-brand-danger' }
  ];

  const isDashboardActive = pathname === '/dashboard' && !currentStatusFilter;
  const isAnalyticsActive = pathname === '/dashboard/analytics';

  return (
    <aside className="w-60 border-r border-slate-800/80 bg-slate-950 min-h-[calc(100vh-64px)] p-4 flex flex-col justify-between hidden md:flex shrink-0">
      {/* Navigation Group */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 px-3">
            Navigation Menu
          </span>
          
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isDashboardActive
                ? 'bg-brand-primary/10 text-brand-primary font-extrabold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          
          <Link
            href="/dashboard/analytics"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isAnalyticsActive
                ? 'bg-brand-primary/10 text-brand-primary font-extrabold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Link>
        </div>

        {/* Shortcuts Group */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 px-3 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-500" />
            Status Shortcuts
          </span>
          <div className="flex flex-col gap-0.5">
            {statusShortcuts.map((shortcut) => {
              const isActive = currentStatusFilter === shortcut.value;
              return (
                <Link
                  key={shortcut.value}
                  href={`/dashboard?status=${shortcut.value}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-brand-white font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${shortcut.color}`}></span>
                    {shortcut.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="border-t border-slate-800/80 pt-4 text-center select-none">
        <span className="text-[9px] font-extrabold text-slate-600 uppercase tracking-widest block">
          EFOS SaaS Platform
        </span>
        <span className="text-[8px] font-extrabold text-slate-700 uppercase tracking-widest block mt-0.5">
          v1.0.0 — Enterprise
        </span>
      </div>
    </aside>
  );
};

export default Sidebar;
