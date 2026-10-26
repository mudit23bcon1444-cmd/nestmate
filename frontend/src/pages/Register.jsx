import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  User,
  Mail,
  Lock,
  GraduationCap,
  Building,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/api/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: cleanedPhone.slice(-10),
        password,
        role,
      });

      const { user, accessToken } = res.data;
      login(user, accessToken);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please check inputs.'
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
          <h1 className="text-xl font-bold text-on-surface">Create Your Account</h1>
          <p className="text-xs text-on-surface-variant">
            Join thousands of university students and verified property owners.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div>
          <label className="block text-xs font-medium text-on-surface mb-1.5">I want to:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                role === 'student'
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-surface-container text-on-surface-variant border-outline hover:border-primary/50'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Find Housing</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('owner')}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                role === 'owner'
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-surface-container text-on-surface-variant border-outline hover:border-primary/50'
              }`}
            >
              <Building className="h-4 w-4" />
              <span>List Property</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-xs text-error flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-on-surface mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-on-surface-variant/70" />
              <input
                type="text"
                required
                placeholder="Aarav Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container/60 rounded-xl text-xs text-on-surface border border-outline focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-on-surface mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-on-surface-variant/70" />
              <input
                type="email"
                required
                placeholder="aarav@college.edu or email@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container/60 rounded-xl text-xs text-on-surface border border-outline focus:border-primary focus:outline-none"
              />
            </div>
          </div>

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
          </div>

          <div>
            <label className="block text-xs font-medium text-on-surface mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-on-surface-variant/70" />
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container/60 rounded-xl text-xs text-on-surface border border-outline focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              'Creating Account...'
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-outline/50 text-center">
          <p className="text-xs text-on-surface-variant">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
