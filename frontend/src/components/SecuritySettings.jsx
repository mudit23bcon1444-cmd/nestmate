import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  KeyRound,
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  Trash2,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  MailCheck,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import PasswordInput from './PasswordInput';

export default function SecuritySettings() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  // Resend Verification State
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');

  // Fetch Active Sessions
  const {
    data: sessionsData,
    isLoading: loadingSessions,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: ['auth-sessions'],
    queryFn: async () => {
      const res = await api.get('/api/auth/sessions');
      return res.data?.sessions || [];
    },
  });

  // Revoke Single Session Mutation
  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId) => {
      await api.delete(`/api/auth/sessions/${sessionId}`);
    },
    onSuccess: () => {
      refetchSessions();
    },
  });

  // Logout All Sessions Mutation
  const logoutAllMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/auth/logout-all');
    },
    onSuccess: () => {
      logout();
      navigate('/login');
    },
  });

  // Handle Change Password Submit
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (newPassword.length < 10) {
      setPwdError('New password must be at least 10 characters long.');
      return;
    }

    const byteLen = new TextEncoder().encode(newPassword).length;
    if (byteLen > 72) {
      setPwdError('New password exceeds maximum allowed length of 72 bytes.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }

    setPwdLoading(true);

    try {
      const res = await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setPwdSuccess(
        res.data?.message || 'Password changed successfully! All other sessions have been signed out.'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      refetchSessions();
    } catch (err) {
      setPwdError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to update password. Please check your current password.'
      );
    } finally {
      setPwdLoading(false);
    }
  };

  // Handle Resend Verification Email
  const handleResendVerification = async () => {
    setResendError('');
    setResendSuccess('');
    setResendLoading(true);

    try {
      const res = await api.post('/api/auth/resend-verification');
      setResendSuccess(res.data?.message || 'Verification link sent! Please check your inbox.');
    } catch (err) {
      setResendError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to send verification email. Please try again later.'
      );
    } finally {
      setResendLoading(false);
    }
  };

  // Helper to pick device icon
  const getDeviceIcon = (deviceStr = '') => {
    const lower = deviceStr.toLowerCase();
    if (lower.includes('mobile') || lower.includes('phone') || lower.includes('iphone') || lower.includes('android')) {
      return <Smartphone className="h-5 w-5 text-primary" />;
    }
    if (lower.includes('tablet') || lower.includes('ipad')) {
      return <Tablet className="h-5 w-5 text-primary" />;
    }
    return <Laptop className="h-5 w-5 text-primary" />;
  };

  // Format relative or date time
  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Active recently';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── Email Verification Status Banner ─────────────────────────────── */}
      {!user?.email_verified && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-on-surface">Email Verification Required</h4>
              <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                Your email (<span className="font-semibold text-on-surface">{user?.email}</span>) has not been verified yet.
                Creating listings and requesting property bookings require a verified email address.
              </p>
              {resendSuccess && (
                <p className="text-[11px] text-emerald-500 font-medium mt-1.5 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {resendSuccess}
                </p>
              )}
              {resendError && (
                <p className="text-[11px] text-red-500 font-medium mt-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> {resendError}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resendLoading}
            className="btn-primary py-2 px-4 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 self-end sm:self-center disabled:opacity-50"
          >
            {resendLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <MailCheck className="h-3.5 w-3.5" />
                <span>Resend Verification Email</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ─── Grid: Change Password & Sessions ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ─── Change Password Section ───────────────────────────────────── */}
        <section className="bg-surface rounded-2xl p-6 sharp-shadow border border-outline-variant/20 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/15">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-on-surface">Change Password</h3>
              <p className="text-[11px] text-on-surface-variant">
                Update your account password. Changing password revokes all other active sessions.
              </p>
            </div>
          </div>

          {pwdSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{pwdSuccess}</span>
            </div>
          )}

          {pwdError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{pwdError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="current-password" className="block text-xs font-medium text-on-surface mb-1.5">
                Current Password
              </label>
              <PasswordInput
                id="current-password"
                name="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                autoComplete="current-password"
                showStrengthMeter={false}
                required
              />
            </div>

            <div>
              <label htmlFor="new-acc-password" className="block text-xs font-medium text-on-surface mb-1.5">
                New Password
              </label>
              <PasswordInput
                id="new-acc-password"
                name="new-acc-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 10 chars)"
                autoComplete="new-password"
                showStrengthMeter={true}
                userInputs={[user?.email, user?.name].filter(Boolean)}
                required
              />
            </div>

            <div>
              <label htmlFor="confirm-acc-password" className="block text-xs font-medium text-on-surface mb-1.5">
                Confirm New Password
              </label>
              <PasswordInput
                id="confirm-acc-password"
                name="confirm-acc-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                autoComplete="new-password"
                showStrengthMeter={false}
                required
              />
            </div>

            <button
              type="submit"
              disabled={pwdLoading}
              className="w-full btn-primary py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {pwdLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* ─── Active Sessions Section ───────────────────────────────────── */}
        <section className="bg-surface rounded-2xl p-6 sharp-shadow border border-outline-variant/20 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-on-surface">Active Sessions</h3>
                <p className="text-[11px] text-on-surface-variant">
                  Devices currently signed into your NestMate account.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => logoutAllMutation.mutate()}
              disabled={logoutAllMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-500/10 border border-red-500/20 transition-all disabled:opacity-50"
              title="Sign out from all devices"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out All</span>
            </button>
          </div>

          {loadingSessions ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-2 text-on-surface-variant">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs">Loading active sessions...</p>
            </div>
          ) : !sessionsData || sessionsData.length === 0 ? (
            <p className="text-xs text-on-surface-variant py-4 text-center">
              No active session information available.
            </p>
          ) : (
            <div className="space-y-3">
              {sessionsData.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    session.current
                      ? 'bg-primary/5 border-primary/30'
                      : 'bg-surface-container/40 border-outline-variant/30 hover:bg-surface-container/70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                      {getDeviceIcon(session.device)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-on-surface truncate">
                          {session.device || 'Unknown Browser'}
                        </p>
                        {session.current && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white shrink-0">
                            Current Device
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-0.5">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          <span>{session.ip || 'Masked IP'}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 truncate">
                          <Clock className="h-3 w-3" />
                          <span>Last active: {formatDateTime(session.last_used_at || session.created_at)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {!session.current && (
                    <button
                      type="button"
                      onClick={() => revokeSessionMutation.mutate(session.id)}
                      disabled={revokeSessionMutation.isPending}
                      className="p-2 rounded-lg text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0 disabled:opacity-50"
                      title="Revoke session"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
