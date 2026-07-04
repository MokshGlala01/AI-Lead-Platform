'use client';

// Funnel statistics page utilizing Recharts plotting vectors customized for the luxury dark theme style
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatCard from '../../../components/ui/StatCard';
import { Users, Flame, UserCheck, Award, TrendingUp, BarChart3, Loader2 } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';

interface SummaryData {
  total: number;
  hot: number;
  warm: number;
  cold: number;
  qualified: number;
  enrolled: number;
  conversionRate: string;
  sourceBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  courseBreakdown: Record<string, number>;
}

interface DailyTrend {
  date: string;
  label: string;
  count: number;
}

const AnalyticsPage: React.FC = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [dailyData, setDailyData] = useState<DailyTrend[]>([]);
  const [loading, setLoading] = useState(true);

  // Gradient neon custom colors for charts
  const CHART_COLORS = ['#6366F1', '#8B5CF6', '#00E5FF', '#14F195', '#FACC15', '#EF4444'];

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const apiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || '');
      const [summaryRes, dailyRes] = await Promise.all([
        axios.get(apiUrl + '/api/analytics/summary'),
        axios.get(apiUrl + '/api/analytics/daily')
      ]);
      setSummary(summaryRes.data);
      setDailyData(dailyRes.data || []);
    } catch (err) {
      console.error('Error fetching analytics details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-heading">Compiling Funnel Analytics...</span>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-12 text-brand-danger font-bold uppercase tracking-widest text-xs">
        Failed to fetch analytics summary. Please check Express server connectivity.
      </div>
    );
  }

  // Format Recharts arrays
  const sourceChartData = Object.entries(summary.sourceBreakdown || {}).map(([name, value]) => ({
    name,
    value
  }));

  const statusChartData = Object.entries(summary.statusBreakdown || {}).map(([name, value]) => ({
    name,
    value
  }));

  const courseChartData = Object.entries(summary.courseBreakdown || {}).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value);

  const maxCourseValue = Math.max(...courseChartData.map((c) => c.value), 1);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center gap-3 select-none">
        <h1 className="text-xl font-bold font-heading text-brand-white">Enrollment Analytics</h1>
        <span className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
          Funnel Diagnostics
        </span>
      </div>

      {/* Row 1: KPI Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 select-none">
        <StatCard title="Total Leads" value={summary.total} icon={Users} color="blue" />
        <StatCard title="Hot Leads" value={summary.hot} icon={Flame} color="red" />
        <StatCard title="Qualified Leads" value={summary.qualified} icon={UserCheck} color="purple" />
        <StatCard title="Enrolled Students" value={summary.enrolled} icon={Award} color="green" />
        <StatCard title="Conversion Rate" value={`${summary.conversionRate}%`} icon={TrendingUp} color="slate" />
      </div>

      {/* Row 2: Charts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Sources Pie */}
        <div className="lg:col-span-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md flex flex-col gap-4">
          <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 select-none">
            Lead Source Distribution
          </h2>
          <div className="h-64 flex items-center justify-center">
            {sourceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sourceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#050816', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px', color: '#F9FAFB', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider select-none">No Source Records Found</span>
            )}
          </div>
        </div>

        {/* Center: Funnel Status horizontal Bars */}
        <div className="lg:col-span-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md flex flex-col gap-4">
          <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 select-none">
            Funnel Status Volumes
          </h2>
          <div className="h-64">
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#475569" fontSize={9} width={75} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#050816', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px', color: '#F9FAFB', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={12}>
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-bold uppercase tracking-wider select-none">
                No Status Records Found
              </div>
            )}
          </div>
        </div>

        {/* Right: Registration velocity area chart */}
        <div className="lg:col-span-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 backdrop-blur-md flex flex-col gap-4">
          <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 select-none">
            30-Day Signup Velocity
          </h2>
          <div className="h-64">
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" vertical={false} />
                  <XAxis dataKey="label" stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#050816', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px', color: '#F9FAFB', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-bold uppercase tracking-wider select-none">
                No Velocity Metrics Found
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Row 3: Course Demand Breakdown */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md flex flex-col gap-5">
        <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 select-none">
          <BarChart3 className="w-4 h-4 text-brand-primary" />
          Course Interest Demand
        </h2>

        {courseChartData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
            {courseChartData.map((item) => {
              const percentage = ((item.value / maxCourseValue) * 100).toFixed(0);
              return (
                <div key={item.name} className="flex flex-col gap-1.5 font-bold">
                  <div className="flex justify-between text-xs text-slate-350">
                    <span>{item.name}</span>
                    <span className="font-mono text-brand-primary">{item.value} Students</span>
                  </div>
                  <div className="w-full bg-slate-950 border border-slate-850 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-primary h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-slate-500 font-bold text-center py-6 select-none uppercase tracking-wider">
            No course selection records found.
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
