import { useState, useEffect } from 'react';
import { api, getStoredToken, clearStoredToken } from './lib/api.ts';
import { User } from './types.ts';
import { PublicPage } from './components/PublicPage.tsx';
import { AdminLogin } from './components/AdminLogin.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { LeadsView } from './components/LeadsView.tsx';
import { LeadDetailView } from './components/LeadDetailView.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { ToastContainer, ToastMessage } from './components/Toast.tsx';
import { NotificationsModal } from './components/NotificationsModal.tsx';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Sync browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    setCurrentPath(path);
  };

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, text, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check initial authentication
  useEffect(() => {
    const verifyInitialAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        setCheckingAuth(false);
        return;
      }

      try {
        const data = await api.getMe();
        setUser(data.user);
      } catch {
        clearStoredToken();
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };

    verifyInitialAuth();
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    showToast('Signed in successfully', 'success');
    navigateTo('/admin');
  };

  const handleLogout = () => {
    clearStoredToken();
    setUser(null);
    showToast('Logged out of admin', 'info');
    navigateTo('/admin/login');
  };

  // Route extraction
  const isPublicPage = currentPath === '/';
  const isAdminLogin = currentPath === '/admin/login';
  const isAdminRoot = currentPath === '/admin' || currentPath === '/admin/leads';
  const isAnalytics = currentPath === '/admin/analytics';
  const leadDetailMatch = currentPath.match(/^\/admin\/leads\/([^/]+)$/);
  const currentLeadId = leadDetailMatch ? leadDetailMatch[1] : null;

  // Handle lead capture on public page
  const handleLeadCaptured = () => {
    setRefreshTrigger((prev) => prev + 1);
    showToast('New inquiry recorded in pipeline', 'success');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center text-xs text-[#718096]">
        Checking session...
      </div>
    );
  }

  // 1. Public Lead-Capture Page
  if (isPublicPage) {
    return (
      <>
        <PublicPage
          onNavigateToAdmin={() => {
            if (user) {
              navigateTo('/admin');
            } else {
              navigateTo('/admin/login');
            }
          }}
          onLeadCaptured={handleLeadCaptured}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // 2. Admin Login Page
  if (isAdminLogin) {
    return (
      <>
        <AdminLogin
          onLoginSuccess={handleLoginSuccess}
          onNavigateToPublic={() => navigateTo('/')}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // If user is not authenticated for any /admin route, redirect to login
  if (!user) {
    return (
      <>
        <AdminLogin
          onLoginSuccess={handleLoginSuccess}
          onNavigateToPublic={() => navigateTo('/')}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // 3. Authenticated Admin Area with persistent sidebar
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row text-[#0F172A]">
      <Sidebar
        currentPath={currentPath}
        onNavigate={navigateTo}
        onLogout={handleLogout}
        user={user}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      <main className="flex-1 min-w-0 overflow-y-auto">
        {currentLeadId ? (
          <LeadDetailView
            leadId={currentLeadId}
            onBack={() => navigateTo('/admin')}
            onShowToast={showToast}
          />
        ) : isAnalytics ? (
          <AnalyticsView />
        ) : (
          <LeadsView
            onSelectLead={(id) => navigateTo(`/admin/leads/${id}`)}
            onRefreshTrigger={refreshTrigger}
          />
        )}
      </main>

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectLead={(id) => {
          setIsNotificationsOpen(false);
          navigateTo(`/admin/leads/${id}`);
        }}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
