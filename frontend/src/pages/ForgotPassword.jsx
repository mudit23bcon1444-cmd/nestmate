import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/api/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });
      setSubmitted(true);
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Too many reset requests. Please wait a few minutes before trying again.');
      } else {
        // Still treat as submitted to avoid enumeration unless it's a rate limit
        setSubmitted(true);
      }
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
          <h1 className="text-xl font-bold text-on-surface">Reset Your Password</h1>
          <p className="text-xs text-on-surface-variant">
            Enter your registered university email to receive a secure recovery link.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="py-4 space-y-6 text-center">
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex flex-col items-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="text-xs font-semibold leading-relaxed">
                If an account exists for <span className="font-bold underline">{email}</span>, we have sent a secure password reset link.
              </p>
              <p className="text-[11px] text-on-surface-variant pt-1">
                Please check your inbox and spam folder. The link is valid for 30 minutes.
              </p>
            </div>

            <Link
              to="/login"
              className="w-full btn-primary py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-on-surface mb-1.5">
                University Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full bg-surface-container/60 border border-outline rounded-xl pl-10 pr-4 py-2.5 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending reset link...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="text-xs text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-1.5 font-medium"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
