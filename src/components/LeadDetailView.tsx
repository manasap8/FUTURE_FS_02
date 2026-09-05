import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../lib/api.ts';
import { Lead, LeadNote, LeadStatus } from '../types.ts';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  Globe,
  FileText,
  Copy,
  CheckCheck,
  Sparkles,
  ExternalLink,
  MessageSquare,
  User,
  ShieldAlert,
} from 'lucide-react';

interface LeadDetailViewProps {
  leadId: string;
  onBack: () => void;
  onShowToast: (text: string, type?: 'success' | 'error') => void;
}

const STATUS_STEPS: {
  id: LeadStatus;
  label: string;
  title: string;
  description: string;
  activeColor: string;
  badgeBg: string;
  badgeBorder: string;
}[] = [
  {
    id: 'new',
    label: 'Step 1',
    title: 'New Inquiry',
    description: 'Fresh lead captured; review initial brief',
    activeColor: 'bg-blue-600',
    badgeBg: 'bg-blue-50 text-blue-700',
    badgeBorder: 'border-blue-200',
  },
  {
    id: 'contacted',
    label: 'Step 2',
    title: 'Outreach & Dialog',
    description: 'Scoping call or email follow-up in progress',
    activeColor: 'bg-amber-600',
    badgeBg: 'bg-amber-50 text-amber-700',
    badgeBorder: 'border-amber-200',
  },
  {
    id: 'converted',
    label: 'Step 3',
    title: 'Signed Client',
    description: 'Contract executed & onboarded to studio',
    activeColor: 'bg-emerald-600',
    badgeBg: 'bg-emerald-50 text-emerald-700',
    badgeBorder: 'border-emerald-200',
  },
];

