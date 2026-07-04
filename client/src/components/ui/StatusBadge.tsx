// Displays colored badges representing student status with optional select capability
import React from 'react';

interface StatusBadgeProps {
  status: string;
  onChange?: (newStatus: string) => void;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = 'New', onChange }) => {
  const styles: Record<string, string> = {
    'New': 'bg-slate-500/10 text-slate-400 border-slate-500/25',
    'Contacted': 'bg-brand-cold/10 text-brand-cold border-brand-cold/25',
    'Interested': 'bg-brand-green/10 text-brand-green border-brand-green/25',
    'Follow-Up': 'bg-brand-warning/10 text-brand-warning border-brand-warning/25',
    'Qualified': 'bg-brand-secondary/10 text-brand-secondary border-brand-secondary/25',
    'Enrolled': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    'Rejected': 'bg-brand-danger/10 text-brand-danger border-brand-danger/25',
  };

  const currentStyle = styles[status] || styles['New'];
  const statuses = ['New', 'Contacted', 'Interested', 'Follow-Up', 'Qualified', 'Enrolled', 'Rejected'];

  if (onChange) {
    return (
      <div className="relative inline-block select-none">
        <select
          value={status}
          onChange={(e) => onChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className={`appearance-none px-3 py-1 pr-6 text-[10px] font-bold rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-primary bg-slate-950 transition-all ${currentStyle} uppercase tracking-wider`}
        >
          {statuses.map((s) => (
            <option key={s} value={s} className="bg-slate-900 text-brand-white font-normal capitalize">
              {s}
            </option>
          ))}
        </select>
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] opacity-75">
          ▼
        </span>
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wider ${currentStyle}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
