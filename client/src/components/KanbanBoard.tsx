'use client';

// Interactive drag-and-drop Kanban Board re-ordering student cards across funnel stages
import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, Flame, Thermometer, Snowflake, ChevronRight } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  phone: string;
  city?: string | null;
  score: number;
  category: string;
  status: string;
  courseInterest?: string | null;
}

interface KanbanBoardProps {
  leads: Lead[];
  onStatusChange: (leadId: string, newStatus: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ leads, onStatusChange }) => {
  const [activeColumn, setActiveColumn] = useState<string | null>(null);

  const columns = [
    { id: 'New', title: 'New Leads', color: 'border-slate-500/20 text-slate-400 bg-slate-500/5' },
    { id: 'Contacted', title: 'Contacted', color: 'border-brand-cold/20 text-brand-cold bg-brand-cold/5' },
    { id: 'Interested', title: 'Interested', color: 'border-brand-green/20 text-brand-green bg-brand-green/5' },
    { id: 'Follow-Up', title: 'Follow-Up', color: 'border-brand-warning/20 text-brand-warning bg-brand-warning/5' },
    { id: 'Qualified', title: 'Qualified', color: 'border-brand-secondary/20 text-brand-secondary bg-brand-secondary/5' },
    { id: 'Enrolled', title: 'Enrolled', color: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' },
    { id: 'Rejected', title: 'Rejected', color: 'border-brand-danger/20 text-brand-danger bg-brand-danger/5' }
  ];

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setActiveColumn(columnId);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setActiveColumn(null);
    const leadId = e.dataTransfer.getData('text/plain');
    if (leadId) {
      onStatusChange(leadId, targetStatus);
    }
  };

  const handleDragLeave = () => {
    setActiveColumn(null);
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    Hot: <Flame className="w-3.5 h-3.5 text-brand-hot shrink-0" />,
    Warm: <Thermometer className="w-3.5 h-3.5 text-brand-warm shrink-0" />,
    Cold: <Snowflake className="w-3.5 h-3.5 text-brand-cold shrink-0" />
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 max-w-full select-none">
      {columns.map((col) => {
        const columnLeads = leads.filter((l) => l.status === col.id);
        const isTarget = activeColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
            onDragLeave={handleDragLeave}
            className={`flex-1 min-w-[260px] max-w-[320px] rounded-2xl border p-4 flex flex-col gap-4 transition-all duration-300 ${
              isTarget
                ? 'border-brand-primary/50 bg-slate-900/40 shadow-lg shadow-brand-primary/5 scale-[1.01]'
                : `${col.color} border-slate-800/80`
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider">{col.title}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-850 border border-slate-800 rounded-md">
                {columnLeads.length}
              </span>
            </div>

            {/* Column Cards Container */}
            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {columnLeads.length > 0 ? (
                columnLeads.map((lead) => {
                  const initials = lead.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                  return (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 hover:border-brand-primary/30 transition-all duration-300 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:shadow-brand-primary/5 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-brand-primary/10 text-brand-primary rounded-lg flex items-center justify-center font-bold text-xs">
                            {initials}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-200 group-hover:text-brand-white transition-colors">
                              {lead.name}
                            </h4>
                            <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider block mt-0.5">
                              {lead.courseInterest || 'Unspecified'}
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/admin/leads/${lead.id}`}
                          className="p-1 rounded-lg text-slate-500 hover:text-brand-white hover:bg-slate-800/50 transition-all shrink-0"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {/* Card Footer Info */}
                      <div className="flex items-center justify-between border-t border-slate-900/60 pt-2.5 mt-3 text-[10px] font-bold">
                        <span className="text-slate-400 font-mono tracking-tight">{lead.score} / 100</span>
                        
                        <div className="flex items-center gap-1">
                          {categoryIcons[lead.category]}
                          <span className={`${
                            lead.category === 'Hot' ? 'text-brand-hot' :
                            lead.category === 'Warm' ? 'text-brand-warm' :
                            'text-brand-cold'
                          }`}>
                            {lead.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-[10px] font-semibold text-slate-600 border border-dashed border-slate-800 rounded-xl">
                  Drag leads here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
