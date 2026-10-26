import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate('/');
  };

  const isBrowse = location.pathname === '/browse';
  const isHome = location.pathname === '/' || location.pathname === '/home';
  const isDashboard = location.pathname === '/dashboard';

  return (
    <nav className="sticky top-0 w-full z-50 bg-surface/90 backdrop-blur-lg border-b border-outline-variant/10">
      <div className="flex justify-between items-center px-4 sm:px-6 py-4 max-w-7xl mx-auto">
        {/* Brand Logo with Orange Dot */}
        <Link
          to="/"
          onClick={() => setMobileMenuOpen(false)}
          className="text-2xl font-bold tracking-tight text-primary hover:opacity-90 transition-opacity flex items-center"
        >
          NestMate<span className="text-primary-container">.</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-[15px]">
          <Link
            to="/"
            className={`${
              isHome
                ? 'text-primary font-semibold border-b-2 border-primary pb-1'
                : 'text-on-surface-variant/80 hover:text-primary transition-colors duration-200'
            }`}
          >
            Home
          </Link>

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
                isDashboard ? 'text-primary font-semibold border-b-2 border-primary pb-1' : 'text-on-surface-variant/80'
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
                isDashboard ? 'text-primary font-semibold border-b-2 border-primary pb-1' : 'text-on-surface-variant/80'
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
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 transition-colors"
                title={`${user.name} (${user.role || 'Member'})`}
              >
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
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
                aria-label="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <Link
                to="/login"
                className="text-on-surface-variant font-medium hover:bg-primary/5 rounded-lg px-4 py-2 transition-all text-sm"
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

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 text-on-surface-variant hover:text-primary rounded-lg transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-outline-variant/15 bg-surface/98 px-6 py-4 space-y-3 animate-fade-in shadow-xl">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2 text-sm font-medium ${isHome ? 'text-primary font-bold' : 'text-on-surface-variant'}`}
          >
            Home
          </Link>
          <Link
            to="/browse"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2 text-sm font-medium ${isBrowse ? 'text-primary font-bold' : 'text-on-surface-variant'}`}
          >
            Browse Listings
          </Link>

          {(!isAuthenticated || user?.role === 'owner' || user?.role === 'admin') && (
            <Link
              to={isAuthenticated ? '/listing/new' : '/register'}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-on-surface-variant hover:text-primary"
            >
              List Property
            </Link>
          )}

          {isAuthenticated && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-2 text-sm font-medium ${isDashboard ? 'text-primary font-bold' : 'text-on-surface-variant'}`}
            >
              {user?.role === 'student' ? 'My Bookings' : 'Owner Dashboard'}
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-on-surface-variant hover:text-primary"
            >
              Admin Portal
            </Link>
          )}

          <a
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-on-surface-variant hover:text-primary"
          >
            About NestMate
          </a>

          {!isAuthenticated && (
            <div className="pt-3 border-t border-outline-variant/15 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-outline-variant/50 text-xs font-semibold text-on-surface"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-primary text-white text-xs font-semibold"
              >
                Create Free Account
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
