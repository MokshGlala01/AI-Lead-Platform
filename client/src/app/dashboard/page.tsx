'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import ThreeDHeroCanvas from '@/components/3d/ThreeDHeroCanvas';
import ScoreBadge from '@/components/ui/ScoreBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { GraduationCap, LogOut, Loader2, Sparkles, User, Mail, Calendar, Phone, Clock, FileText, CheckCircle2 } from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [statusText, setStatusText] = useState('Verifying authentication session...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setStatusText('No active session found. Redirecting to login...');
        router.replace('/login');
      } else {
        setStatusText('Retrieving lead profile...');
        fetchStudentData(session.user.email || '');
      }
    }).catch(err => {
      console.error(err);
      setError('Auth Session Retrieval Error: ' + err.message);
    });
  }, [router]);

  const fetchStudentData = async (email: string) => {
    try {
      setStatusText('Retrieving lead profile...');
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (leadError) {
        throw new Error('Leads Table Query Error: ' + leadError.message);
      }

      if (!lead) {
        setStatusText('No application profile found. Redirecting to application...');
        router.replace('/application');
        return;
      }

      // Fetch counselor separately to prevent relational query errors
      let counselor = null;
      if (lead.counselor_id) {
        setStatusText('Fetching counselor assignment...');
        const { data: cData, error: cError } = await supabase
          .from('counselors')
          .select('*')
          .eq('id', lead.counselor_id)
          .maybeSingle();
        if (cError) {
          console.error('Counselors Query Error:', cError);
        } else {
          counselor = cData;
        }
      }

      setStudent({ ...lead, counselors: counselor });

      // 2. Fetch activity log
      setStatusText('Loading activity logs...');
      const { data: logs, error: logsError } = await supabase
        .from('lead_activity')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false });

      if (logsError) {
        console.error('Lead Activity Query Error:', logsError);
      } else {
        setActivities(logs || []);
      }
    } catch (err: any) {
      console.error('Error loading student dashboard details:', err);
      setError(err.message || 'An unexpected error occurred.');
      // Wait a moment and fallback redirect
      setTimeout(() => {
        router.replace('/application');
      }, 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  // Format Date (DD MMM YYYY, HH:MM)
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${months[date.getMonth()]} ${date.getFullYear()} at ${hours}:${minutes}`;
  };

  // Pipeline helper
  const getTimelineSteps = (status: string) => {
    const steps = ['New', 'Contacted', 'Qualified', 'Enrolled'];
    const currentIndex = steps.indexOf(status);
    return steps.map((step, idx) => ({
      name: step === 'New' ? 'Application Submitted' : step === 'Contacted' ? 'Under Review' : step === 'Qualified' ? 'Qualified' : 'Successfully Enrolled',
      completed: idx <= currentIndex && status !== 'Lost' && status !== 'Rejected',
      active: idx === currentIndex && status !== 'Lost' && status !== 'Rejected',
      lost: (status === 'Lost' || status === 'Rejected') && idx === currentIndex
    }));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#050816] text-[#F9FAFB] flex flex-col items-center justify-center p-6 font-sans text-center">
        <div className="p-5 bg-brand-danger/10 border border-brand-danger/25 rounded-2xl max-w-md flex flex-col gap-3 backdrop-blur-xl relative">
          <div className="absolute -inset-[1px] bg-brand-danger/10 rounded-2xl -z-10 blur-sm" />
          <span className="text-xs font-bold text-brand-danger uppercase tracking-widest">Portal Access Error</span>
          <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
          <button
            onClick={() => router.replace('/application')}
            className="mt-4 px-4 py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 rounded-xl text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-all uppercase tracking-wider cursor-pointer"
          >
            Go to Application Form
          </button>
        </div>
      </div>
    );
  }

  if (loading || !student) {
    return (
      <div className="min-h-screen bg-[#050816] text-[#F9FAFB] flex flex-col items-center justify-center font-sans text-center gap-3">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin mb-2" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{statusText}</span>
      </div>
    );
  }

  const timelineSteps = getTimelineSteps(student?.status || 'New');

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
          <div className="flex flex-col">
            <span className="font-extrabold text-sm text-brand-white tracking-tight leading-none font-heading">
              EFOS
            </span>
            <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-550 mt-1">
              Student Dashboard
            </span>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-900 rounded-xl text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-all uppercase tracking-wider cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Side: Score & Timeline (Lg: 8 Columns) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Welcome greeting */}
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-black font-heading text-brand-white tracking-tight flex items-center gap-2">
              Welcome back, {student.name} <Sparkles className="w-5 h-5 text-brand-primary animate-pulse" />
            </h1>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Track your counseling details, qualification metrics, and outreach updates in real-time.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Score Metric Card */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden backdrop-blur-xl flex flex-col gap-4">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full -z-10 blur-xl" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Admission Score
                </span>
                <ScoreBadge score={student.score} category={student.category} />
              </div>
              <div className="flex items-end gap-1.5 mt-2">
                <span className="text-5xl font-black text-brand-white font-mono tracking-tighter leading-none">
                  {student.score}
                </span>
                <span className="text-xs font-bold text-slate-500 pb-1 uppercase tracking-wide">/ 100</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">
                Your credentials place you in the <span className="font-bold text-brand-white">{student.category}</span> applicant tier. Counselor assignment active.
              </p>
            </div>

            {/* Application Info Card */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-xl flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Application Summary
              </span>
              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex justify-between items-center border-b border-slate-800/40 pb-2">
                  <span className="text-slate-500 font-semibold">Course Interest:</span>
                  <span className="font-bold text-slate-200">{student.course_interest || 'General'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800/40 pb-2">
                  <span className="text-slate-500 font-semibold">Latest Qualification:</span>
                  <span className="font-bold text-slate-200">{student.qualification || 'Unspecified'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Status:</span>
                  <StatusBadge status={student.status} />
                </div>
              </div>
            </div>
          </div>

          {/* Stepper Timeline Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-xl flex flex-col gap-6">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Application Roadmap
            </span>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              {timelineSteps.map((step, idx) => (
                <div key={idx} className="flex flex-col gap-2 relative">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black z-10 shadow-md ${
                      step.completed
                        ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                        : step.lost
                        ? 'bg-brand-danger/10 border-brand-danger text-brand-danger'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}>
                      {step.completed && !step.active ? (
                        <CheckCircle2 className="w-4.5 h-4.5" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold ${
                        step.completed || step.active ? 'text-brand-white' : step.lost ? 'text-brand-danger' : 'text-slate-500'
                      }`}>
                        {step.name}
                      </span>
                      <span className="text-[9px] text-slate-500 font-medium">
                        {step.active ? 'Currently active' : step.completed ? 'Completed' : step.lost ? 'Rejected/Lost' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Counselor & Activity Feed (Lg: 4 Columns) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Assigned Counselor Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-xl flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-secondary/5 rounded-full -z-10 blur-xl" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Assigned Coordinator
            </span>

            {student.counselors ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-secondary/10 border border-brand-secondary/20 text-brand-secondary rounded-xl flex items-center justify-center font-black text-sm uppercase">
                    {student.counselors.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-brand-white">{student.counselors.name}</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">EFOS Coordinator</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 border-t border-slate-800/60 pt-4 text-xs font-semibold">
                  <div className="flex items-center gap-2.5 text-slate-400">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="truncate">{student.counselors.email}</span>
                  </div>
                  {student.counselors.phone && (
                    <div className="flex items-center gap-2.5 text-slate-400">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <span>{student.counselors.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 text-slate-400">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>Availability: {student.counselors.is_available ? 'Available Now' : 'Offline'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 py-2 text-center items-center justify-center">
                <User className="w-8 h-8 text-slate-600 animate-pulse" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-350">Pending Counselor Match</span>
                  <span className="text-[10px] text-slate-500 leading-relaxed max-w-[200px]">
                    Your profile is currently queued for automated counselor assignment.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Activity Log Feed */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-xl flex flex-col gap-4 flex-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/60 pb-3">
              Outreach & Updates
            </span>

            {activities.length > 0 ? (
              <div className="flex flex-col gap-4 overflow-y-auto max-h-[300px] pr-1">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3 text-xs items-start">
                    <div className="w-2 h-2 rounded-full bg-brand-primary mt-1.5 shrink-0" />
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] text-slate-300 font-semibold leading-relaxed">
                        {activity.description}
                      </p>
                      <span className="text-[9px] font-mono text-slate-500">
                        {formatDateTime(activity.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2 items-center justify-center py-12 text-slate-500 text-center flex-1">
                <FileText className="w-8 h-8 text-slate-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider mt-1">No Activity Logs</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
