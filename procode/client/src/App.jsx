import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import ErrorBoundary from './components/ErrorBoundary';
import ProblemLadder from './pages/ProblemLadder';
import ProblemSolver from './pages/ProblemSolver';
import CompilerPage from './pages/CompilerPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState('ladder');
  const [selectedProblemId, setSelectedProblemId] = useState(null);
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('signin');
  const [systemHealth, setSystemHealth] = useState(null);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [adminInitialProblemToEdit, setAdminInitialProblemToEdit] = useState(null);

  async function checkHealthAndAuth() {
    // 1. Health check
    try {
      const hRes = await fetch('/api/health');
      const hData = await hRes.json();
      setSystemHealth(hData);
      if (hData.maintenanceMode) {
        setIsMaintenance(true);
      }
    } catch {
      console.warn('API health check unreachable');
    }

    // 2. Auth check
    const token = localStorage.getItem('procode_token');
    if (token) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          localStorage.removeItem('procode_token');
        }
      } catch (err) {
        console.error('Session validation failed', err);
      }
    }
  }

  useEffect(() => {
    checkHealthAndAuth();
  }, []);

  const handleOpenAuth = (mode = 'signin') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleOpenHostLogin = () => {
    setAuthModalMode('host');
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    if (authenticatedUser?.role === 'admin') {
      setActivePage('admin');
    }
  };

  const handleEditProblemFromLadder = (problem) => {
    setAdminInitialProblemToEdit(problem);
    setActivePage('admin');
  };

  const handleLogout = () => {
    localStorage.removeItem('procode_token');
    setUser(null);
    setAdminInitialProblemToEdit(null);
    if (activePage === 'profile' || activePage === 'admin') {
      setActivePage('ladder');
    }
  };

  const handleSelectProblem = (id) => {
    setSelectedProblemId(id);
    setActivePage('solver');
  };

  const handleBackToLadder = () => {
    setActivePage('ladder');
    setSelectedProblemId(null);
  };

  const handlePointsUpdated = ({ careerPoints, rankTier }) => {
    if (user) {
      setUser(prev => ({
        ...prev,
        careerPoints,
        rankTier,
        solvedProblems: [...(prev.solvedProblems || []), selectedProblemId]
      }));
    }
  };

  // Graceful Maintenance Mode Fallback Screen (Roadmap page 10)
  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full bg-[#111726] border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">System Under Maintenance</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            ProCode is currently deploying an update to the syllabus problem bank and compilation judge. We will be back online shortly.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw size={14} /> Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
        {/* Navigation Topbar */}
        <Navbar
          activePage={activePage}
          setActivePage={setActivePage}
          user={user}
          onOpenAuth={handleOpenAuth}
          onOpenHostLogin={handleOpenHostLogin}
          onLogout={handleLogout}
        />

        {/* Page Views */}
        <main className="flex-1 w-full">
          {activePage === 'ladder' && (
            <ProblemLadder
              user={user}
              onSelectProblem={handleSelectProblem}
              onOpenAuth={handleOpenAuth}
              onOpenHostLogin={handleOpenHostLogin}
              onEditProblem={handleEditProblemFromLadder}
            />
          )}

          {activePage === 'solver' && selectedProblemId && (
            <ProblemSolver
              problemId={selectedProblemId}
              onBack={handleBackToLadder}
              user={user}
              onOpenAuth={handleOpenAuth}
              onPointsUpdated={handlePointsUpdated}
            />
          )}

          {activePage === 'compiler' && (
            <CompilerPage user={user} onOpenAuth={handleOpenAuth} />
          )}

          {activePage === 'leaderboard' && (
            <LeaderboardPage user={user} onOpenAuth={handleOpenAuth} />
          )}

          {activePage === 'profile' && user && (
            <ProfilePage
              user={user}
              onUserUpdated={(updated) => setUser(updated)}
              onSelectProblem={handleSelectProblem}
            />
          )}

          {activePage === 'admin' && user?.role === 'admin' && (
            <AdminPage
              user={user}
              initialEditingProblem={adminInitialProblemToEdit}
              onClearInitialEditingProblem={() => setAdminInitialProblemToEdit(null)}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-slate-300">
                Pro<span className="text-blue-500">Code</span>
              </span>
              <span>&bull;</span>
              <span>College DSA &amp; Coding Practice Platform</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-400/90 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                API: {systemHealth ? 'Active' : 'Standby'}
              </span>
              <span>&bull;</span>
              <span>Built for First-Year Students</span>
            </div>
          </div>
        </footer>

        {/* Authentication Modal */}
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authModalMode}
          onClose={() => setAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    </ErrorBoundary>
  );
}