export function LeadDetailView({ leadId, onBack, onShowToast }: LeadDetailViewProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchLeadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getLeadById(leadId);
      setLead(data.lead);
      setNotes(data.notes || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load lead details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadData();
  }, [leadId]);

  const handleStatusChange = async (targetStatus: LeadStatus) => {
    if (!lead || lead.status === targetStatus || updatingStatus) return;

    try {
      setUpdatingStatus(true);
      const res = await api.updateLeadStatus(lead.id, targetStatus);
      setLead(res.lead);

      // Refresh notes because server adds an automatic audit log note
      const refreshed = await api.getLeadById(leadId);
      setNotes(refreshed.notes || []);

      const capitalized = targetStatus.charAt(0).toUpperCase() + targetStatus.slice(1);
      onShowToast(`Pipeline stage updated to: ${capitalized}`, 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || addingNote) return;

    try {
      setAddingNote(true);
      const res = await api.addLeadNote(leadId, newNoteContent.trim());
      setNotes((prev) => [...prev, res.note]);
      setNewNoteContent('');
      onShowToast('Note logged to activity feed', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to add note', 'error');
    } finally {
      setAddingNote(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const currentStepIndex = lead ? STATUS_STEPS.findIndex((s) => s.id === lead.status) : 0;

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTimestamp = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })} at ${d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })}`;
  };

  if (loading) {
    return (
      <div className="py-20 px-6 max-w-5xl mx-auto text-center text-xs text-[#64748B]">
        <div className="w-6 h-6 border-2 border-[#059669] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span>Loading lead profile...</span>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="py-12 px-6 max-w-5xl mx-auto space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to pipeline</span>
        </button>
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
          {error || 'Lead not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-5 sm:px-8 max-w-5xl mx-auto space-y-6">
      
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          id="btn-back-to-leads"
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#CBD5E1] bg-white text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A] shadow-2xs transition-colors self-start cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Leads</span>
        </button>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-mono text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
            ID: {lead.id}
          </span>
          <span className="text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-lg border border-[#A7F3D0]">
            Source: {lead.source}
          </span>
        </div>
      </div>

      {/* Lead Profile Hero Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#334155] text-white flex items-center justify-center font-extrabold text-lg shadow-sm shrink-0 ring-1 ring-black/5">
              {lead.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
                  {lead.name}
                </h1>
                {lead.company && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#F1F5F9] text-[#334155] text-xs font-bold border border-[#E2E8F0]">
                    <Building2 className="w-3 h-3 text-[#64748B]" />
                    {lead.company}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B] mt-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span>Captured {formatDate(lead.created_at)}</span>
                <span className="text-[#CBD5E1]">·</span>
                <span>
                  {new Date(lead.created_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Communication Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`mailto:${lead.email}?subject=Northlight%20Studio%20Inquiry%20Follow-up`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0F172A] text-white hover:bg-[#1E293B] shadow-2xs transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Email Prospect</span>
            </a>

            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-[#CBD5E1] bg-white text-[#334155] hover:bg-[#F8FAFC] shadow-2xs transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Call</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => handleCopy(lead.email, 'email')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-[#CBD5E1] bg-white text-[#334155] hover:bg-[#F8FAFC] shadow-2xs transition-colors cursor-pointer"
              title="Copy Email"
            >
              {copiedField === 'email' ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Status Stepper Track */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A]">Pipeline Stage Progression</h2>
            <p className="text-xs text-[#64748B]">
              Click any stage below to advance or rewind this lead's state.
            </p>
          </div>
          <span
            className={`self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full border ${STATUS_STEPS[currentStepIndex].badgeBg} ${STATUS_STEPS[currentStepIndex].badgeBorder}`}
          >
            Active Stage: {STATUS_STEPS[currentStepIndex].title}
          </span>
        </div>

        {/* Stepper Visual Bar */}
        <div className="relative pt-3 pb-2">
          {/* Background Connecting Line */}
          <div className="absolute top-8 left-12 right-12 h-1 bg-[#E2E8F0] z-0 rounded-full" />

          {/* Active Animated Connector */}
          <motion.div
            className="absolute top-8 left-12 h-1 bg-[#0F172A] z-0 rounded-full"
            initial={false}
            animate={{
              width:
                currentStepIndex === 0
                  ? '0%'
                  : currentStepIndex === 1
                  ? '50%'
                  : 'calc(100% - 6rem)',
            }}
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
          />

          {/* Stepper Buttons */}
          <div className="relative z-10 grid grid-cols-3 gap-3">
            {STATUS_STEPS.map((step, idx) => {
              const isPassed = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <button
                  key={step.id}
                  id={`stepper-step-${step.id}`}
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange(step.id)}
                  className={`flex flex-col items-center text-center p-2.5 rounded-xl transition-all cursor-pointer group focus:outline-none ${
                    isCurrent ? 'bg-[#F8FAFC]' : 'hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs mb-2 transition-all shadow-2xs ${
                      isCurrent
                        ? 'bg-[#0F172A] text-white ring-4 ring-[#0F172A]/10'
                        : isPassed
                        ? 'bg-[#059669] text-white'
                        : 'bg-white border-2 border-[#CBD5E1] text-[#64748B] group-hover:border-[#0F172A]'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-5 h-5 text-white" /> : idx + 1}
                  </div>

                  <span
                    className={`text-xs font-bold transition-colors ${
                      isCurrent ? 'text-[#0F172A]' : 'text-[#475569] group-hover:text-[#0F172A]'
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className="text-[11px] text-[#64748B] hidden sm:block mt-0.5 leading-snug">
                    {step.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Progression Helper */}
        <div className="pt-3 border-t border-[#F1F5F9] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-[11px] text-[#64748B]">
            All status updates are logged to the audit feed below with author attribution.
          </span>
          <div className="flex items-center gap-2">
            {lead.status === 'new' && (
              <button
                id="btn-mark-contacted"
                type="button"
                disabled={updatingStatus}
                onClick={() => handleStatusChange('contacted')}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition-colors cursor-pointer"
              >
                Advance to Contacted →
              </button>
            )}
            {lead.status === 'contacted' && (
              <button
                id="btn-mark-converted"
                type="button"
                disabled={updatingStatus}
                onClick={() => handleStatusChange('converted')}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
              >
                Mark as Converted Client ✓
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Contact Metadata & Brief vs Follow-up Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Contact & Message */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Metadata Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Contact Coordinates
            </h3>
            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-[#64748B] shrink-0 mt-0.5">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-[11px] font-medium text-[#64748B]">Work Email</span>
                  <a
                    href={`mailto:${lead.email}`}
                    className="font-semibold text-[#0F172A] hover:text-[#059669] hover:underline truncate block"
                  >
                    {lead.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-[#64748B] shrink-0 mt-0.5">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-[#64748B]">Phone Number</span>
                  {lead.phone ? (
                    <a
                      href={`tel:${lead.phone}`}
                      className="font-semibold text-[#0F172A] hover:text-[#059669] hover:underline"
                    >
                      {lead.phone}
                    </a>
                  ) : (
                    <span className="text-[#94A3B8] italic font-normal">Not provided</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-[#64748B] shrink-0 mt-0.5">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-[#64748B]">Organization</span>
                  <span className="font-semibold text-[#0F172A]">
                    {lead.company || <span className="text-[#94A3B8] italic font-normal">Not specified</span>}
                  </span>
                </div>
              </div>

              {lead.converted_at && (
                <div className="flex items-start gap-3 pt-3 border-t border-[#F1F5F9]">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-medium text-[#64748B]">Converted Timestamp</span>
                    <span className="font-semibold text-emerald-700">
                      {formatDate(lead.converted_at)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Project Brief / Inquiry Content Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
                <FileText className="w-3.5 h-3.5 text-[#059669]" />
                <span>Original Project Brief</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(lead.message, 'message')}
                className="text-[11px] font-semibold text-[#64748B] hover:text-[#0F172A] flex items-center gap-1 cursor-pointer"
              >
                {copiedField === 'message' ? (
                  <>
                    <CheckCheck className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Brief</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs text-[#334155] leading-relaxed whitespace-pre-wrap font-sans select-text">
              {lead.message}
            </div>
          </div>

        </div>

        {/* Right Column: Activity Timeline & Notes Feed */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-6 shadow-2xs">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Follow-up & Activity Log</h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Record discovery call notes, proposal links, and scoping feedback.
              </p>
            </div>

            {/* Note Logging Input */}
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                id="new-note-input"
                rows={3}
                required
                placeholder="Log a client conversation, send date of proposal, or internal assessment..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full p-3.5 text-xs rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#059669]/25 focus:border-[#059669] transition-all resize-y shadow-2xs"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#94A3B8]">
                  Logged under: Manasa (Owner)
                </span>
                <button
                  id="btn-add-note"
                  type="submit"
                  disabled={addingNote || !newNoteContent.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
                >
                  <Send className="w-3 h-3 text-[#10B981]" />
                  <span>{addingNote ? 'Saving...' : 'Add Note'}</span>
                </button>
              </div>
            </form>

            {/* Activity Stream */}
            <div className="pt-4 border-t border-[#F1F5F9]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  History ({notes.length} Entries)
                </h4>
              </div>

              {notes.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#64748B] bg-[#F8FAFC] rounded-xl border border-dashed border-[#CBD5E1]">
                  No follow-up notes recorded yet. Add the first entry above.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0]">
                  <AnimatePresence initial={false}>
                    {notes.map((note) => {
                      const isSystemNote =
                        note.content.startsWith('[Status changed') ||
                        note.content.startsWith('[System');

                      return (
                        <motion.div
                          key={note.id}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="relative"
                        >
                          {/* Timeline node marker */}
                          <div
                            className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 bg-white ${
                              isSystemNote ? 'border-amber-500' : 'border-[#059669]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSystemNote ? 'bg-amber-500' : 'bg-[#059669]'
                              }`}
                            />
                          </div>

                          {/* Note Container */}
                          <div
                            className={`rounded-xl p-3.5 border text-xs leading-relaxed ${
                              isSystemNote
                                ? 'bg-amber-50/50 border-amber-200/80 text-amber-900'
                                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#334155]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[11px] font-bold text-[#0F172A] flex items-center gap-1">
                                {isSystemNote ? 'Pipeline Automation' : 'Manasa'}
                              </span>
                              <span className="text-[10px] text-[#64748B] flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3" />
                                {formatTimestamp(note.created_at)}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap">{note.content}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
