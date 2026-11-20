import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { usePodStore } from './store/podStore';

// Components & Layout
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import PodChatPage from './pages/PodChatPage';
import MilestonePage from './pages/MilestonePage';
import PomodoroPage from './pages/PomodoroPage';
import ProfilePage from './pages/ProfilePage';

// Protected Route Component
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-r-transparent" />
          <p className="mt-3 text-sm font-semibold text-slate-600">Loading StudyPod...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
};

// Authenticated Application Shell Layout
const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isChatRoom = location.pathname.startsWith('/pod/') && !location.pathname.includes('/milestones') && !location.pathname.includes('/pomodoro');

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar onOpenFindPod={() => setSidebarOpen(true)} />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenFindPod={() => {
            // Find pod modal trigger or navigate to dashboard
          }}
        />

        {/* Main Workspace Content */}
        <main className={`flex-1 overflow-x-hidden ${isChatRoom ? 'p-0 sm:p-0 lg:p-0' : 'p-4 sm:p-6 lg:p-8'}`}>
          <div className={`${isChatRoom ? 'h-full w-full' : 'mx-auto max-w-7xl'}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const { fetchUser } = useAuthStore();
  const { fetchPods } = usePodStore();

  useEffect(() => {
    fetchUser().then(() => {
      fetchPods().catch(() => {});
    });
  }, []);

  return (
    <BrowserRouter>
      {/* Toast Provider */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1e293b',
            color: '#fff',
            fontSize: '13px',
            borderRadius: '12px',
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected Authenticated Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/pod/:podId" element={<PodChatPage />} />
            <Route path="/pod/:podId/milestones" element={<MilestonePage />} />
            <Route path="/pod/:podId/pomodoro" element={<PomodoroPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Fallback to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
