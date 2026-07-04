'use client';

// Detailed Lead Profile component displaying score parameters, auto-saving notes, and AI message tabs
import React, { useState } from 'react';
import axios from 'axios';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  GraduationCap,
  Sparkles,
  Copy,
  Check,
  Send,
  Loader2,
  UserCheck,
  ClipboardList,
  MessageSquare,
  RefreshCw,
  Flame,
  Thermometer,
  Snowflake
} from 'lucide-react';
import StatusBadge from './ui/StatusBadge';

interface Message {
  id: string;
  channel: string;
  content: string;
  sentAt: string;
  status: string;
}

interface Counselor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  isAvailable: boolean;
  totalAssigned: number;
}

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  city: string | null;
  qualification: string | null;
  source: string;
  courseInterest: string | null;
  age: number | null;
  downloadedBrochure: boolean;
  websiteVisits: number;
  score: number;
  category: string;
  status: string;
  notes: string | null;
  createdAt: string;
  counselorId: string | null;
  counselor?: Counselor | null;
  messages?: Message[];
  aiRecommendation?: string | null;
}

interface LeadDetailProps {
  lead: Lead;
  counselors: Counselor[];
  onStatusChange: (newStatus: string) => void;
  onNotesSave: (newNotes: string) => Promise<void>;
  onAssignCounselor: (counselorId: string) => Promise<void>;
  onRescore: () => Promise<void>;
  onMessageLogged: (newMsg: Message) => void;
  rescoring?: boolean;
  assigning?: boolean;
}

