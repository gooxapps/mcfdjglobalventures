import React, { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Database,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { BrandLogo } from '@/src/components/BrandLogo';
import { useAdminAuth } from '@/src/contexts/AdminAuthContext';
import { useToast } from '@/src/contexts/ToastContext';
import { apiRequest, fetchBackendStatus, type BackendConfigStatus } from '@/src/lib/apiClient';

export function AdminLoginPage() {
  const { isAuthorizedAdmin, loading, signIn, refreshSession, enterPreviewMode } =
    useAdminAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [previewName, setPreviewName] = useState('Theresa Odediran');
  const [mode, setMode] = useState<'login' | 'bootstrap'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [serverStatus, setServerStatus] = useState<BackendConfigStatus | null>(null);

  const checkConfig = useCallback(async () => {
    setCheckingConfig(true);
    try {
      const data = await fetchBackendStatus(true);
      setServerStatus(data);
      if (data.databaseConfigured && data.databaseReachable && !data.adminExists) {
        setMode('bootstrap');
      } else {
        setMode('login');
      }
    } catch {
      // Ignore network hiccup
    } finally {
      setCheckingConfig(false);
    }
  }, []);

  useEffect(() => {
    checkConfig();
  }, [checkConfig]);

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

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await apiRequest('/api/auth/bootstrap', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          fullName,
        }),
      });
      showToast('Initial Super Administrator created and signed in.');
      await refreshSession();
      navigate('/admin', { replace: true });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Bootstrap setup failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const dbReady = Boolean(serverStatus?.databaseConfigured && serverStatus?.databaseReachable);
  const previewAllowed = Boolean(serverStatus?.previewAllowed);

  return (
    <div className="min-h-screen bg-[#090909] text-white flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-lg w-full mx-auto my-auto space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-block">
            <BrandLogo variant="dark" size="md" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
            Private Administration Portal
          </h1>
          <p className="text-xs text-neutral-400">
            Authorized personnel only. Protected by Neon PostgreSQL &amp; Encrypted Session Authentication.
          </p>
        </div>

        {!dbReady ? (
          <div className="space-y-4">
            {previewAllowed && (
              <div className="bg-[#141414] border border-[#D4AF5A]/55 rounded-2xl p-5 sm:p-7 space-y-4 shadow-[0_14px_40px_rgba(212,175,90,0.12)]">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#E8BE62] shrink-0 mt-0.5" />
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-semibold text-white">
                      Local Development Dashboard Preview
                    </h2>
                    <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                      DATABASE_URL is not connected in local development yet. Enter local preview access to inspect the Admin Dashboard UI. Production deployments require Neon authentication.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Display Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={previewName}
                    onChange={(e) => setPreviewName(e.target.value)}
                    placeholder="e.g. Theresa Odediran"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#090909] border border-white/15 text-sm text-white focus:outline-none focus:border-[#D4AF5A]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    enterPreviewMode(previewName);
                    showToast('Entered Local Admin Dashboard Preview Mode.');
                    navigate('/admin', { replace: true });
                  }}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-[#E8BE62] to-[#D4AF5A] text-[#090909] text-sm font-bold hover:brightness-105 transition-all inline-flex items-center justify-center gap-2 shadow-lg"
                >
                  <Lock className="w-4 h-4" />
                  Open Admin Dashboard Preview
                </button>
              </div>
            )}

            <div className="bg-[#141414] border border-white/15 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-[#E8BE62] shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-serif text-lg font-semibold text-white">
                    {serverStatus?.databaseConfigured
                      ? 'Database Schema Initialization Required'
                      : 'Connect Neon PostgreSQL & Vercel Blob'}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    Once <code className="text-[#E8BE62]">DATABASE_URL</code> is set and migrations run, administrator authentication activates automatically.
                  </p>
                </div>
              </div>

              <ol className="text-xs text-neutral-300 space-y-2 list-decimal list-inside">
                <li>
                  Add <code className="text-[#E8BE62]">DATABASE_URL</code>,{' '}
                  <code className="text-[#E8BE62]">JWT_SECRET</code>,{' '}
                  <code className="text-[#E8BE62]">ADMIN_INITIAL_EMAIL</code>,{' '}
                  <code className="text-[#E8BE62]">ADMIN_INITIAL_PASSWORD</code>, and{' '}
                  <code className="text-[#E8BE62]">BLOB_READ_WRITE_TOKEN</code> in Vercel Environment Variables.
                </li>
                <li>
                  Run <code className="text-[#E8BE62]">npm run db:migrate</code> against your Neon{' '}
                  <code className="text-[#E8BE62]">DATABASE_URL</code> (or run the SQL files in{' '}
                  <code className="text-[#E8BE62]">migrations/</code>).
                </li>
              </ol>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={checkConfig}
                  disabled={checkingConfig}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#D4AF5A]/40 text-[#E8BE62] text-xs font-semibold hover:bg-white/5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkingConfig ? 'animate-spin' : ''}`} />
                  {checkingConfig ? 'Checking...' : 'Recheck Connection'}
                </button>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-xs font-medium text-neutral-300 hover:text-[#E8BE62]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to Public Storefront
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#141414] border border-[#D4AF5A]/30 rounded-2xl p-5 sm:p-8 space-y-5">
            {serverStatus && !serverStatus.adminExists && mode !== 'bootstrap' && (
              <div className="bg-[#1F1A10] border border-[#D4AF5A]/45 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-[#E8BE62]">
                  <ShieldCheck className="w-4 h-4" />
                  First-Time Super Admin Setup Ready
                </div>
                <p className="text-neutral-300">
                  No administrator account exists yet. Create your initial Super Administrator login to unlock the dashboard.
                </p>
                <button
                  type="button"
                  onClick={() => setMode('bootstrap')}
                  className="px-3 py-1.5 rounded-md bg-[#D4AF5A] text-[#090909] font-semibold"
                >
                  Initialize Super Admin
                </button>
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
                  <span>Contact a Super Admin to reset credentials</span>
                  <Link to="/" className="hover:text-white">
                    Back to Storefront
                  </Link>
                </div>
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
                  This one-time setup hashes your password with bcrypt, creates your Super Administrator account in Neon PostgreSQL, and locks automatically once completed.
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
                  <label className="block text-xs text-neutral-300 mb-1">Admin Email</label>
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
                    placeholder="Minimum 10 characters"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#090909] border border-white/15 text-sm text-white"
                  />
                </div>
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
