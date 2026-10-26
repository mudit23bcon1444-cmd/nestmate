import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { User, Mail, GraduationCap, Building, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [role, setRole] = useState(user?.role || 'student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }

    setLoading(true);

    try {
      // Update profile
      const res = await api.patch('/api/auth/profile', {
        name: name.trim(),
        email: email.trim() ? email.trim().toLowerCase() : undefined,
        role,
      });

      updateUser(res.data.user || { name, email, role });
      navigate('/dashboard', { replace: true });
    } catch {
      // If endpoint is not available, update local context and continue
      updateUser({ name, email, role });
      navigate('/dashboard', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-surface rounded-3xl p-8 border border-outline-variant/30 sharp-shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block text-3xl font-bold tracking-tight text-primary mb-1 hover:opacity-90 transition-opacity">
            NestMate<span className="text-primary-container">.</span>
          </Link>
          <h1 className="text-xl font-bold text-on-surface">Almost There!</h1>
          <p className="text-xs text-on-surface-variant">
            Please complete your profile to personalize your NestMate experience.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div>
          <label className="block text-xs font-medium text-on-surface mb-1.5">I am a:</label>
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
              <span>Student Tenant</span>
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
              <span>Property Owner</span>
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
            <label className="block text-xs font-medium text-on-surface mb-1">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-on-surface-variant/70" />
              <input
                type="text"
                required
                placeholder="Rohan Gupta"
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
                placeholder="rohan@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              'Saving Profile...'
            ) : (
              <>
                <span>Enter NestMate</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
