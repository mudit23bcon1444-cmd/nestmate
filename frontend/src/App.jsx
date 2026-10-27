import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Standard Pages
import Home from './pages/Home';
import Browse from './pages/Browse';
import PropertyDetail from './pages/PropertyDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import CompleteProfile from './pages/CompleteProfile';
import Dashboard from './pages/Dashboard';
import CreateListing from './pages/CreateListing';
import EditListing from './pages/EditListing';
import Admin from './pages/Admin';

// Lazy-loaded Hardening & Recovery Pages
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
      <p className="text-xs text-on-surface-variant font-medium">Loading security page...</p>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-extrabold text-primary">404</h1>
      <h2 className="mt-2 text-2xl font-bold text-on-surface">Page Not Found</h2>
      <p className="mt-1 text-xs text-on-surface-variant max-w-sm">
        The page you are looking for doesn't exist or has moved.
      </p>
      <a href="/" className="mt-6 btn-primary py-2 px-5 rounded-xl text-xs font-semibold">
        Return Home
      </a>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Public Routes */}
              <Route index element={<Home />} />
              <Route path="home" element={<Home />} />
              <Route path="browse" element={<Browse />} />
              <Route path="property/:id" element={<PropertyDetail />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />

              {/* Lazy-loaded Auth Recovery & Verification Routes */}
              <Route
                path="verify-email"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <VerifyEmail />
                  </Suspense>
                }
              />
              <Route
                path="forgot-password"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ForgotPassword />
                  </Suspense>
                }
              />
              <Route
                path="reset-password"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ResetPassword />
                  </Suspense>
                }
              />

              {/* Authenticated User Routes */}
              <Route
                path="complete-profile"
                element={
                  <ProtectedRoute>
                    <CompleteProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Owner & Admin Routes */}
              <Route
                path="listing/new"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin']}>
                    <CreateListing />
                  </ProtectedRoute>
                }
              />
              <Route
                path="edit/:id"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin']}>
                    <EditListing />
                  </ProtectedRoute>
                }
              />

              {/* Superadmin Only Routes */}
              <Route
                path="admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Admin />
                  </ProtectedRoute>
                }
              />

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
