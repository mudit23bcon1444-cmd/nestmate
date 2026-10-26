import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight, Mail } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const verificationAttempted = useRef(false);

  useEffect(() => {
    const rawToken = searchParams.get('token');

    // Immediately remove sensitive token from browser address bar & history
    if (rawToken) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (verificationAttempted.current) return;
    verificationAttempted.current = true;

    if (!rawToken) {
      setStatus('error');
      setMessage('No verification token provided or the link is incomplete.');
      return;
    }

    const verify = async () => {
      try {
        const res = await api.post('/api/auth/verify-email', { token: rawToken });
        setStatus('success');
        setMessage(res.data?.message || 'Your email address has been successfully verified!');
        if (user) {
          updateUser({ email_verified: true });
        }
      } catch (err) {
        setStatus('error');
        setMessage(
          err.response?.data?.message ||
            err.response?.data?.error ||
            'Verification link is invalid or has expired. Please request a new one.'
        );
      }
    };

    verify();
  }, [searchParams, user, updateUser]);

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-surface rounded-3xl p-8 border border-outline-variant/30 sharp-shadow-lg text-center space-y-6">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-surface-container border border-outline-variant/50">
          <Mail className="h-8 w-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-on-surface">Email Verification</h1>
          <p className="text-xs text-on-surface-variant">
            Verifying your NestMate university account credentials.
          </p>
        </div>

        {status === 'verifying' && (
          <div className="py-8 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-xs text-on-surface-variant font-medium">Validating verification token...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4 space-y-6">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex flex-col items-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="text-xs font-semibold">{message}</p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate(user ? '/dashboard' : '/login')}
                className="w-full btn-primary py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
              >
                <span>{user ? 'Continue to Dashboard' : 'Proceed to Login'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4 space-y-6">
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex flex-col items-center space-y-2">
              <XCircle className="h-10 w-10 text-red-500" />
              <p className="text-xs font-semibold">{message}</p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link
                to="/dashboard"
                className="w-full btn-primary py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="text-xs text-on-surface-variant hover:text-primary transition-colors py-2"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
