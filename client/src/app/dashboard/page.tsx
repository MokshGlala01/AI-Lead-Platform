'use client';

// Main dashboard console page supporting searching, filters, KPI aggregates, and layout mode toggling (Table vs Kanban)
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDashboard } from './layout';
import axios from 'axios';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import ScoreBadge from '../../components/ui/ScoreBadge';
import KanbanBoard from '../../components/KanbanBoard';
import { Users, Flame, Thermometer, Snowflake, Search, Filter, X, Table, Columns, Eye } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

interface Lead {
  id: string;
  name: string;
  phone: string;
  city?: string | null;
  score: number;
  category: string;
  status: string;
  courseInterest?: string | null;
  source: string;
  createdAt: string;
}

const DashboardContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status') || '';

  // Context hook
  const { setHotCount, refreshTrigger } = useDashboard();

  // Component states
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table'); // table or kanban board
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(statusParam);
  const [courseFilter, setCourseFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  // Sorting state
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Stats summaries
  const [stats, setStats] = useState({
    total: 0,
    hot: 0,
    warm: 0,
    cold: 0
  });

  // Sync route statusParam changes
  useEffect(() => {
    setStatusFilter(statusParam);
    setPage(1);
  }, [statusParam]);

  // Debounced search trigger (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch leads API
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const apiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || '');
      const params = {
        search: debouncedSearch,
        status: statusFilter || undefined,
        course_interest: courseFilter || undefined,
        category: categoryFilter || undefined,
        source: sourceFilter || undefined,
        sort: sortField,
        order: sortOrder,
        page: viewMode === 'kanban' ? 1 : page, // Fetch more for kanban to display columns accurately
        limit: viewMode === 'kanban' ? 100 : 20
      };

      const response = await axios.get(apiUrl + '/api/leads', { params });
      setLeads(response.data.leads || []);
      setTotal(response.data.total || 0);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      console.error('Error querying leads:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch metrics API
  const fetchSummaryStats = async () => {
    try {
      const apiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || '');
      const response = await axios.get(apiUrl + '/api/analytics/summary');
      setStats({
        total: response.data.total || 0,
        hot: response.data.hot || 0,
        warm: response.data.warm || 0,
        cold: response.data.cold || 0
      });

      const statusBreakdown = response.data.statusBreakdown || {};
      const newHotCount = statusBreakdown['New'] || 0;
      setHotCount(newHotCount);
    } catch (err) {
      console.error('Error fetching statistics aggregates:', err);
    }
  };

  // Trigger reloads on state edits or layout context refreshTrigger changes
  useEffect(() => {
    fetchLeads();
  }, [debouncedSearch, statusFilter, courseFilter, categoryFilter, sourceFilter, sortField, sortOrder, page, viewMode, refreshTrigger]);

  useEffect(() => {
    fetchSummaryStats();
  }, [refreshTrigger]);

  const fetchLeadsRef = React.useRef(fetchLeads);
  fetchLeadsRef.current = fetchLeads;
  const fetchSummaryStatsRef = React.useRef(fetchSummaryStats);
  fetchSummaryStatsRef.current = fetchSummaryStats;

  // Subscribe to realtime database changes for automatic dashboard updates
  useEffect(() => {
    const channel = supabase
      .channel('leads-realtime-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        () => {
          fetchLeadsRef.current();
          fetchSummaryStatsRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const apiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || '');
      await axios.patch(apiUrl + '/api/leads/' + leadId + '/status', { status: newStatus });
      fetchLeads();
      fetchSummaryStats();
    } catch (err) {
      console.error('Failed to change status inline:', err);
    }
  };

  const clearAllFilters = () => {
    setSearch('');
    setStatusFilter('');
    setCourseFilter('');
    setCategoryFilter('');
    setSourceFilter('');
    router.replace('/dashboard');
    setPage(1);
  };

  const hasFilters = debouncedSearch || statusFilter || courseFilter || categoryFilter || sourceFilter;

  // Format Date (DD MMM YYYY)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Title & View Switcher Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold font-heading text-brand-white">Console Board</h1>
          <span className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
            {total} leads
          </span>
        </div>

        {/* Layout selector (Table list vs Kanban Columns) */}
        <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex gap-1 self-start sm:self-auto shadow-inner">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'table' ? 'bg-brand-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-350'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Table View
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'kanban' ? 'bg-brand-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-350'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            Kanban Board
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <StatCard title="Total Leads" value={stats.total} icon={Users} color="blue" />
        <StatCard title="Hot Leads" value={stats.hot} icon={Flame} color="red" />
        <StatCard title="Warm Leads" value={stats.warm} icon={Thermometer} color="orange" />
        <StatCard title="Cold Leads" value={stats.cold} icon={Snowflake} color="blue" />
      </div>

      {/* Filters Dashboard */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md flex flex-col gap-4">
        {/* Spotlight Search and Clear Control */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Fuzzy search name, email, or phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-brand-primary text-brand-white transition-all placeholder:text-slate-600"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {hasFilters && (
            <button
              onClick={clearAllFilters}
              className="px-4.5 py-2.5 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 self-stretch md:self-auto transition-all"
            >
              <Filter className="w-3.5 h-3.5" />
              Clear Filter
            </button>
          )}
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
          {/* Status */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest px-0.5">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-850 text-xs font-bold rounded-xl text-slate-300 focus:outline-none focus:border-brand-primary transition-all"
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Interested">Interested</option>
              <option value="Follow-Up">Follow-Up</option>
              <option value="Qualified">Qualified</option>
              <option value="Enrolled">Enrolled</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Course */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest px-0.5">Course</span>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-850 text-xs font-bold rounded-xl text-slate-300 focus:outline-none focus:border-brand-primary transition-all"
            >
              <option value="">All Courses</option>
              <option value="BTech">BTech</option>
              <option value="MBA">MBA</option>
              <option value="BCA">BCA</option>
              <option value="MCA">MCA</option>
              <option value="Diploma">Diploma</option>
              <option value="BBA">BBA</option>
            </select>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest px-0.5">Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-850 text-xs font-bold rounded-xl text-slate-300 focus:outline-none focus:border-brand-primary transition-all"
            >
              <option value="">All Categories</option>
              <option value="Hot">Hot</option>
              <option value="Warm">Warm</option>
              <option value="Cold">Cold</option>
            </select>
          </div>

          {/* Source */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest px-0.5">Source</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-850 text-xs font-bold rounded-xl text-slate-300 focus:outline-none focus:border-brand-primary transition-all"
            >
              <option value="">All Sources</option>
              <option value="Website">Website</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Google Forms">Google Forms</option>
              <option value="Meta Ads">Meta Ads</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area: Kanban vs Table Layout */}
      {viewMode === 'kanban' ? (
        <KanbanBoard leads={leads} onStatusChange={handleStatusChange} />
      ) : (
        /* Table Layout view */
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 backdrop-blur-md overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-850 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Qualification</th>
                  <th className="px-6 py-4">Lead Score</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Added</th>
                  <th className="px-6 py-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-xs font-medium text-slate-350">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse h-16">
                      <td colSpan={9} className="px-6 py-4 bg-slate-900/10" />
                    </tr>
                  ))
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-500 font-bold uppercase tracking-wider">
                      No leads match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-200">
                        {lead.name}
                        <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">{lead.city || 'Unknown City'}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400">{lead.phone}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-950 border border-slate-850 px-2 py-0.5 rounded font-bold">{lead.courseInterest || 'General'}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{lead.qualification || 'Unspecified'}</td>
                      <td className="px-6 py-4">
                        <ScoreBadge score={lead.score} category={lead.category} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={lead.status} onChange={(s) => handleStatusChange(lead.id, s)} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-950 border border-slate-850/80 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{formatDate(lead.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/leads/${lead.id}`}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-slate-950 border border-transparent hover:border-slate-800 transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table pagination footer */}
          <div className="px-6 py-4 border-t border-slate-850 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
              {total > 0 ? `Showing ${(page - 1) * 20 + 1}–${Math.min(page * 20, total)} of ${total} leads` : '0 leads'}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 text-[10px] font-bold text-slate-400 bg-slate-950 border border-slate-850 hover:bg-slate-900 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-slate-400 px-3">
                Page {page} of {totalPages || 1}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 text-[10px] font-bold text-slate-400 bg-slate-950 border border-slate-850 hover:bg-slate-900 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <svg className="w-8 h-8 text-brand-primary animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Dashboard...</span>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
