import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
} from 'lucide-react';
import { BrandLogo } from '@/src/components/BrandLogo';
import { useAdminAuth, type AuthAdminUser } from '@/src/contexts/AdminAuthContext';
import { useToast } from '@/src/contexts/ToastContext';
import { apiRequest, fetchBackendStatus, type BackendConfigStatus } from '@/src/lib/apiClient';

export function AdminLoginPage() {
  const { isAuthorizedAdmin, loading, signIn, setAuthenticatedSession } = useAdminAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'bootstrap'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [serverStatus, setServerStatus] = useState<BackendConfigStatus | null>(null);

  useEffect(() => {
    let active = true;
    fetchBackendStatus(true)
      .then((data) => {
        if (active) setServerStatus(data);
      })
      .catch(() => {
        // Login form still works directly via /api/auth/login
      });
    return () => {
      active = false;
    };
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
      showToast('Welcome to MCFD J Global Ventures Admin.');
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
      const res = await apiRequest<{ user: AuthAdminUser; token?: string }>('/api/auth/bootstrap', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          fullName: fullName.trim(),
        }),
      });
      setAuthenticatedSession(res.user, res.token ?? null);
      showToast('Super Administrator account created and signed in.');
      navigate('/admin', { replace: true });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Administrator setup failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const canShowBootstrapOption =
    Boolean(serverStatus?.databaseReachable) && !serverStatus?.adminExists;

  return (
    <div
      className="min-h-screen text-white flex flex-col justify-between p-4 sm:p-6"
      style={{
        background:
          'radial-gradient(circle at top, #3A1454 0%, #1B0928 45%, #0D0514 100%)',
      }}
    >
      <div className="max-w-md w-full mx-auto my-auto space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-block">
            <BrandLogo variant="dark" size="md" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
            Admin Sign In
          </h1>
          <p className="text-xs text-[#E8DDF3]">
            Sign in with your administrator email and password to access the dashboard.
          </p>
        </div>

        <div className="bg-[#160822]/90 border border-[#D4AF5A]/35 rounded-2xl p-6 sm:p-8 space-y-5 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
          {errorMsg && (
            <div className="bg-red-950/70 border border-red-400/50 rounded-lg p-3 text-xs text-red-100 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-login-email"
                  className="block text-xs font-medium text-[#F2E6C9] mb-1.5"
                >
                  Administrator Email
                </label>
                <input
                  id="admin-login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your admin email"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0D0514] border border-white/20 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#D4AF5A]"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-login-password"
                  className="block text-xs font-medium text-[#F2E6C9] mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-[#0D0514] border border-white/20 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#D4AF5A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#E8BE62]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-[#E8BE62] to-[#D4AF5A] text-[#1A0826] text-sm font-bold hover:brightness-105 disabled:opacity-60 transition-all inline-flex items-center justify-center gap-2 shadow-md"
              >
                <Lock className="w-4 h-4" />
                {submitting ? 'Signing In...' : 'Sign In to Dashboard'}
              </button>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-neutral-400">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 hover:text-[#E8BE62] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Storefront
                </Link>
                {canShowBootstrapOption && (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setMode('bootstrap');
                    }}
                    className="text-[#E8BE62] hover:underline"
                  >
                    First-time admin setup
                  </button>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={handleBootstrap} className="space-y-4">
              <div className="flex items-center gap-2 text-[#E8BE62]">
                <KeyRound className="w-4 h-4" />
                <h2 className="font-serif text-lg font-semibold">
                  Create First Super Administrator
                </h2>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                No administrator record exists in the database yet. Create your initial Super Administrator account to continue.
              </p>
              <div>
                <label
                  htmlFor="admin-bootstrap-name"
                  className="block text-xs font-medium text-[#F2E6C9] mb-1"
                >
                  Full Name
                </label>
                <input
                  id="admin-bootstrap-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0D0514] border border-white/20 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#D4AF5A]"
                />
              </div>
              <div>
                <label
                  htmlFor="admin-bootstrap-email"
                  className="block text-xs font-medium text-[#F2E6C9] mb-1"
                >
                  Administrator Email
                </label>
                <input
                  id="admin-bootstrap-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter admin email"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0D0514] border border-white/20 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#D4AF5A]"
                />
              </div>
              <div>
                <label
                  htmlFor="admin-bootstrap-password"
                  className="block text-xs font-medium text-[#F2E6C9] mb-1"
                >
                  Password (min 8 chars)
                </label>
                <div className="relative">
                  <input
                    id="admin-bootstrap-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-[#0D0514] border border-white/20 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#D4AF5A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#E8BE62]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-[#E8BE62] to-[#D4AF5A] text-[#1A0826] text-sm font-bold hover:brightness-105 disabled:opacity-60 transition-all inline-flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {submitting ? 'Creating Account...' : 'Create Admin & Sign In'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setMode('login');
                }}
                className="text-xs text-neutral-300 hover:text-[#E8BE62]"
              >
                Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>

      <p className="text-center text-[11px] text-neutral-400 pt-8">
        Developed by Emmanuel Kenny | StaySafelite
      </p>
    </div>
  );
}
