import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MaintenancePage({ onBypass }) {
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const { login, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMessage(null);
    try {
      const res = await api.getSystemStatus();
      if (!res.maintenance) {
        setStatusMessage('Maintenance complete! Reloading platform...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1200);
      } else {
        setStatusMessage('Platform upgrade is still actively underway. Please check back in a few minutes.');
      }
    } catch (err) {
      setStatusMessage('Servers are currently restarting. Please wait a moment.');
    } finally {
      setChecking(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const res = await login(adminEmail, adminPassword);
      if (res?.user?.role === 'ADMIN') {
        setLoginModalOpen(false);
        if (onBypass) onBypass();
        navigate('/admin');
      } else {
        setLoginError('Only administrators can access CampusVault during maintenance mode.');
      }
    } catch (err) {
      setLoginError(err.message || 'Invalid credentials');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 px-4 py-12 overflow-hidden selection:bg-brand-500 selection:text-white">
      {/* Background ambient lighting effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
        {/* Animated Status Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold tracking-wide uppercase shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          Scheduled Cloud Upgrade &amp; Maintenance
        </div>

        {/* Brand Icon & Heading */}
        <div className="space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/25 text-3xl">
            ⚡
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            We're Upgrading <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">CampusVault</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            We are currently upgrading our cloud document storage infrastructure to provide permanent, lightning-fast PDF streaming and zero-downtime access.
          </p>
        </div>

        {/* What We're Upgrading Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="text-brand-400 font-bold text-sm mb-1 flex items-center gap-1.5">
              <span>☁️</span> Cloud Storage
            </div>
            <p className="text-xs text-slate-400">Migrating academic archives to permanent enterprise CDN storage.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="text-indigo-400 font-bold text-sm mb-1 flex items-center gap-1.5">
              <span>📄</span> High-Speed Stream
            </div>
            <p className="text-xs text-slate-400">Enhancing multi-page document streaming and mobile responsiveness.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="text-emerald-400 font-bold text-sm mb-1 flex items-center gap-1.5">
              <span>🛡️</span> Data Security
            </div>
            <p className="text-xs text-slate-400">Ensuring zero-loss persistence and robust university vaults.</p>
          </div>
        </div>

        {/* Live Action Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-brand-600/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {checking ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Checking Status...
              </>
            ) : (
              <>
                <span>🔄</span> Check If We're Back
              </>
            )}
          </button>

          <button
            onClick={() => setLoginModalOpen(true)}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-medium text-sm transition-all cursor-pointer"
          >
            Administrator Access &rarr;
          </button>
        </div>

        {/* Status Feedback Notice */}
        {statusMessage && (
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 animate-fade-in">
            {statusMessage}
          </div>
        )}

        {/* Footer info */}
        <p className="text-xs text-slate-500 pt-6">
          CampusVault &bull; Your College. Everything You Need. One Search.
        </p>
      </div>

      {/* Admin Bypass Login Modal */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🛡️</span> Administrator Sign In
              </h3>
              <button
                onClick={() => setLoginModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Only authorized staff and administrators can bypass maintenance mode to test and upload materials.
            </p>

            {loginError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {loginError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Admin Email</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  placeholder="admin@campusvault.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Admin Password</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setLoginModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loggingIn}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loggingIn ? 'Authenticating...' : 'Sign In & Bypass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
