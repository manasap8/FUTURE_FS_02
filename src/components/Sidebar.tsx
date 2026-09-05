import {
  LayoutDashboard,
  Users,
  BarChart3,
  Globe,
  LogOut,
  Mail,
  Menu,
  X,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { User } from '../types.ts';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  user: User | null;
  onOpenNotifications?: () => void;
}

export function Sidebar({
  currentPath,
  onNavigate,
  onLogout,
  user,
  onOpenNotifications,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      label: 'Pipeline Leads',
      path: '/admin',
      icon: Users,
      active: currentPath === '/admin' || currentPath === '/admin/leads' || currentPath.startsWith('/admin/leads/'),
      badge: 'Active',
    },
    {
      label: 'Performance & Funnel',
      path: '/admin/analytics',
      icon: BarChart3,
      active: currentPath === '/admin/analytics',
    },
  ];

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0F172A] text-slate-300 w-64 select-none border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 bg-[#0B1120]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 font-black text-xs shadow-md shadow-emerald-950/40">
            NL
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white tracking-tight">Northlight</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                CRM
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block -mt-0.5">Studio Pipeline</span>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 py-5 px-3 space-y-6 overflow-y-auto">
        
        {/* Core Nav Group */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                type="button"
                onClick={() => handleNavClick(item.path)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  item.active
                    ? 'bg-emerald-500/15 text-white shadow-xs border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      item.active ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Communications & Tools */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Automations & Alerts
          </div>
          {onOpenNotifications && (
            <button
              id="sidebar-btn-email-alerts"
              type="button"
              onClick={() => {
                onOpenNotifications();
                setMobileOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Email Alerts Log</span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Audit
              </span>
            </button>
          )}

          <button
            id="nav-public-site"
            type="button"
            onClick={() => handleNavClick('/')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Client Public Site</span>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        {/* Pipeline SLA Card */}
        <div className="mx-1 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Real-time Ingestion</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            Incoming inquiries trigger instant admin email alerts and duplicate-detection.
          </p>
        </div>

      </div>

      {/* User & Sign Out Footer */}
      <div className="p-3.5 border-t border-slate-800 bg-[#0B1120]">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-2 rounded-lg bg-slate-800/50 border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0">
            {user ? user.name.slice(0, 2).toUpperCase() : 'MA'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{user?.name || 'Manasa'}</p>
            <p className="text-[10px] text-slate-300 truncate">{user?.email || 'manu@gmail.com'}</p>
          </div>
        </div>

        <button
          id="btn-sidebar-logout"
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-400" />
          <span>Sign Out of CRM</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile / Tablet Header Bar */}
      <div className="md:hidden flex items-center justify-between px-4 h-15 bg-[#0F172A] border-b border-slate-800 sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xs">
            NL
          </div>
          <span className="font-bold text-sm text-white">Northlight CRM</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block shrink-0 sticky top-0 h-screen z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex-1 max-w-xs w-full bg-[#0F172A] z-50 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
