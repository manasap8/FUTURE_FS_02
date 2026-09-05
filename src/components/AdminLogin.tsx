import { useState, FormEvent } from 'react';
import { api, setStoredToken } from '../lib/api.ts';
import { User } from '../types.ts';
import {
  Lock,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (user: User) => void;
  onNavigateToPublic: () => void;
}

export function AdminLogin({ onLoginSuccess, onNavigateToPublic }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const data = await api.login(email.trim(), password);
      setStoredToken(data.token);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-5 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-emerald-500/20 selection:text-emerald-800">
      
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[360px] bg-gradient-to-br from-emerald-500/10 via-slate-900/5 to-transparent blur-3xl rounded-full"
        aria-hidden="true"
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        
        {/* Back link */}
        <button
          id="btn-back-to-site"
          type="button"
          onClick={onNavigateToPublic}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A] mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to public site</span>
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#0F172A] flex items-center justify-center text-white font-black text-sm tracking-wide shadow-sm ring-1 ring-black/10">
            <span className="text-[#10B981]">N</span>L
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#0F172A]">
              Northlight CRM
            </h1>
            <p className="text-xs text-[#64748B]">
              Executive Pipeline Portal
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 sm:px-8 border border-[#E2E8F0] rounded-2xl shadow-sm relative overflow-hidden">
          
          {/* Subtle top card accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0F172A] via-[#059669] to-[#10B981]" />

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="font-semibold">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-[#0F172A] mb-1.5">
                Admin Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                placeholder="Enter admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#059669]/25 focus:border-[#059669] transition-all shadow-2xs"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-bold text-[#0F172A] mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#059669]/25 focus:border-[#059669] transition-all shadow-2xs"
              />
            </div>

            <div className="pt-2">
              <button
                id="btn-login-submit"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold transition-all disabled:opacity-60 shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Zap className="w-3.5 h-3.5 animate-spin text-[#10B981]" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Sign In to Pipeline</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-[#F1F5F9] flex items-center justify-center gap-1.5 text-[11px] text-[#94A3B8]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
            <span>Encrypted authentication session</span>
          </div>

        </div>
      </div>
    </div>
  );
}
