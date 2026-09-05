import { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { AnalyticsData } from '../types.ts';
import {
  Users,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  BarChart2,
  RefreshCw,
  Sparkles,
  Target,
  ArrowRight,
  PieChart,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export function AnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAnalytics();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="py-24 px-6 max-w-7xl mx-auto text-center text-xs text-[#64748B]">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#059669] mb-3" />
        <span>Synthesizing pipeline intelligence...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12 px-6 max-w-7xl mx-auto space-y-3">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
          {error || 'Unable to load analytics data.'}
        </div>
        <button
          type="button"
          onClick={fetchAnalytics}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F172A] text-white hover:bg-[#1E293B]"
        >
          Retry
        </button>
      </div>
    );
  }

  // Trend line chart SVG calculation
  const trendPoints = data.trendData || [];
  const maxCount = Math.max(...trendPoints.map((p) => p.count), 4);
  const chartHeight = 190;
  const chartWidth = 640;
  const paddingX = 36;
  const paddingY = 28;

  const getCoordinates = (index: number, count: number) => {
    const x = paddingX + (index / (trendPoints.length - 1 || 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (count / maxCount) * (chartHeight - paddingY * 2);
    return { x, y };
  };

  const pointsString = trendPoints
    .map((p, idx) => {
      const { x, y } = getCoordinates(idx, p.count);
      return `${x},${y}`;
    })
    .join(' ');

  const areaString =
    trendPoints.length > 0
      ? `${getCoordinates(0, 0).x},${chartHeight - paddingY} ${pointsString} ${
          getCoordinates(trendPoints.length - 1, 0).x
        },${chartHeight - paddingY}`
      : '';

  // Calculate Funnel metrics
  const newCount = data.statusBreakdown.find((s) => s.status === 'new')?.count || 0;
  const contactedCount = data.statusBreakdown.find((s) => s.status === 'contacted')?.count || 0;
  const convertedCount = data.statusBreakdown.find((s) => s.status === 'converted')?.count || 0;
  const total = data.totalLeads || 1;

  const contactedOrBeyond = contactedCount + convertedCount;
  const qualificationRate = Math.round((contactedOrBeyond / total) * 100);

  return (
    <div className="py-8 px-5 sm:px-8 max-w-7xl mx-auto space-y-7">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
              Studio Intelligence & Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Metrics
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Monitor pipeline intake volume, conversion efficiency, and pipeline velocity.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#CBD5E1] bg-white text-[#334155] hover:bg-[#F8FAFC] shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#64748B]" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 1. Top KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Inquiries */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Total Inquiries
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F1F5F9] text-[#0F172A] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-[#0F172A] font-mono">
              {data.totalLeads}
            </span>
            <span className="text-xs text-[#64748B]">all-time captured</span>
          </div>
          <div className="pt-2 border-t border-[#F1F5F9] text-[11px] text-[#64748B] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#059669]" />
            <span>100% captured via public web endpoint</span>
          </div>
        </div>

        {/* Client Conversion Rate */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Conversion Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-[#059669] font-mono">
              {data.conversionRate}%
            </span>
            <span className="text-xs text-[#64748B]">inquiry → client</span>
          </div>
          <div className="pt-2 border-t border-[#F1F5F9] text-[11px] text-[#64748B] flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-600" />
            <span>Studio benchmark: 20-30%</span>
          </div>
        </div>

        {/* Velocity This Week */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Leads This Week
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F1F5F9] text-[#0F172A] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-[#0F172A] font-mono">
              {data.leadsThisWeek}
            </span>
            <span className="text-xs text-[#64748B]">trailing 7 days</span>
          </div>
          <div className="pt-2 border-t border-[#F1F5F9] text-[11px] text-[#64748B] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Active intake pipeline</span>
          </div>
        </div>

      </div>

      {/* 2. Visual Conversion Funnel */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-[#0F172A]">Pipeline Conversion Funnel</h2>
          <p className="text-xs text-[#64748B]">
            Progression rates from first contact submission to signed partner retainer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          {/* Funnel Stage 1 */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span className="font-bold uppercase tracking-wider text-[10px]">Stage 1 · Intake</span>
              <span className="font-mono font-semibold">100%</span>
            </div>
            <div className="text-xl font-extrabold text-[#0F172A] font-mono">
              {data.totalLeads} Inquiries
            </div>
            <p className="text-[11px] text-[#64748B]">
              All prospective client requests submitted through Northlight site.
            </p>
          </div>

          {/* Funnel Stage 2 */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span className="font-bold uppercase tracking-wider text-[10px]">Stage 2 · Scoping</span>
              <span className="font-mono font-semibold text-amber-600">{qualificationRate}%</span>
            </div>
            <div className="text-xl font-extrabold text-amber-900 font-mono">
              {contactedOrBeyond} Engaged
            </div>
            <p className="text-[11px] text-[#64748B]">
              Discovery calls initiated or proposal documents delivered.
            </p>
          </div>

          {/* Funnel Stage 3 */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-700">
              <span className="font-bold uppercase tracking-wider text-[10px]">Stage 3 · Retained</span>
              <span className="font-mono font-bold">{data.conversionRate}%</span>
            </div>
            <div className="text-xl font-extrabold text-emerald-900 font-mono">
              {convertedCount} Closed Clients
            </div>
            <p className="text-[11px] text-emerald-700">
              Contracts executed and added to active studio roster.
            </p>
          </div>

        </div>
      </div>

      {/* 3. Trend Chart & Status Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Leads Over Time Interactive SVG Chart */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#0F172A]">Intake Velocity Over Time</h2>
              <p className="text-xs text-[#64748B]">Daily volume across the last 14 days</p>
            </div>
            {hoveredTrendIndex !== null && trendPoints[hoveredTrendIndex] && (
              <div className="text-right">
                <span className="text-xs font-bold text-[#059669] font-mono">
                  {trendPoints[hoveredTrendIndex].count} Inquiries
                </span>
                <span className="text-[10px] text-[#64748B] block">
                  {trendPoints[hoveredTrendIndex].label}
                </span>
              </div>
            )}
          </div>

          {/* Chart Canvas */}
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal grid guide lines */}
              {[0, 0.5, 1].map((ratio) => {
                const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
                const value = Math.round(ratio * maxCount);
                return (
                  <g key={ratio}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="#F1F5F9"
                      strokeWidth="1.5"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="9"
                      fill="#94A3B8"
                      className="font-mono"
                    >
                      {value}
                    </text>
                  </g>
                );
              })}

              {/* Gradient Area Polygon */}
              <polygon points={areaString} fill="url(#areaGradient)" />

              {/* Stroke Polyline */}
              <polyline
                points={pointsString}
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {trendPoints.map((p, idx) => {
                const { x, y } = getCoordinates(idx, p.count);
                const isHovered = hoveredTrendIndex === idx;

                return (
                  <g
                    key={p.date}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredTrendIndex(idx)}
                    onMouseLeave={() => setHoveredTrendIndex(null)}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 6 : 4}
                      fill={isHovered ? '#059669' : '#FFFFFF'}
                      stroke="#059669"
                      strokeWidth="2.5"
                      className="transition-all duration-150"
                    />
                    {/* Invisible hit-box */}
                    <rect
                      x={x - 14}
                      y={0}
                      width={28}
                      height={chartHeight}
                      fill="transparent"
                    />
                  </g>
                );
              })}
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between text-[10px] text-[#94A3B8] font-mono pt-2 px-6">
              <span>{trendPoints[0]?.label || ''}</span>
              <span>{trendPoints[Math.floor(trendPoints.length / 2)]?.label || ''}</span>
              <span>{trendPoints[trendPoints.length - 1]?.label || ''}</span>
            </div>
          </div>
        </div>

        {/* Status Distribution Breakdown */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-5 shadow-2xs">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A]">Stage Distribution</h2>
            <p className="text-xs text-[#64748B]">Active proportion of each lifecycle status</p>
          </div>

          {/* Segmented multi-colored bar */}
          <div className="space-y-2">
            <div className="h-3 w-full bg-[#F1F5F9] rounded-full overflow-hidden flex ring-1 ring-black/5">
              {data.statusBreakdown.map((item) => (
                <div
                  key={item.status}
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                  className="h-full transition-all duration-300"
                  title={`${item.label}: ${item.count} (${item.percentage}%)`}
                />
              ))}
            </div>
          </div>

          {/* Detailed breakdown items */}
          <div className="divide-y divide-[#F1F5F9] pt-1">
            {data.statusBreakdown.map((item) => (
              <div key={item.status} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-lg shrink-0 shadow-2xs"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <span className="font-bold text-[#0F172A]">{item.label}</span>
                    <span className="text-[11px] text-[#64748B] block">
                      {item.status === 'new'
                        ? 'Under partner evaluation'
                        : item.status === 'contacted'
                        ? 'Discovery & proposals'
                        : 'Signed studio engagements'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-[#0F172A] font-mono text-sm block">
                    {item.count}
                  </span>
                  <span className="text-[11px] text-[#64748B] font-mono">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
