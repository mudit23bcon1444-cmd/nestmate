import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api/client';
import PasswordInput from '../components/PasswordInput';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const rawToken = searchParams.get('token');
    if (rawToken) {
      setToken(rawToken);
      // Immediately strip sensitive token from URL query parameter
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Missing or expired reset token. Please request a new password reset link.');
      return;
    }

    if (password.length < 10) {
      setError('Password must be at least 10 characters long.');
      return;
    }

    const byteLength = new TextEncoder().encode(password).length;
    if (byteLength > 72) {
      setError('Password exceeds maximum allowed size (72 bytes).');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/auth/reset-password', {
        token,
        password,
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to reset password. The link may have expired or was already used.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-surface rounded-3xl p-8 border border-outline-variant/30 sharp-shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold tracking-tight text-primary mb-1">
            NestMate<span className="text-primary-container">.</span>
          </div>
          <h1 className="text-xl font-bold text-on-surface">Set New Password</h1>
          <p className="text-xs text-on-surface-variant">
            Create a strong, unique password for your account.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-4 space-y-6 text-center">
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex flex-col items-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="text-xs font-semibold">Your password has been reset successfully.</p>
              <p className="text-[11px] text-on-surface-variant pt-1">
                All existing sessions have been signed out for security. Please sign in with your new password.
              </p>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full btn-primary py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
            >
              <span>Proceed to Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : !token ? (
          <div className="py-4 space-y-6 text-center">
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex flex-col items-center space-y-2">
              <AlertCircle className="h-10 w-10 text-amber-500" />
              <p className="text-xs font-semibold">No reset token found</p>
              <p className="text-[11px] text-on-surface-variant pt-1">
                Your password reset link is invalid or incomplete. Please request a new one.
              </p>
            </div>

            <Link
              to="/forgot-password"
              className="w-full btn-primary py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
            >
              <span>Request Password Reset</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-xs font-medium text-on-surface mb-1.5">
                New Password
              </label>
              <PasswordInput
                id="new-password"
                name="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password (min. 10 chars)"
                autoComplete="new-password"
                showStrengthMeter={true}
                required
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-medium text-on-surface mb-1.5">
                Confirm New Password
              </label>
              <PasswordInput
                id="confirm-password"
                name="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                autoComplete="new-password"
                showStrengthMeter={false}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="text-xs text-on-surface-variant hover:text-primary transition-colors font-medium"
              >
                Cancel and return to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
