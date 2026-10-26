// context/AuthContext.jsx — In-Memory Auth Context with guest check and silent refresh
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setMemoryToken, clearMemoryToken, executeSilentRefresh } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const hasLoggedInFlag = localStorage.getItem('logged_in') === 'true';

      // Skip silent refresh for guests
      if (!hasLoggedInFlag) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const { user: refreshedUser } = await executeSilentRefresh();
        if (isMounted) {
          setUser(refreshedUser);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          clearMemoryToken();
          localStorage.removeItem('logged_in');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback((userData, accessToken) => {
    setMemoryToken(accessToken);
    setUser(userData);
    localStorage.setItem('logged_in', 'true');
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignored: cleanup state regardless
    } finally {
      clearMemoryToken();
      setUser(null);
      localStorage.removeItem('logged_in');
    }
  }, []);

  const updateUser = useCallback((updatedUserData) => {
    setUser(prev => ({ ...prev, ...updatedUserData }));
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
