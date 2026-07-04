'use client';

// Routing page wrapper for single student profile detail view fetching database objects
import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import LeadDetail from '../../../../components/LeadDetail';
import StatusBadge from '../../../../components/ui/StatusBadge';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';

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
}

const LeadDetailPageContent: React.FC = () => {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  // Component states
  const [lead, setLead] = useState<any>(null);
  const [counselors, setCounselors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [assigning, setAssigning] = useState(false);
  const [rescoring, setRescoring] = useState(false);

  // Fetch full details
  const fetchLeadDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const apiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || '');
      const leadRes = await axios.get(apiUrl + '/api/leads/' + id);
      setLead(leadRes.data);

      const counselorsRes = await axios.get(apiUrl + '/api/counselors');
      setCounselors(counselorsRes.data || []);
    } catch (err) {
      console.error('Error fetching lead profile details:', err);
      setError('Lead not found or database sync failure.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchLeadDetails();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const apiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || '');
      const res = await axios.patch(apiUrl + '/api/leads/' + id + '/status', { status: newStatus });
      setLead((prev: any) => ({ ...prev, status: res.data.status }));
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const handleNotesSave = async (newNotes: string) => {
    try {
      const apiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || '');
      const res = await axios.patch(apiUrl + '/api/leads/' + id + '/notes', { notes: newNotes });
      setLead((prev: any) => ({ ...prev, notes: res.data.notes }));
    } catch (err) {
      console.error('Failed to update notes:', err);
      throw err;
    }
  };

  const handleAssignCounselor = async (counselorId: string) => {
    setAssigning(true);
    try {
      const apiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || '');
      await axios.post(apiUrl + '/api/counselors/' + counselorId + '/assign/' + id);
      // Refresh lead profiles
      const leadRes = await axios.get(apiUrl + '/api/leads/' + id);
      setLead(leadRes.data);
    } catch (err) {
      console.error('Failed to manually assign counselor:', err);
    } finally {
      setAssigning(false);
    }
  };

  const handleRescore = async () => {
    setRescoring(true);
    try {
      const apiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || '');
      await axios.post(apiUrl + '/api/leads/' + id + '/rescore');
      // Reload full data
      const leadRes = await axios.get(apiUrl + '/api/leads/' + id);
      setLead(leadRes.data);
    } catch (err) {
      console.error('Failed to rescore lead profile:', err);
    } finally {
      setRescoring(false);
    }
  };


  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) return;
    try {
      const apiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || '');
      await axios.delete(apiUrl + '/api/leads/' + id);
      router.push('/admin');
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Compiling Profile...</span>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-xs font-bold text-brand-danger uppercase tracking-widest">{error || 'Lead Profile Not Found'}</p>
        <Link href="/admin" className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1.5 uppercase tracking-wider">
          <ArrowLeft className="w-4 h-4" /> Back to admin portal
        </Link>
      </div>
    );
  }

  const initials = lead.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Detail Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 bg-slate-950 border border-slate-850 hover:bg-slate-900 rounded-xl shadow-sm text-slate-500 hover:text-slate-300 transition-all"
            title="Back to Admin Portal"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center font-black text-sm border border-brand-primary/10">
              {initials}
            </div>
            <div>
              <h1 className="text-lg font-bold font-heading text-brand-white leading-tight">
                {lead.name}
              </h1>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                ID: {lead.id.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>

        {/* Funnel selector badge & Delete */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Stage:
            </span>
            <StatusBadge status={lead.status} onChange={handleStatusChange} />
          </div>

          <button
            onClick={handleDelete}
            className="p-2 bg-slate-950 border border-slate-850 hover:bg-brand-danger/10 hover:border-brand-danger/30 rounded-xl text-slate-500 hover:text-brand-danger transition-all"
            title="Delete Lead (Admin Only)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Profile Details Template */}
      <LeadDetail
        lead={lead}
        counselors={counselors}
        onStatusChange={handleStatusChange}
        onNotesSave={handleNotesSave}
        onAssignCounselor={handleAssignCounselor}
        onRescore={handleRescore}
        onMessageLogged={(newMsg) => {
          setLead((prev: any) => ({
            ...prev,
            messages: [newMsg, ...(prev.messages || [])]
          }));
        }}
        rescoring={rescoring}
        assigning={assigning}
      />
    </div>
  );
};

export default function LeadDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Lead...</span>
        </div>
      }
    >
      <LeadDetailPageContent />
    </Suspense>
  );
}
