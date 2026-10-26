import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  Mail,
  Lock,
  KeyRound,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard';

  // Tabs: 'password' | 'otp'
  const [authMode, setAuthMode] = useState('password');

  // Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // OTP state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState(1); // 1: enter phone, 2: enter otp
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);

  // OTP Countdown
  useEffect(() => {
    let timer;
    if (otpTimer > 0) {
      timer = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpTimer]);

  // Handle Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordLoading(true);

    try {
      const res = await api.post('/api/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      const { user, accessToken } = res.data;
      login(user, accessToken);
      navigate(from, { replace: true });
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || err.response?.data?.error || 'Invalid email or password.'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setOtpError('');

    // Normalize phone (strip non-digits, take last 10)
    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      setOtpError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setOtpLoading(true);

    try {
      await api.post('/api/auth/send-otp', {
        phone: cleanedPhone.slice(-10),
      });

      setOtpStep(2);
      setOtpTimer(60); // 60s cooldown
    } catch (err) {
      setOtpError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to send verification code. Please check the number.'
      );
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');

    if (otp.trim().length !== 6) {
      setOtpError('Please enter the complete 6-digit verification code.');
      return;
    }

    setOtpLoading(true);

    try {
      const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
      const res = await api.post('/api/auth/verify-otp', {
        phone: cleanedPhone,
        otp: otp.trim(),
      });

      const { user, accessToken, is_new_user } = res.data;
      login(user, accessToken);

      if (is_new_user) {
        navigate('/complete-profile', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setOtpError(
        err.response?.data?.message || err.response?.data?.error || 'Invalid or expired OTP.'
      );
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-surface rounded-3xl p-8 border border-outline-variant/30 sharp-shadow-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold tracking-tight text-primary mb-1">
            NestMate<span className="text-primary-container">.</span>
          </div>
          <h1 className="text-xl font-bold text-on-surface">Welcome Back</h1>
          <p className="text-xs text-on-surface-variant">
            Sign in to access your student bookings or landlord property console.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-surface-container-low rounded-xl border border-outline-variant/20">
          <button
            type="button"
            onClick={() => setAuthMode('password')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              authMode === 'password'
                ? 'bg-surface text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Email & Password
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('otp')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              authMode === 'otp'
                ? 'bg-surface text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Instant Phone OTP
          </button>
        </div>

        {/* Password Login Form */}
        {authMode === 'password' ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            {passwordError && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-xs text-error flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-on-surface mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-on-surface-variant/70" />
                <input
                  type="email"
                  required
                  placeholder="student@university.edu or name@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container/60 rounded-xl text-xs text-on-surface border border-outline focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-on-surface-variant/70" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container/60 rounded-xl text-xs text-on-surface border border-outline focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full btn-primary py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {passwordLoading ? (
                'Signing In...'
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Phone OTP Login Form */
          <div className="space-y-4">
            {otpError && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-xs text-error flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{otpError}</span>
              </div>
            )}

            {otpStep === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-on-surface mb-1">Mobile Number</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-semibold text-on-surface-variant">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      maxLength={10}
                      className="w-full pl-12 pr-4 py-2.5 bg-surface-container/60 rounded-xl text-xs text-on-surface border border-outline focus:border-primary focus:outline-none"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-on-surface-variant">
                    We will send a 6-digit SMS verification code to this number.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full btn-primary py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {otpLoading ? (
                    'Sending Code...'
                  ) : (
                    <>
                      <span>Get Verification Code</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-on-surface">Enter 6-Digit OTP</label>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep(1);
                        setOtp('');
                        setOtpError('');
                      }}
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      Change Number
                    </button>
                  </div>

                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-on-surface-variant/70" />
                    <input
                      type="text"
                      required
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      maxLength={6}
                      autoFocus
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-container/60 rounded-xl text-sm font-mono tracking-widest text-on-surface border border-outline focus:border-primary focus:outline-none text-center"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-on-surface-variant">Sent to +91 {phone}</span>
                    {otpTimer > 0 ? (
                      <span className="text-on-surface-variant flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Resend in {otpTimer}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-primary font-semibold hover:underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full btn-primary py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {otpLoading ? (
                    'Verifying...'
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Verify & Continue</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer Link */}
        <div className="pt-4 border-t border-outline/50 text-center">
          <p className="text-xs text-on-surface-variant">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
