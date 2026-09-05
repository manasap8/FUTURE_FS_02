import { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { EmailNotificationLog } from '../types.ts';
import {
  Mail,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  X,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Server,
  Zap,
} from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLead: (leadId: string) => void;
}

export function NotificationsModal({ isOpen, onClose, onSelectLead }: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<EmailNotificationLog[]>([]);
  const [adminEmail, setAdminEmail] = useState<string>('manu@gmail.com');
  const [isSmtpConfigured, setIsSmtpConfigured] = useState<boolean>(false);
  const [smtpHost, setSmtpHost] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedNotif, setSelectedNotif] = useState<EmailNotificationLog | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setAdminEmail(data.adminEmail || 'manu@gmail.com');
      setIsSmtpConfigured(Boolean(data.isSmtpConfigured));
      setSmtpHost(data.smtpHost || '');
      if (data.notifications && data.notifications.length > 0 && !selectedNotif) {
        setSelectedNotif(data.notifications[0]);
      }
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      setTestResult(null);
    }
  }, [isOpen]);

  const handleSendTest = async () => {
    try {
      setSendingTest(true);
      setTestResult(null);
      const res = await api.sendTestNotification();
      setTestResult({
        success: res.success,
        message: res.success
          ? `Test email notification dispatched to ${res.recipient} via ${res.sentVia}`
          : `Notification logged (Transport: ${res.sentVia}). ${res.error || ''}`,
      });
      await fetchNotifications();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to dispatch test notification.',
      });
    } finally {
      setSendingTest(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0F172A] text-white flex items-center justify-center shadow-2xs">
              <Mail className="w-4 h-4 text-[#10B981]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-[#0F172A]">
                Admin Email Alert Dispatcher
              </h2>
              <p className="text-[11px] text-[#64748B]">
                Real-time outbound notifications sent directly to business owner
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="px-6 py-3.5 bg-white border-b border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[#64748B]">Recipient:</span>
              <span className="font-bold text-[#0F172A] font-mono">{adminEmail}</span>
              <span className="px-2 py-0.5 text-[10px] rounded-full font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                Verified Admin Account
              </span>
            </div>
            <div className="text-[11px] text-[#64748B] flex items-center gap-1.5">
              <Server className="w-3 h-3 text-[#94A3B8]" />
              <span>
                Transport:{' '}
                <span className="font-medium text-[#334155]">
                  {isSmtpConfigured ? `SMTP Server (${smtpHost})` : 'In-Memory Pipeline Dispatcher'}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendTest}
              disabled={sendingTest}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0F172A] text-white hover:bg-[#1E293B] disabled:opacity-50 transition-all shadow-2xs cursor-pointer"
            >
              <Send className={`w-3 h-3 text-[#10B981] ${sendingTest ? 'animate-spin' : ''}`} />
              <span>{sendingTest ? 'Transmitting...' : 'Send Test Notification'}</span>
            </button>
            <button
              type="button"
              onClick={fetchNotifications}
              disabled={loading}
              title="Refresh audit records"
              className="p-1.5 rounded-xl border border-[#CBD5E1] bg-white text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Feedback message banner */}
        {testResult && (
          <div
            className={`mx-6 mt-3 p-3 rounded-xl text-xs flex items-center justify-between ${
              testResult.success
                ? 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]'
                : 'bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]'
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#059669]" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
              )}
              <span className="font-medium">{testResult.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setTestResult(null)}
              className="text-[11px] underline opacity-80 hover:opacity-100 ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content list & preview columns */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0]">
          
          {/* Notification List */}
          <div className="md:col-span-2 overflow-y-auto p-3 space-y-2 max-h-[48vh] md:max-h-none bg-[#F8FAFC]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] px-2 py-1">
              Dispatched Alerts ({notifications.length})
            </div>

            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B]">Loading audit logs...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#64748B] space-y-2">
                <p>No email notifications dispatched yet.</p>
                <p className="text-[11px] text-[#94A3B8]">
                  Submit an inquiry on the public site or trigger a test notification above.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isSelected = selectedNotif?.id === notif.id;
                return (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => setSelectedNotif(notif)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-[#0F172A] ring-2 ring-[#0F172A]/10 shadow-xs'
                        : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-xs text-[#0F172A] truncate">
                        {notif.lead_name}
                      </span>
                      <span className="text-[10px] font-mono text-[#64748B] shrink-0">
                        {new Date(notif.created_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#475569] truncate mb-1.5">
                      {notif.lead_company || notif.lead_email}
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="inline-flex items-center gap-1 text-[#059669] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        Delivered
                      </span>
                      <span className="text-[#94A3B8] font-mono">
                        {new Date(notif.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Email Preview Details */}
          <div className="md:col-span-3 overflow-y-auto p-5 bg-white flex flex-col justify-between">
            {selectedNotif ? (
              <div className="space-y-4">
                <div className="border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-4 bg-white">
                  
                  {/* Subject */}
                  <div className="border-b border-[#F1F5F9] pb-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                      Transmitted Email Subject
                    </span>
                    <h3 className="text-sm font-extrabold text-[#0F172A]">{selectedNotif.subject}</h3>
                  </div>

                  {/* Recipient / Timestamp */}
                  <div className="grid grid-cols-2 gap-3 text-xs border-b border-[#F1F5F9] pb-3">
                    <div>
                      <span className="text-[#64748B] text-[11px] block">To (Admin Mailbox)</span>
                      <span className="font-bold text-[#0F172A] font-mono text-[11px]">
                        {selectedNotif.recipient}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#64748B] text-[11px] block">Dispatched At</span>
                      <span className="text-[#334155] text-[11px] font-mono">
                        {new Date(selectedNotif.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Lead details summary */}
                  <div className="space-y-2 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                      Lead Payload Transmitted
                    </span>
                    <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-3.5 space-y-2 text-xs">
                      <div>
                        <span className="text-[#64748B]">Name:</span>{' '}
                        <span className="font-bold text-[#0F172A]">{selectedNotif.lead_name}</span>
                      </div>
                      <div>
                        <span className="text-[#64748B]">Email:</span>{' '}
                        <span className="font-semibold text-[#059669]">{selectedNotif.lead_email}</span>
                      </div>
                      {selectedNotif.lead_company && (
                        <div>
                          <span className="text-[#64748B]">Company:</span>{' '}
                          <span className="font-semibold text-[#0F172A]">{selectedNotif.lead_company}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-[#64748B]">Message:</span>
                        <p className="mt-1 text-[#334155] bg-white p-2.5 rounded-lg border border-[#E2E8F0] italic">
                          "{selectedNotif.lead_message}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Direct Lead link */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between gap-3 p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl">
                      <span className="text-[11px] font-mono text-[#065F46] truncate">
                        {selectedNotif.lead_url}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectLead(selectedNotif.lead_id);
                        }}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#0F172A] text-white rounded-lg hover:bg-[#1E293B] transition-colors cursor-pointer"
                      >
                        <span>Open Lead Profile</span>
                        <ExternalLink className="w-3 h-3 text-[#10B981]" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center p-6 text-xs text-[#64748B]">
                Select a dispatched notification from the history list to preview the transmitted email.
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-[#F1F5F9] text-[11px] text-[#64748B] flex items-center justify-between">
              <span>Automated alert triggered on every public lead capture</span>
              <button
                type="button"
                onClick={onClose}
                className="font-bold text-[#0F172A] hover:underline cursor-pointer"
              >
                Close Modal
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
