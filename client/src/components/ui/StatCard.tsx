// Renders a high-fidelity key metric widget with glowing borders and hover elevation
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  trend?: {
    value: string;
    label: string;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color = 'blue', trend }) => {
  const colorMaps: Record<string, { bg: string; text: string; shadow: string }> = {
    blue: {
      bg: 'bg-brand-cold/5 border-brand-cold/20',
      text: 'text-brand-cold',
      shadow: 'hover:shadow-brand-cold/5'
    },
    red: {
      bg: 'bg-brand-danger/5 border-brand-danger/20',
      text: 'text-brand-danger',
      shadow: 'hover:shadow-brand-danger/5'
    },
    orange: {
      bg: 'bg-brand-warm/5 border-brand-warm/20',
      text: 'text-brand-warm',
      shadow: 'hover:shadow-brand-warm/5'
    },
    green: {
      bg: 'bg-brand-green/5 border-brand-green/20',
      text: 'text-brand-green',
      shadow: 'hover:shadow-brand-green/5'
    },
    purple: {
      bg: 'bg-brand-secondary/5 border-brand-secondary/20',
      text: 'text-brand-secondary',
      shadow: 'hover:shadow-brand-secondary/5'
    },
    slate: {
      bg: 'bg-slate-500/5 border-slate-500/20',
      text: 'text-slate-400',
      shadow: 'hover:shadow-slate-500/5'
    }
  };

  const style = colorMaps[color] || colorMaps.blue;

  return (
    <div className={`bg-slate-900/60 p-5 rounded-2xl border ${style.bg} transition-all duration-300 hover:shadow-xl ${style.shadow} hover:-translate-y-0.5 flex items-center justify-between backdrop-blur-md`}>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <span className="text-2xl font-bold text-brand-white font-mono tracking-tight">{value}</span>
        
        {trend && (
          <div className="flex items-center gap-1 mt-0.5 select-none">
            <span className={`text-[10px] font-extrabold ${trend.isPositive ? 'text-brand-green' : 'text-slate-500'}`}>
              {trend.value}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              {trend.label}
            </span>
          </div>
        )}
      </div>

      <div className={`p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center ${style.text}`}>
        <Icon className="w-5.5 h-5.5 stroke-[2]" />
      </div>
    </div>
  );
};

export default StatCard;
