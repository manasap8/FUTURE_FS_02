import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../lib/api.ts';
import {
  Check,
  ArrowRight,
  Lock,
  Sparkles,
  Layers,
  Code2,
  Compass,
  CheckCircle2,
  Clock,
  Shield,
  ArrowUpRight,
  Building,
  Mail,
  Send,
  Zap,
} from 'lucide-react';

interface PublicPageProps {
  onNavigateToAdmin: () => void;
  onLeadCaptured?: () => void;
}

const SERVICE_PILLS = [
  'Design System & Figma',
  'Full-Stack Web App',
  'Brand Architecture',
  'Codebase Audit',
];

export function PublicPage({ onNavigateToAdmin, onLeadCaptured }: PublicPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
    _gotcha: '', // Honeypot field
  });
  const [selectedService, setSelectedService] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedLeadInfo, setSubmittedLeadInfo] = useState<{ name: string; email: string } | null>(null);

  const handleSelectService = (service: string) => {
    if (selectedService === service) {
      setSelectedService('');
    } else {
      setSelectedService(service);
      if (!formData.message.includes(`[Focus: ${service}]`)) {
        const cleaned = formData.message.replace(/\[Focus: [^\]]+\]\s*/g, '');
        setFormData((prev) => ({
          ...prev,
          message: `[Focus: ${service}] ${cleaned}`.trim(),
        }));
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const res = await api.submitLead(formData);
      setSubmitted(true);
      setSubmittedLeadInfo({
        name: formData.name,
        email: formData.email,
      });
      if (onLeadCaptured) {
        onLeadCaptured();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while submitting your inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      message: '',
      _gotcha: '',
    });
    setSelectedService('');
    setSubmitted(false);
    setSubmittedLeadInfo(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col selection:bg-[#059669]/15 selection:text-[#065F46] relative overflow-x-hidden">
      {/* Subtle Ambient Studio Glow */}
      <div
        className="pointer-events-none absolute top-0 right-1/4 w-[600px] h-[360px] bg-gradient-to-b from-[#10B981]/8 via-[#059669]/4 to-transparent blur-3xl opacity-70 -z-10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-96 left-0 w-[420px] h-[320px] bg-gradient-to-tr from-[#3B82F6]/5 to-transparent blur-3xl opacity-50 -z-10"
        aria-hidden="true"
      />

      {/* Top Navigation */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/85 border-b border-[#E2E8F0] transition-all">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0F172A] flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-sm ring-1 ring-black/10">
              <span className="text-[#10B981] font-black">N</span>L
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-[#0F172A]">Northlight</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#0F172A]/5 text-[#475569] border border-black/5">
                  Studio
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] hidden sm:block -mt-0.5">
                Digital Product & Systems Engineering
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live studio availability pill */}
            <div className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>Accepting Q4 2026 Inquiries</span>
            </div>

            {/* Admin Portal Button */}
            <button
              id="link-admin-portal"
              type="button"
              onClick={onNavigateToAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-semibold text-[#0F172A] bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] shadow-2xs transition-all hover:border-[#94A3B8]"
            >
              <Lock className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-5 sm:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* Left Column: Studio Brand & Services */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Eyebrow & Hero Title */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E2E8F0] shadow-2xs text-xs font-medium text-[#475569]">
                <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
                <span>Boutique Digital Product Practice</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] leading-[1.18]">
                Design systems and web engineering for ambitious teams.
              </h1>

              <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
                Northlight collaborates directly with founders and technical leaders to engineer resilient front-end design systems, high-craft brand identities, and production web applications.
              </p>
            </div>

            {/* Stat Row */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
              <div>
                <div className="text-xl font-bold text-[#0F172A] font-mono">100%</div>
                <div className="text-[11px] font-medium text-[#64748B]">In-House Craft</div>
              </div>
              <div className="border-l border-[#F1F5F9] pl-3">
                <div className="text-xl font-bold text-[#059669] font-mono">&lt;24h</div>
                <div className="text-[11px] font-medium text-[#64748B]">Lead Response</div>
              </div>
              <div className="border-l border-[#F1F5F9] pl-3">
                <div className="text-xl font-bold text-[#0F172A] font-mono">94%</div>
                <div className="text-[11px] font-medium text-[#64748B]">Client Retention</div>
              </div>
            </div>

            {/* Core Capability Pillars */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Studio Core Capabilities
              </h2>
              <div className="grid grid-cols-1 gap-2.5">
                <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] flex items-start gap-3 shadow-2xs hover:border-[#CBD5E1] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0 mt-0.5">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#0F172A]">Figma Design Systems & Tokens</h3>
                    <p className="text-[12px] text-[#64748B] mt-0.5 leading-snug">
                      Component architectures, design token pipelines, and consistent cross-platform guidelines.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] flex items-start gap-3 shadow-2xs hover:border-[#CBD5E1] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#0F172A]">TypeScript & React Engineering</h3>
                    <p className="text-[12px] text-[#64748B] mt-0.5 leading-snug">
                      High-performance web apps, responsive client dashboards, and clean RESTful API integration.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] flex items-start gap-3 shadow-2xs hover:border-[#CBD5E1] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-[#FAF5FF] text-[#9333EA] flex items-center justify-center shrink-0 mt-0.5">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#0F172A]">Brand Direction & Digital Products</h3>
                    <p className="text-[12px] text-[#64748B] mt-0.5 leading-snug">
                      Complete visual identity, corporate websites, and interactive product walkthroughs.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Studio Director Note */}
            <div className="p-4 rounded-xl bg-white/70 border border-[#E2E8F0] flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#059669]/20 shrink-0">
                M
              </div>
              <div className="text-xs">
                <p className="font-semibold text-[#0F172A]">Manasa</p>
                <p className="text-[#64748B] text-[11px]">Founding Partner & Principal Designer</p>
                <p className="text-[#059669] text-[11px] font-medium mt-0.5">
                  "Every inquiry is reviewed directly with actionable initial recommendations."
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: High-Converting Contact Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-9 shadow-sm relative overflow-hidden">
              
              {/* Subtle top card accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0F172A] via-[#059669] to-[#10B981]" />

              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="submitted"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="py-6 space-y-6"
                  >
                    {/* Success Header */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center shadow-xs">
                        <Check className="w-6 h-6 stroke-[2.5]" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669]">
                          Inquiry Dispatched
                        </span>
                        <h2 className="text-xl font-bold text-[#0F172A]">
                          Thank you, {submittedLeadInfo?.name.split(' ')[0] || 'there'}!
                        </h2>
                      </div>
                    </div>

                    <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-4.5 space-y-3 text-xs leading-relaxed text-[#334155]">
                      <p>
                        Your inquiry has been successfully captured in our studio CRM pipeline. Our team has also dispatched an instant email notification to our lead manager.
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0] text-[11px] text-[#64748B]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#059669]" />
                          <span>Expected reply: Within 24 hours</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[#0F172A]">
                          <Mail className="w-3.5 h-3.5 text-[#64748B]" />
                          <span>{submittedLeadInfo?.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      <button
                        id="btn-send-another"
                        type="button"
                        onClick={resetForm}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold border border-[#CBD5E1] text-[#334155] bg-white hover:bg-[#F8FAFC] shadow-2xs transition-colors cursor-pointer"
                      >
                        Submit another inquiry
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={handleSubmit}
                    className="space-y-5"
                    noValidate
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold tracking-tight text-[#0F172A]">
                          Start a conversation
                        </h2>
                        <span className="text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full">
                          Direct to Founder
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-1">
                        Tell us about your organization, roadmap milestones, and project goals.
                      </p>
                    </div>

                    {/* Quick Service Selection Chips */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                        Primary Project Focus <span className="text-xs font-normal text-[#94A3B8]">(Optional)</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {SERVICE_PILLS.map((service) => {
                          const isSelected = selectedService === service;
                          return (
                            <button
                              key={service}
                              type="button"
                              onClick={() => handleSelectService(service)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-2xs'
                                  : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#CBD5E1]'
                              }`}
                            >
                              {isSelected ? `✓ ${service}` : service}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {errorMessage && (
                      <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-medium text-[#991B1B] flex items-center gap-2">
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Honeypot Spam Protection (Hidden from human users) */}
                    <div className="hidden" aria-hidden="true">
                      <label htmlFor="website_check">Please leave this field empty</label>
                      <input
                        id="website_check"
                        type="text"
                        name="_gotcha"
                        tabIndex={-1}
                        autoComplete="off"
                        value={formData._gotcha}
                        onChange={(e) => setFormData({ ...formData, _gotcha: e.target.value })}
                      />
                    </div>

                    {/* Name & Email Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="lead-name" className="block text-xs font-bold text-[#0F172A] mb-1.5">
                          Your Name <span className="text-[#DC2626]">*</span>
                        </label>
                        <input
                          id="lead-name"
                          type="text"
                          required
                          placeholder="Elena Vance"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#059669]/25 focus:border-[#059669] transition-all shadow-2xs"
                        />
                      </div>
                      <div>
                        <label htmlFor="lead-email" className="block text-xs font-bold text-[#0F172A] mb-1.5">
                          Work Email <span className="text-[#DC2626]">*</span>
                        </label>
                        <input
                          id="lead-email"
                          type="email"
                          required
                          placeholder="elena@company.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#059669]/25 focus:border-[#059669] transition-all shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Company & Phone Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="lead-company" className="block text-xs font-bold text-[#0F172A] mb-1.5">
                          Company / Organization
                        </label>
                        <input
                          id="lead-company"
                          type="text"
                          placeholder="Acme Health Inc."
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#059669]/25 focus:border-[#059669] transition-all shadow-2xs"
                        />
                      </div>
                      <div>
                        <label htmlFor="lead-phone" className="block text-xs font-bold text-[#0F172A] mb-1.5">
                          Phone Number <span className="text-xs font-normal text-[#94A3B8]">(optional)</span>
                        </label>
                        <input
                          id="lead-phone"
                          type="tel"
                          placeholder="+1 (555) 019-2834"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#059669]/25 focus:border-[#059669] transition-all shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Message Box */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="lead-message" className="block text-xs font-bold text-[#0F172A]">
                          Project Scope & Timeline <span className="text-[#DC2626]">*</span>
                        </label>
                        <span className="text-[11px] text-[#94A3B8]">
                          {formData.message.length} characters
                        </span>
                      </div>
                      <textarea
                        id="lead-message"
                        required
                        rows={4}
                        placeholder="Tell us what you are building, your timeline, budget parameters, and any existing design/tech stack..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#059669]/25 focus:border-[#059669] transition-all resize-y shadow-2xs"
                      />
                    </div>

                    {/* Submission Footer */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <button
                        id="btn-submit-inquiry"
                        type="submit"
                        disabled={submitting}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold transition-all disabled:opacity-50 shadow-xs hover:shadow-md cursor-pointer"
                      >
                        {submitting ? (
                          <>
                            <Zap className="w-4 h-4 animate-spin text-[#10B981]" />
                            <span>Transmitting Inquiry...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Project Inquiry</span>
                            <Send className="w-3.5 h-3.5 text-[#10B981]" />
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                        <Shield className="w-3.5 h-3.5 text-[#059669]" />
                        <span>Protected by spam filters & SSL</span>
                      </div>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#0F172A]">Northlight Studio</span>
            <span className="text-[#CBD5E1]">·</span>
            <span>Digital Product Architecture</span>
            <span className="text-[#CBD5E1]">·</span>
            <span>© 2026 All Rights Reserved</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px]">inquiries@northlight.studio</span>
            <span className="text-[#CBD5E1]">·</span>
            <button
              type="button"
              onClick={onNavigateToAdmin}
              className="text-[#059669] hover:underline font-semibold flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              <span>Admin Access</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
