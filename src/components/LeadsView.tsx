import { useState, useEffect, ChangeEvent, MouseEvent } from 'react';
import { api } from '../lib/api.ts';
import { Lead, LeadStatus, SortField, SortOrder } from '../types.ts';
import {
  Search,
  Filter,
  MessageSquare,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Mail,
  SlidersHorizontal,
  ChevronRight,
  Copy,
  CheckCheck,
  Building,
  Calendar,
  Sparkles,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { NotificationsModal } from './NotificationsModal.tsx';

interface LeadsViewProps {
  onSelectLead: (id: string) => void;
  onRefreshTrigger?: number;
}

const STATUS_CONFIG: Record<
  LeadStatus,
  {
    label: string;
    dotBg: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    cardBorder: string;
  }
> = {
  new: {
    label: 'New Inquiry',
    dotBg: 'bg-blue-500',
    badgeBg: 'bg-blue-50',
    badgeBorder: 'border-blue-200',
    badgeText: 'text-blue-700',
    cardBorder: 'border-l-blue-500',
  },
  contacted: {
    label: 'Contacted',
    dotBg: 'bg-amber-500',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-200',
    badgeText: 'text-amber-700',
    cardBorder: 'border-l-amber-500',
  },
  converted: {
    label: 'Converted',
    dotBg: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    badgeText: 'text-emerald-700',
    cardBorder: 'border-l-emerald-500',
  },
};

const AVATAR_GRADIENTS = [
  'from-blue-600 to-indigo-700',
  'from-emerald-600 to-teal-700',
  'from-violet-600 to-purple-700',
  'from-rose-600 to-pink-700',
  'from-amber-600 to-orange-700',
  'from-cyan-600 to-blue-700',
];

function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

export function LeadsView({ onSelectLead, onRefreshTrigger }: LeadsViewProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pipelineCounts, setPipelineCounts] = useState<{
    total: number;
    new: number;
    contacted: number;
    converted: number;
  }>({
    total: 0,
    new: 0,
    contacted: 0,
    converted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);

  // Multiple status filters: empty array means "All"
  const [selectedStatuses, setSelectedStatuses] = useState<LeadStatus[]>([]);

  // Sorting state: 'date' | 'name', 'asc' | 'desc'
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Notifications modal state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getLeads({
        search: searchQuery,
        statuses: selectedStatuses,
        sortBy,
        sortOrder,
      });
      setLeads(data.leads || []);
      if (data.counts) {
        setPipelineCounts(data.counts);
      } else {
        setPipelineCounts((prev) => {
          if (prev.total > 0 && (selectedStatuses.length > 0 || searchQuery.trim() !== '')) {
            return prev;
          }
          const all = data.leads || [];
          return {
            total: all.length,
            new: all.filter((l) => l.status === 'new').length,
            contacted: all.filter((l) => l.status === 'contacted').length,
            converted: all.filter((l) => l.status === 'converted').length,
          };
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load leads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [selectedStatuses, sortBy, sortOrder, onRefreshTrigger]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Multi-status toggle handler
  const handleToggleStatus = (status: LeadStatus) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const handleSelectAllStatuses = () => {
    setSelectedStatuses([]);
  };

  // Header column click to sort
  const handleSortClick = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder(field === 'name' ? 'asc' : 'desc');
    }
  };

  // Combined sort value for select dropdown
  const currentSortKey = `${sortBy}_${sortOrder}`;

  const handleSortSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    switch (val) {
      case 'date_desc':
        setSortBy('date');
        setSortOrder('desc');
        break;
      case 'date_asc':
        setSortBy('date');
        setSortOrder('asc');
        break;
      case 'name_asc':
        setSortBy('name');
        setSortOrder('asc');
        break;
      case 'name_desc':
        setSortBy('name');
        setSortOrder('desc');
        break;
    }
  };

  const handleCopyEmail = (e: MouseEvent, email: string, leadId: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmailId(leadId);
    setTimeout(() => {
      setCopiedEmailId(null);
    }, 2000);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isAllSelected = selectedStatuses.length === 0;

  // Stable pipeline summary stats for the KPI strip (never changes when filtering)
  const totalCount = pipelineCounts.total || leads.length;
  const newCount = pipelineCounts.new;
  const contactedCount = pipelineCounts.contacted;
  const convertedCount = pipelineCounts.converted;
  const isFiltering = selectedStatuses.length > 0 || Boolean(searchQuery.trim());

  return (
    <div className="py-8 px-5 sm:px-8 max-w-7xl mx-auto space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
              Lead Pipeline
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#0F172A]/5 text-[#475569] border border-black/5 font-mono">
              {isFiltering ? `${leads.length} of ${totalCount} Records` : `${totalCount} Records`}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage prospective client engagements, evaluate project scopes, and review alerts.
          </p>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            id="btn-open-notifications"
            type="button"
            onClick={() => setIsNotificationsOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border border-[#CBD5E1] bg-white rounded-xl text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#94A3B8] transition-all shadow-2xs cursor-pointer"
            title="Inspect outgoing email alerts to admin"
          >
            <Mail className="w-3.5 h-3.5 text-[#059669]" />
            <span>Email Alerts</span>
          </button>

          <button
            id="btn-refresh-leads"
            type="button"
            onClick={() => fetchLeads()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border border-[#CBD5E1] bg-white rounded-xl text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#94A3B8] transition-all shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#64748B] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Quick KPI Strip with Interactive Status Selectors */}
      <div id="kpi-strip-container" className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Total Card */}
        <div
          id="kpi-card-total"
          onClick={handleSelectAllStatuses}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            isAllSelected
              ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-xs'
              : 'bg-white text-[#0F172A] border-[#E2E8F0] hover:border-[#CBD5E1]'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={`font-semibold ${isAllSelected ? 'text-slate-300' : 'text-[#64748B]'}`}>
              Total Pipeline
            </span>
            <Sparkles className={`w-3.5 h-3.5 ${isAllSelected ? 'text-emerald-400' : 'text-[#94A3B8]'}`} />
          </div>
          <div className="text-2xl font-bold font-mono">{totalCount}</div>
          <span className={`text-[11px] ${isAllSelected ? 'text-slate-400' : 'text-[#94A3B8]'}`}>
            All active inquiries
          </span>
        </div>

        {/* New Inquiries */}
        <div
          id="kpi-card-new"
          onClick={() => handleToggleStatus('new')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedStatuses.includes('new')
              ? 'bg-blue-50/80 border-blue-300 shadow-xs ring-1 ring-blue-400/40'
              : 'bg-white border-[#E2E8F0] hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-blue-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              New Inquiries
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
              Needs Action
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-blue-900">{newCount}</div>
          <span className="text-[11px] text-blue-600">Pending initial response</span>
        </div>

        {/* Contacted */}
        <div
          id="kpi-card-contacted"
          onClick={() => handleToggleStatus('contacted')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedStatuses.includes('contacted')
              ? 'bg-amber-50/80 border-amber-300 shadow-xs ring-1 ring-amber-400/40'
              : 'bg-white border-[#E2E8F0] hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-amber-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Contacted
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
              In Dialog
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-900">{contactedCount}</div>
          <span className="text-[11px] text-amber-600">Outreach in progress</span>
        </div>

        {/* Converted */}
        <div
          id="kpi-card-converted"
          onClick={() => handleToggleStatus('converted')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedStatuses.includes('converted')
              ? 'bg-emerald-50/80 border-emerald-300 shadow-xs ring-1 ring-emerald-400/40'
              : 'bg-white border-[#E2E8F0] hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Converted
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
              Onboarded
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-900">{convertedCount}</div>
          <span className="text-[11px] text-emerald-600">Signed client contracts</span>
        </div>

      </div>

      {/* Filter, Search & Sort Control Deck */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Search Field */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-lead-search"
              type="text"
              placeholder="Search by lead name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 rounded-xl text-xs border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#059669]/25 focus:border-[#059669] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector Dropdown */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <label htmlFor="select-leads-sort" className="text-xs font-semibold text-[#64748B] flex items-center gap-1.5 whitespace-nowrap">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span>Sort:</span>
            </label>
            <select
              id="select-leads-sort"
              value={currentSortKey}
              onChange={handleSortSelectChange}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-[#CBD5E1] bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#059669]/25 focus:border-[#059669] transition-all cursor-pointer shadow-2xs"
            >
              <option value="date_desc">Date received (Newest first)</option>
              <option value="date_asc">Date received (Oldest first)</option>
              <option value="name_asc">Name (A → Z)</option>
              <option value="name_desc">Name (Z → A)</option>
            </select>
          </div>

        </div>

        {/* Status Multi-Filter Chips Bar */}
        <div className="pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#94A3B8]" />
              <span>Filter Status:</span>
            </span>

            {/* All Statuses Button */}
            <button
              id="filter-status-all"
              type="button"
              onClick={handleSelectAllStatuses}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isAllSelected
                  ? 'bg-[#0F172A] text-white shadow-2xs'
                  : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
              }`}
            >
              All Statuses
            </button>

            {/* Status Pills */}
            {(['new', 'contacted', 'converted'] as LeadStatus[]).map((st) => {
              const isChecked = selectedStatuses.includes(st);
              const conf = STATUS_CONFIG[st];
              return (
                <button
                  key={st}
                  id={`filter-status-${st}`}
                  type="button"
                  onClick={() => handleToggleStatus(st)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    isChecked
                      ? `${conf.badgeBg} ${conf.badgeText} ${conf.badgeBorder} ring-2 ring-current/20 font-bold shadow-2xs`
                      : 'bg-white text-[#475569] border-[#CBD5E1] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                      isChecked
                        ? 'bg-current text-white border-transparent'
                        : 'border-[#CBD5E1] bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                  </span>
                  <span>{conf.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Filter Clear */}
          {!isAllSelected && selectedStatuses.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] font-medium text-[#64748B]">
                Filtering {selectedStatuses.length} of 3 statuses
              </span>
              <button
                type="button"
                onClick={handleSelectAllStatuses}
                className="text-[11px] font-bold text-[#059669] hover:underline cursor-pointer"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
          {error}
        </div>
      )}

      {/* Leads Table Container */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-2xs">
        {loading && leads.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#64748B]">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#059669] mb-2" />
            <span>Loading pipeline records...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="py-20 px-6 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F1F5F9] text-[#64748B] flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0F172A]">
              No inquiries match your criteria
            </h3>
            <p className="text-xs text-[#64748B]">
              {searchQuery || selectedStatuses.length > 0
                ? 'Try resetting the search query or toggle other status filters.'
                : 'Submissions through the public site will automatically stream into this workspace.'}
            </p>
            {(searchQuery || selectedStatuses.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatuses([]);
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0F172A] text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  
                  {/* Name Sortable Header */}
                  <th className="py-3.5 px-5">
                    <button
                      id="th-sort-name"
                      type="button"
                      onClick={() => handleSortClick('name')}
                      className="group flex items-center gap-1.5 font-bold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                      title="Sort by lead name"
                    >
                      <span>Prospect / Client</span>
                      {sortBy === 'name' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#059669]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#059669]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#CBD5E1] group-hover:text-[#64748B]" />
                      )}
                    </button>
                  </th>

                  <th className="py-3.5 px-5">Contact Details</th>
                  <th className="py-3.5 px-5">Company / Project</th>
                  <th className="py-3.5 px-5">Pipeline Status</th>
                  <th className="py-3.5 px-5">Notes & Logs</th>

                  {/* Date Sortable Header */}
                  <th className="py-3.5 px-5 text-right">
                    <button
                      id="th-sort-date"
                      type="button"
                      onClick={() => handleSortClick('date')}
                      className="group ml-auto flex items-center gap-1.5 font-bold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                      title="Sort by date received"
                    >
                      <span>Date Captured</span>
                      {sortBy === 'date' ? (
                        sortOrder === 'desc' ? (
                          <ArrowDown className="w-3.5 h-3.5 text-[#059669]" />
                        ) : (
                          <ArrowUp className="w-3.5 h-3.5 text-[#059669]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#CBD5E1] group-hover:text-[#64748B]" />
                      )}
                    </button>
                  </th>

                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs text-[#0F172A]">
                {leads.map((lead) => {
                  const conf = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
                  const initials = lead.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  const gradient = getAvatarGradient(lead.name);

                  return (
                    <tr
                      key={lead.id}
                      id={`lead-row-${lead.id}`}
                      onClick={() => onSelectLead(lead.id)}
                      className="hover:bg-[#F8FAFC] cursor-pointer transition-all group focus-within:bg-[#F8FAFC]"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectLead(lead.id);
                        }
                      }}
                    >
                      {/* Name & Avatar */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0 ring-1 ring-black/5`}
                          >
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-[#0F172A] group-hover:text-[#059669] transition-colors block">
                              {lead.name}
                            </span>
                            <span className="text-[11px] text-[#64748B] font-mono">
                              ID: {lead.id.slice(-6)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Email & Quick Copy */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-[#334155]">{lead.email}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyEmail(e, lead.email, lead.id)}
                            className="p-1 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors opacity-0 group-hover:opacity-100"
                            title="Copy email to clipboard"
                          >
                            {copiedEmailId === lead.id ? (
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {lead.phone && (
                          <div className="text-[11px] text-[#64748B] mt-0.5">
                            {lead.phone}
                          </div>
                        )}
                      </td>

                      {/* Company */}
                      <td className="py-4 px-5">
                        {lead.company ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F1F5F9] text-[#334155] font-semibold text-xs border border-[#E2E8F0]">
                            <Building className="w-3 h-3 text-[#64748B]" />
                            {lead.company}
                          </span>
                        ) : (
                          <span className="text-[#94A3B8] text-xs italic">Not specified</span>
                        )}
                      </td>

                      {/* Status Pill */}
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${conf.badgeBg} ${conf.badgeText} ${conf.badgeBorder}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${conf.dotBg}`} />
                          {conf.label}
                        </span>
                      </td>

                      {/* Notes count */}
                      <td className="py-4 px-5">
                        {lead.notes_count && lead.notes_count > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#334155] font-semibold text-xs font-mono">
                            <MessageSquare className="w-3 h-3 text-[#64748B]" />
                            {lead.notes_count}
                          </span>
                        ) : (
                          <span className="text-[#CBD5E1] text-xs font-mono">0</span>
                        )}
                      </td>

                      {/* Date received */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <span className="text-xs font-medium text-[#334155] font-mono block">
                          {formatDate(lead.created_at)}
                        </span>
                        <span className="text-[10px] text-[#94A3B8] block mt-0.5">
                          {new Date(lead.created_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Action Arrow */}
                      <td className="py-4 px-4 text-center">
                        <div className="w-7 h-7 rounded-lg bg-transparent group-hover:bg-[#E2E8F0] text-[#94A3B8] group-hover:text-[#0F172A] flex items-center justify-center transition-colors mx-auto">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info bar */}
        {leads.length > 0 && (
          <div className="py-3 px-5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#64748B]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0F172A]">Showing {leads.length} leads</span>
              {!isAllSelected && selectedStatuses.length > 0 && (
                <span className="text-[#059669] font-medium">
                  (filtered: {selectedStatuses.map((s) => STATUS_CONFIG[s]?.label || s).join(', ')})
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span>
                Sorted by {sortBy === 'date' ? 'Date' : 'Name'} (
                {sortBy === 'date'
                  ? sortOrder === 'desc'
                    ? 'Newest first'
                    : 'Oldest first'
                  : sortOrder === 'asc'
                  ? 'A → Z'
                  : 'Z → A'}
                )
              </span>
              <span className="text-[#CBD5E1]">·</span>
              <span className="text-[#059669] font-medium">Click any row to open details</span>
            </div>
          </div>
        )}

      </div>

      {/* Notifications Audit Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectLead={(leadId) => {
          setIsNotificationsOpen(false);
          onSelectLead(leadId);
        }}
      />
    </div>
  );
}