const LeadDetail: React.FC<LeadDetailProps> = ({
  lead,
  counselors = [],
  onStatusChange,
  onNotesSave,
  onAssignCounselor,
  onRescore,
  onMessageLogged,
  rescoring = false,
  assigning = false
}) => {
  const [notes, setNotes] = useState(lead.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [selectedCounselorId, setSelectedCounselorId] = useState('');
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [sentStatus, setSentStatus] = useState<'', 'Sending', 'Sent'>('');

  const handleNotesBlur = async () => {
    if (notes === (lead.notes || '')) return;
    setSavingNotes(true);
    try {
      await onNotesSave(notes);
    } catch (err) {
      console.error('Notes auto-save failed:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCounselorId) return;
    try {
      await onAssignCounselor(selectedCounselorId);
      setSelectedCounselorId('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedContent('');
    setSentStatus('');
    try {
      const apiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || '');
      const response = await axios.post(apiUrl + '/api/messages/generate', {
        lead_id: lead.id,
        channel: activeTab
      });
      setGeneratedContent(response.data.content);
    } catch (err) {
      console.error('AI message generation failed:', err);
      setGeneratedContent('Failed to draft copy. Please verify AI configuration.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkAsSent = () => {
    setSentStatus('Sending');
    setTimeout(() => {
      setSentStatus('Sent');
      onMessageLogged({
        id: 'temp-' + Date.now(),
        channel: activeTab,
        content: generatedContent,
        sentAt: new Date().toISOString(),
        status: 'Sent'
      });
    }, 800);
  };

  // Score breakdown calculations
  const getScoreBreakdown = (l: Lead) => {
    const breakdown = [];
    const course = (l.courseInterest || '').toLowerCase();
    if (['btech', 'mba', 'bca', 'mca'].includes(course)) {
      breakdown.push({ label: 'Interest: high-tier course', value: '+20' });
    } else if (['diploma', 'bba'].includes(course)) {
      breakdown.push({ label: 'Interest: mid-tier course', value: '+10' });
    }

    const qual = (l.qualification || '').toLowerCase();
    if (qual.includes('12th')) {
      breakdown.push({ label: 'Education: 12th standard', value: '+20' });
    } else if (qual.includes('graduate')) {
      breakdown.push({ label: 'Education: Graduate degree', value: '+15' });
    } else if (qual.includes('10th')) {
      breakdown.push({ label: 'Education: 10th standard', value: '+5' });
    }

    const age = Number(l.age);
    if (!isNaN(age)) {
      if (age >= 16 && age <= 18) {
        breakdown.push({ label: 'Age: 16–18 years (Peak)', value: '+25' });
      } else if (age >= 19 && age <= 22) {
        breakdown.push({ label: 'Age: 19–22 years (High)', value: '+15' });
      } else if (age >= 23 && age <= 26) {
        breakdown.push({ label: 'Age: 23–26 years (Mid)', value: '+5' });
      }
    }

    if (l.downloadedBrochure) {
      breakdown.push({ label: 'Engagement: brochure download', value: '+15' });
    }
    const visits = Number(l.websiteVisits);
    if (visits > 3) {
      breakdown.push({ label: 'Engagement: >3 visits', value: '+20' });
    }

    return breakdown;
  };

  const scoreBreakdown = getScoreBreakdown(lead);
  const initials = lead.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const categoryIcons: Record<string, React.ReactNode> = {
    Hot: <Flame className="w-5 h-5 text-brand-hot" />,
    Warm: <Thermometer className="w-5 h-5 text-brand-warm" />,
    Cold: <Snowflake className="w-5 h-5 text-brand-cold" />
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN: Student details, assignments, notes (Lg: 7 columns) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        {/* Core details */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md flex flex-col gap-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/60 pb-3 select-none">
            Student Profile
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">Email</div>
                <div className="text-slate-200 mt-0.5">{lead.email || 'Unspecified'}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-500">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">Phone</div>
                <div className="text-slate-200 mt-0.5">{lead.phone}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-500">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">City</div>
                <div className="text-slate-200 mt-0.5">{lead.city || 'Unspecified'}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-500">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">Age</div>
                <div className="text-slate-200 mt-0.5">{lead.age || 'Unspecified'} years</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-500">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">Course Interest</div>
                <div className="text-slate-200 mt-0.5">{lead.courseInterest || 'Unspecified'}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-500">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">Qualification</div>
                <div className="text-slate-200 mt-0.5">{lead.qualification || 'Unspecified'}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-500">
                <ClipboardList className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">Lead Source</div>
                <div className="text-slate-200 mt-0.5">{lead.source}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-500">
                <ClipboardList className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">Engagement</div>
                <div className="flex flex-wrap gap-1 mt-1 text-[9px] font-bold">
                  {lead.downloadedBrochure ? (
                    <span className="bg-brand-green/15 text-brand-green border border-brand-green/20 px-2 py-0.5 rounded uppercase">Brochure Downloaded</span>
                  ) : (
                    <span className="bg-slate-900 text-slate-500 border border-slate-850 px-2 py-0.5 rounded uppercase">No Brochure</span>
                  )}
                  <span className="bg-slate-900 text-slate-450 border border-slate-850 px-2 py-0.5 rounded uppercase">
                    {lead.websiteVisits} visit{lead.websiteVisits > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Counselor */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md flex flex-col gap-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 select-none">
            <UserCheck className="w-4.5 h-4.5 text-slate-500" />
            Admissions Counselor
          </h2>

          {lead.counselor ? (
            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in text-xs">
              <div className="flex flex-col gap-1 font-semibold">
                <div className="font-extrabold text-slate-200">{lead.counselor.name}</div>
                <div className="text-slate-500 flex items-center gap-3 mt-1.5 font-bold">
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{lead.counselor.email || '-'}</span>
                  <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{lead.counselor.phone || '-'}</span>
                </div>
              </div>
              <div className="text-[10px] font-extrabold text-brand-green bg-brand-green/10 px-2.5 py-1 rounded-lg border border-brand-green/20 self-start sm:self-auto uppercase tracking-wider">
                Coordinator Active
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-slate-950/60 border border-slate-850 border-dashed rounded-xl text-xs text-slate-500 font-semibold select-none">
                No admissions coordinator has been assigned to this lead.
              </div>
              
              <form onSubmit={handleAssign} className="flex items-center gap-3 select-none">
                <select
                  value={selectedCounselorId}
                  onChange={(e) => setSelectedCounselorId(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-xs font-bold rounded-xl text-slate-350 focus:outline-none focus:border-brand-primary"
                >
                  <option value="">Select counselor to assign...</option>
                  {counselors
                    .filter((c) => c.isAvailable)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.totalAssigned} assigned)
                      </option>
                    ))}
                </select>
                <button
                  type="submit"
                  disabled={assigning || !selectedCounselorId}
                  className="bg-brand-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-brand-primary/95 shadow-lg shadow-brand-primary/10 transition-all disabled:opacity-50"
                >
                  {assigning ? 'Assigning...' : 'Assign'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Notes edit */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 select-none">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Admission Remarks
            </h2>
            {savingNotes && (
              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest animate-pulse">
                Auto-saving...
              </span>
            )}
          </div>
          <textarea
            placeholder="Write comments or follow-up notes... (Focus outside to auto-save)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            className="w-full min-h-[120px] p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-brand-primary transition-all text-slate-350"
          />
        </div>
      </div>

      {/* RIGHT COLUMN: Scoring & AI Messenger (Lg: 5 columns) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* Lead Score Card */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 select-none">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Scoring Diagnostics
            </h2>
            <button
              onClick={onRescore}
              disabled={rescoring}
              title="Force rescore"
              className="p-1.5 text-slate-500 hover:text-brand-primary hover:bg-slate-950 rounded-lg border border-transparent hover:border-slate-800 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${rescoring ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-950 border border-slate-850 rounded-2xl flex flex-col items-center justify-center shrink-0">
              <span className="text-2xl font-bold tracking-tight text-brand-white font-mono leading-none">
                {lead.score}
              </span>
              <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-500 mt-1.5">
                Rating
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 font-extrabold text-brand-white text-xs select-none uppercase tracking-wider">
                {categoryIcons[lead.category] || categoryIcons.Cold}
                {lead.category} Lead
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Lead probability calculated dynamically from interest brackets and downloads.
              </p>
            </div>
          </div>

          {scoreBreakdown.length > 0 && (
            <div className="flex flex-col gap-2 bg-slate-950 border border-slate-850 p-4 rounded-xl select-none">
              <div className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">
                Scoring Variables:
              </div>
              {scoreBreakdown.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px] font-bold text-slate-450">
                  <span>{item.label}</span>
                  <span className="font-mono text-brand-primary">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Recommendations Diagnostics Card */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full -z-10 blur-xl" />
          <div className="flex items-center justify-between select-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              AI Qualification Insight
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-[9px] font-bold text-brand-primary uppercase tracking-wider select-none animate-pulse">
              <Sparkles className="w-3 h-3" />
              Qualified Recommendation
            </div>
          </div>

          <div className="flex flex-col gap-2 bg-slate-950 border border-slate-850 p-4 rounded-xl">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 select-none">
              AI Suggestion
            </span>
            <p className="text-xs text-slate-300 font-semibold leading-relaxed font-sans">
              "{lead.aiRecommendation || 'Evaluation complete. Student fits standard profile requirements.'}"
            </p>
          </div>
        </div>

        {/* AI Drafting System */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 backdrop-blur-md overflow-hidden flex flex-col">
          <div className="bg-slate-950/40 border-b border-slate-850 px-4 pt-4 flex flex-col gap-3">
            <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 px-1 select-none">
              <Sparkles className="w-3.5 h-3.5 text-brand-secondary fill-brand-secondary/20" />
              AI Copywriter
            </h2>

            <div className="flex gap-1 border-b border-slate-850 select-none">
              {(['whatsapp', 'email', 'sms'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setGeneratedContent('');
                    setSentStatus('');
                  }}
                  className={`px-4 py-2.5 text-[10px] font-bold capitalize transition-all border-b-2 -mb-[2px] ${
                    activeTab === tab
                      ? 'border-brand-primary text-brand-primary font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-350'
                  }`}
                >
                  {tab === 'whatsapp' ? 'WhatsApp' : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 flex flex-col gap-4">
            {generatedContent ? (
              <div className="flex flex-col gap-3 animate-fade-in">
                <textarea
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  rows={6}
                  className="w-full p-4 bg-slate-950 border border-slate-850 rounded-xl text-xs focus:outline-none focus:border-brand-primary transition-all text-slate-300 font-medium leading-relaxed"
                />
                <div className="flex items-center gap-3 select-none">
                  <button
                    onClick={handleCopy}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-[10px] font-extrabold py-2.5 rounded-xl transition-all uppercase tracking-wider"
                  >
                    {copied ? (
                      <><Check className="w-3.5 h-3.5 text-brand-green" />Copied!</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" />Copy Draft</>
                    )}
                  </button>
                  
                  <button
                    onClick={handleMarkAsSent}
                    disabled={sentStatus === 'Sent'}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-brand-primary hover:bg-brand-primary/95 text-white text-[10px] font-extrabold py-2.5 rounded-xl shadow-lg shadow-brand-primary/10 transition-all disabled:opacity-75 uppercase tracking-wider"
                  >
                    {sentStatus === 'Sending' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : sentStatus === 'Sent' ? (
                      <><Check className="w-3.5 h-3.5" />Logged</>
                    ) : (
                      <><Send className="w-3.5 h-3.5" />Mark Sent</>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-xl gap-3 select-none">
                <div className="p-3 bg-brand-secondary/10 text-brand-secondary rounded-full border border-brand-secondary/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Generate AI Pitch</h3>
                  <p className="text-[10px] text-slate-500 font-semibold max-w-[200px] mt-1 leading-normal">
                    Draft a customized, conversion-optimized counseling {activeTab}.
                  </p>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="inline-flex items-center gap-1.5 bg-brand-primary text-white text-[10px] font-extrabold px-4 py-2.5 rounded-xl hover:bg-brand-primary/95 shadow-lg shadow-brand-primary/10 transition-all disabled:opacity-50 mt-1 uppercase tracking-wider"
                >
                  {generating ? (
                    <><Loader2 className="w-3 h-3 animate-spin" />Drafting...</>
                  ) : (
                    'Generate Copy'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Messages Logs History */}
          <div className="border-t border-slate-850 p-5 flex flex-col gap-4 bg-slate-950/20">
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 px-0.5 select-none">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              Campaign Logs History
            </h3>

            {lead.messages && lead.messages.length > 0 ? (
              <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
                {lead.messages.map((msg, index) => (
                  <div key={msg.id || index} className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 flex flex-col gap-2 animate-fade-in text-xs">
                    <div className="flex items-center justify-between text-[9px] font-extrabold uppercase tracking-wider text-slate-550 select-none">
                      <span className={`px-2 py-0.5 rounded ${
                        msg.channel === 'whatsapp' ? 'bg-brand-green/10 text-brand-green border border-brand-green/20' :
                        msg.channel === 'email' ? 'bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20' :
                        'bg-brand-cold/10 text-brand-cold border border-brand-cold/20'
                      }`}>
                        {msg.channel === 'whatsapp' ? 'WhatsApp' : msg.channel}
                      </span>
                      <span>{new Date(msg.sentAt).toLocaleString()}</span>
                    </div>
                    <p className="font-semibold text-slate-400 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 font-semibold text-center py-4 bg-slate-950/40 rounded-xl border border-slate-850 border-dashed select-none">
                No logs recorded for this lead yet.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LeadDetail;
