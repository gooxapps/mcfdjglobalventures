import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Database,
  KeyRound,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { BrandLogo } from '@/src/components/BrandLogo';
import { useAdminAuth } from '@/src/contexts/AdminAuthContext';
import { useToast } from '@/src/contexts/ToastContext';
import { isSupabaseConfigured } from '@/src/lib/supabase';

interface ServerConfigStatus {
  supabaseClientConfigured: boolean;
  supabaseServiceConfigured: boolean;
  bootstrapSecretRequired: boolean;
  adminExists: boolean;
}

export function AdminLoginPage() {
  const { isAuthorizedAdmin, loading, signIn, sendPasswordReset } = useAdminAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'reset' | 'bootstrap'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [bootstrapSecret, setBootstrapSecret] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [serverStatus, setServerStatus] = useState<ServerConfigStatus | null>(null);

  useEffect(() => {
    fetch('/api/config-status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setServerStatus(data);
      })
      .catch(() => {});
  }, []);

  if (!loading && isAuthorizedAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await signIn(email, password);
      showToast('Welcome back to MCFD J GLOBAL VENTURES Admin.');
      navigate('/admin', { replace: true });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await sendPasswordReset(email);
      showToast('Password reset link sent to your email.');
      setMode('login');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to send reset email.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          bootstrapSecret,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || 'Setup failed.');
      }
      showToast('Initial Super Administrator created. Signing you in...');
      await signIn(email, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Bootstrap setup failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const clientReady = Boolean(isSupabaseConfigured || serverStatus?.supabaseClientConfigured);

  return (
    <div className="min-h-screen bg-[#090909] text-white flex flex-col justify-between p-6">
      <div className="max-w-md w-full mx-auto my-auto space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-block">
            <BrandLogo variant="dark" size="md" />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-white">
            Private Administration Portal
          </h1>
          <p className="text-xs text-neutral-400">
            Authorized personnel only. Protected by Supabase Authentication &amp; Row Level Security.
          </p>
        </div>

        {!clientReady ? (
          <div className="bg-[#141414] border border-[#D4AF5A]/35 rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-[#E8BE62] shrink-0 mt-0.5" />
              <div>
                <h2 className="font-serif text-xl font-semibold text-white">
                  Supabase Connection Required
                </h2>
                <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                  Configure your Supabase project environment variables to activate live database persistence, Storage uploads, and Administrator authentication.
                </p>
              </div>
            </div>
            <div className="bg-[#090909] border border-white/10 rounded-lg p-4 font-mono text-[11px] text-[#E8BE62] space-y-1">
              <p>VITE_SUPABASE_URL=https://your-project.supabase.co</p>
              <p>VITE_SUPABASE_ANON_KEY=your-anon-key</p>
              <p>SUPABASE_URL=https://your-project.supabase.co</p>
              <p>SUPABASE_SERVICE_ROLE_KEY=your-service-role-key</p>
            </div>
            <ol className="text-xs text-neutral-300 space-y-1.5 list-decimal list-inside">
              <li>Run <code className="text-[#E8BE62]">supabase/migrations/001_initial_schema.sql</code> in Supabase SQL Editor.</li>
              <li>Run <code className="text-[#E8BE62]">supabase/migrations/002_storage_and_seed.sql</code> for Storage buckets &amp; defaults.</li>
              <li>Add the environment variables above in AI Studio Secrets or Vercel Environment Settings.</li>
            </ol>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-[#E8BE62] hover:underline pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Public Storefront
            </Link>
          </div>
        ) : (
          <div className="bg-[#141414] border border-[#D4AF5A]/30 rounded-2xl p-6 sm:p-8 space-y-5">
            {serverStatus && !serverStatus.adminExists && serverStatus.supabaseServiceConfigured && (
              <div className="bg-[#1F1A10] border border-[#D4AF5A]/45 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-[#E8BE62]">
                  <ShieldCheck className="w-4 h-4" />
                  First-Time Store Setup Available
                </div>
                <p className="text-neutral-300">
                  No active administrators exist yet. Initialize the first Super Administrator account securely below.
                </p>
                {mode !== 'bootstrap' && (
                  <button
                    type="button"
                    onClick={() => setMode('bootstrap')}
                    className="px-3 py-1.5 rounded-md bg-[#D4AF5A] text-[#090909] font-semibold"
                  >
                    Initialize Super Admin
                  </button>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-950/60 border border-red-500/50 rounded-lg p-3 text-xs text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Administrator Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@mcfdjglobalventures.com"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#090909] border border-white/15 text-sm text-white focus:outline-none focus:border-[#D4AF5A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#090909] border border-white/15 text-sm text-white focus:outline-none focus:border-[#D4AF5A]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-lg bg-[#D4AF5A] text-[#090909] text-sm font-semibold hover:bg-[#E8BE62] disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  {submitting ? 'Signing In...' : 'Sign In to Dashboard'}
                </button>
                <div className="flex items-center justify-between pt-2 text-xs text-neutral-400">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setMode('reset');
                    }}
                    className="hover:text-[#E8BE62]"
                  >
                    Forgot password?
                  </button>
                  <Link to="/" className="hover:text-white">
                    Back to Storefront
                  </Link>
                </div>
              </form>
            )}

            {mode === 'reset' && (
              <form onSubmit={handleReset} className="space-y-4">
                <h2 className="font-serif text-xl font-semibold">Reset Password</h2>
                <p className="text-xs text-neutral-400">
                  Enter your administrator email address to receive a password recovery link.
                </p>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mcfdjglobalventures.com"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#090909] border border-white/15 text-sm text-white focus:outline-none focus:border-[#D4AF5A]"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-lg bg-[#D4AF5A] text-[#090909] text-sm font-semibold hover:bg-[#E8BE62]"
                >
                  {submitting ? 'Sending...' : 'Send Reset Email'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  Return to Sign In
                </button>
              </form>
            )}

            {mode === 'bootstrap' && (
              <form onSubmit={handleBootstrap} className="space-y-4">
                <div className="flex items-center gap-2 text-[#E8BE62]">
                  <KeyRound className="w-4 h-4" />
                  <h2 className="font-serif text-xl font-semibold">
                    Initialize First Super Admin
                  </h2>
                </div>
                <p className="text-xs text-neutral-400">
                  This one-time controlled setup locks automatically as soon as your first Super Administrator is created.
                </p>
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Theresa Odediran"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#090909] border border-white/15 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@mcfdjglobalventures.com"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#090909] border border-white/15 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">
                    Strong Password (min 10 chars)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={10}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#090909] border border-white/15 text-sm text-white"
                  />
                </div>
                {serverStatus?.bootstrapSecretRequired && (
                  <div>
                    <label className="block text-xs text-neutral-300 mb-1">
                      Server Bootstrap Secret
                    </label>
                    <input
                      type="password"
                      required
                      value={bootstrapSecret}
                      onChange={(e) => setBootstrapSecret(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#090909] border border-white/15 text-sm text-white"
                    />
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-lg bg-[#D4AF5A] text-[#090909] text-sm font-semibold hover:bg-[#E8BE62] inline-flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submitting ? 'Creating Super Admin...' : 'Create Super Administrator'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  Back to Sign In
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-neutral-500 pt-8">
        Developed by Emmanuel Kenny | StaySafelite
      </p>
    </div>
  );
}
