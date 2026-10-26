import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AlertTriangle, MailCheck, Loader2 } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Layout() {
  const { user } = useAuth();
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

  const handleResend = async () => {
    setResending(true);
    setResendStatus('');
    try {
      const res = await api.post('/api/auth/resend-verification');
      setResendStatus(res.data?.message || 'Verification link sent to your inbox!');
    } catch (err) {
      setResendStatus(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to resend. Please wait before retrying.'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-background">
      {/* Global Email Verification Notice if user is logged in but unverified */}
      {user && user.email_verified === false && (
        <div className="bg-amber-500/15 border-b border-amber-500/25 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 text-on-surface">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <span>
              Your email <strong className="font-semibold">{user.email}</strong> is not verified. Please verify your email to unlock room booking and listing features.
            </span>
          </div>

          <div className="flex items-center gap-3">
            {resendStatus && (
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                {resendStatus}
              </span>
            )}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="px-3 py-1 bg-amber-500 text-white font-semibold rounded-lg text-[11px] hover:bg-amber-600 transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50"
            >
              {resending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <MailCheck className="h-3 w-3" />
                  <span>Resend Verification Email</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
