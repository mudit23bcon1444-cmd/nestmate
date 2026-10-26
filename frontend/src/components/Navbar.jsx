import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isBrowse = location.pathname === '/browse';
  const isHome = location.pathname === '/';

  return (
    <nav className="sticky top-0 w-full z-50 bg-surface/90 backdrop-blur-lg border-b border-outline-variant/10">
      <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        {/* Brand Logo with Orange Dot */}
        <Link to="/" className="text-2xl font-bold tracking-tight text-primary">
          NestMate<span className="text-primary-container">.</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-[15px]">
          <Link
            to="/browse"
            className={`${
              isBrowse
                ? 'text-primary font-semibold border-b-2 border-primary pb-1'
                : 'text-on-surface-variant/80 hover:text-primary transition-colors duration-200'
            }`}
          >
            Browse
          </Link>

          {/* List Property: ONLY for guests, owners, and admins. NEVER for students! */}
          {(!isAuthenticated || user?.role === 'owner' || user?.role === 'admin') && (
            <Link
              to={isAuthenticated ? '/listing/new' : '/register'}
              className={`hover:text-primary transition-colors duration-200 ${
                location.pathname === '/listing/new' ? 'text-primary font-semibold' : 'text-on-surface-variant/80'
              }`}
            >
              List Property
            </Link>
          )}

          {/* Student Specific: My Bookings */}
          {isAuthenticated && user?.role === 'student' && (
            <Link
              to="/dashboard"
              className={`hover:text-primary transition-colors duration-200 ${
                location.pathname === '/dashboard' ? 'text-primary font-semibold border-b-2 border-primary pb-1' : 'text-on-surface-variant/80'
              }`}
            >
              My Bookings
            </Link>
          )}

          {/* Owner/Admin Specific: Dashboard */}
          {isAuthenticated && (user?.role === 'owner' || user?.role === 'admin') && (
            <Link
              to="/dashboard"
              className={`hover:text-primary transition-colors duration-200 ${
                location.pathname === '/dashboard' ? 'text-primary font-semibold border-b-2 border-primary pb-1' : 'text-on-surface-variant/80'
              }`}
            >
              Dashboard
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className={`hover:text-primary transition-colors duration-200 ${
                location.pathname === '/admin' ? 'text-primary font-semibold border-b-2 border-primary pb-1' : 'text-on-surface-variant/80'
              }`}
            >
              Admin Portal
            </Link>
          )}

          <a
            href={isHome ? '#how-it-works' : '/#how-it-works'}
            className="text-on-surface-variant/80 hover:text-primary transition-colors duration-200"
          >
            About
          </a>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 transition-colors"
                title={`${user.name} (${user.role || 'Member'})`}
              >
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <div className="hidden sm:flex flex-col text-left pr-1">
                  <span className="text-xs font-bold text-on-surface leading-tight">
                    {user.name?.split(' ')[0] || 'User'}
                  </span>
                  <span className="text-[10px] text-primary capitalize leading-tight font-medium">
                    {user.role === 'student' ? 'Student' : user.role === 'owner' ? 'Owner' : user.role || 'Member'}
                  </span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden sm:block text-on-surface-variant font-medium hover:bg-primary/5 rounded-lg px-4 py-2 transition-all text-sm"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-primary-container text-white font-semibold px-6 py-2.5 rounded-lg active:scale-95 transition-transform shadow-sm text-sm"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
