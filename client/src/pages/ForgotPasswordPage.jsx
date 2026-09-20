import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import CampusVaultLogo from '../components/common/CampusVaultLogo';
import { api } from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <CampusVaultLogo size="lg" className="justify-center" />
          <h2 className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white">Reset Password</h2>
          <p className="mt-1 text-xs text-slate-500">
            Enter your college email address to receive password recovery instructions.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          {submitted ? (
            <div className="text-center py-4">
              <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Reset Link Dispatched</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                If an account matches {email}, you will receive a secure reset link shortly.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">College Email</label>
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahul@cgu-odisha.ac.in"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-violetAccent-500 py-3 text-xs font-bold text-white shadow-md hover:from-brand-700 hover:to-violetAccent-600 transition-all shadow-brand-500/20 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Recovery Instructions'}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-600"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Return to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
