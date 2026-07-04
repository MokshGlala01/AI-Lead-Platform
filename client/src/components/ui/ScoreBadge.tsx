// Displays lead qualification scores with custom SVG rings in the luxury dark styling
import React from 'react';

interface ScoreBadgeProps {
  score: number;
  category: string;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score = 0, category = 'Cold' }) => {
  let ringColor = 'stroke-brand-cold';
  let bgColor = 'bg-brand-cold/10';
  let textColor = 'text-brand-cold border-brand-cold/25';

  if (category === 'Hot' || score >= 71) {
    ringColor = 'stroke-brand-hot';
    bgColor = 'bg-brand-hot/10';
    textColor = 'text-brand-hot border-brand-hot/25';
  } else if (category === 'Warm' || score >= 41) {
    ringColor = 'stroke-brand-warm';
    bgColor = 'bg-brand-warm/10';
    textColor = 'text-brand-warm border-brand-warm/25';
  }

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="20"
            cy="20"
            r={radius}
            className="stroke-slate-800 fill-none"
            strokeWidth="3"
          />
          <circle
            cx="20"
            cy="20"
            r={radius}
            className={`fill-none ${ringColor} transition-all duration-500 ease-out`}
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-xs font-bold text-brand-white font-mono">{score}</span>
      </div>

      <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full border ${bgColor} ${textColor} uppercase tracking-wider`}>
        {category}
      </span>
    </div>
  );
};

export default ScoreBadge;
