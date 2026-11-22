import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ROUTES } from '../constants/routes';
import { Mail, Lock, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button, Input, Modal, Badge, Logo } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { SPRING_GENTLE } from '../components/animations';

export const LoginPage: React.FC = () => {
  const [role, setRole] = useState<'CANDIDATE' | 'HR' | 'ADMIN'>('CANDIDATE');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forgot password modal state
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<string | null>(null);

  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || ROUTES.HOME;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      await signIn(email, password, role);
      setSuccessMessage(`Signed in successfully as ${email}`);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      await signInWithGoogle(role);
      setSuccessMessage(`Signed in via Google OAuth as ${role}`);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetStatus('Please enter your account email.');
      return;
    }
    setResetLoading(true);
    setResetStatus(null);
    try {
      await resetPassword(resetEmail);
      setResetStatus(`Password reset email dispatched to: ${resetEmail}`);
    } catch (err: any) {
      setResetStatus(`Reset failed: ${err.message}`);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={SPRING_GENTLE}
        className="max-w-md w-full space-y-6 bg-white p-8 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-1">
            <Logo variant="full" size="lg" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Sign in to Smart Employee</h2>
          <p className="text-sm text-slate-500">
            Access your applications, applicant pipeline, and hiring portal
          </p>
        </div>

        {/* Emulator notice banner */}
        <div className="p-3 rounded-xl bg-brand-50/70 border border-brand-100 flex items-center justify-between text-xs text-brand-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
            <span>Firebase Auth Emulator Active</span>
          </div>
          <Badge variant="primary" size="sm">port 9099</Badge>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Persona / Role Selector for Google Sign-In & Onboarding */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
            Continue as
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'CANDIDATE', label: 'Candidate' },
                { id: 'HR', label: 'HR / Recruiter' },
                { id: 'ADMIN', label: 'Admin' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setRole(item.id);
                  if (item.id === 'CANDIDATE') {
                    setEmail('candidate@ats.local');
                    setPassword('CandidatePassword123!');
                  } else if (item.id === 'HR') {
                    setEmail('hr@ats.local');
                    setPassword('HrPassword123!');
                  } else if (item.id === 'ADMIN') {
                    setEmail('admin@ats.local');
                    setPassword('AdminPassword123!');
                  }
                }}
                className={`py-2 text-xs font-medium rounded-md transition ${
                  role === item.id
                    ? 'bg-white text-brand-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Quick Demo 1-Click Access */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
            <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Demo Quick:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={async () => {
                  setRole('CANDIDATE');
                  setEmail('candidate@ats.local');
                  setPassword('CandidatePassword123!');
                  try {
                    setLoading(true);
                    await signIn('candidate@ats.local', 'CandidatePassword123!', 'CANDIDATE');
                    navigate(from, { replace: true });
                  } catch (err: any) {
                    setErrorMessage(err.message || 'Candidate sign in failed');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-2 py-0.5 rounded text-2xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                👤 Candidate
              </button>
              <button
                type="button"
                onClick={async () => {
                  setRole('HR');
                  setEmail('hr@ats.local');
                  setPassword('HrPassword123!');
                  try {
                    setLoading(true);
                    await signIn('hr@ats.local', 'HrPassword123!', 'HR');
                    navigate(from, { replace: true });
                  } catch (err: any) {
                    setErrorMessage(err.message || 'HR sign in failed');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-2 py-0.5 rounded text-2xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
              >
                💼 HR Lead
              </button>
              <button
                type="button"
                onClick={async () => {
                  setRole('ADMIN');
                  setEmail('admin@ats.local');
                  setPassword('AdminPassword123!');
                  try {
                    setLoading(true);
                    await signIn('admin@ats.local', 'AdminPassword123!', 'ADMIN');
                    navigate(from, { replace: true });
                  } catch (err: any) {
                    setErrorMessage(err.message || 'Admin sign in failed');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-2 py-0.5 rounded text-2xs font-medium bg-purple-50 hover:bg-purple-100 text-purple-700 transition"
              >
                🛡️ Super Admin
              </button>
            </div>
          </div>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google as {role === 'HR' ? 'HR' : role === 'ADMIN' ? 'Admin' : 'Candidate'}
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-2 text-xs text-slate-400 uppercase tracking-wider absolute">
            Or with email
          </span>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => setResetModalOpen(true)}
                className="text-xs text-brand-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
            />
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
            Sign In
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to={ROUTES.REGISTER} className="text-brand-600 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </motion.div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => {
          setResetModalOpen(false);
          setResetStatus(null);
        }}
        title="Reset Password"
        subtitle="We'll send you an email instructions to reset your account password"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setResetModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={resetLoading}
              onClick={handlePasswordReset}
            >
              Send Reset Link
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Account Email"
            type="email"
            required
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="name@company.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          {resetStatus && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{resetStatus}</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
