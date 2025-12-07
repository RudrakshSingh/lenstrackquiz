import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const validateSession = async () => {
    try {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }
      const token = localStorage.getItem('lenstrack_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/session', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.user) {
          setUser(data.data.user);
          setIsAuthenticated(true);
        } else {
          // Invalid response format
          if (typeof window !== 'undefined') {
            localStorage.removeItem('lenstrack_token');
          }
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        // 401 or other error - just clear auth state
        if (typeof window !== 'undefined') {
          localStorage.removeItem('lenstrack_token');
        }
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Session validation error:', error);
      // Don't crash on network errors - just clear auth state
      if (typeof window !== 'undefined') {
        localStorage.removeItem('lenstrack_token');
      }
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing token on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }
    const token = localStorage.getItem('lenstrack_token');
    if (token) {
      validateSession();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Login failed');
    }

    const { token, user: userData } = data.data;
    if (typeof window !== 'undefined') {
      localStorage.setItem('lenstrack_token', token);
    }
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('lenstrack_token');
        if (token) {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
        }
        localStorage.removeItem('lenstrack_token');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshSession = async () => {
    await validateSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
