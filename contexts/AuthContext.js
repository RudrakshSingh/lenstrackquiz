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
            localStorage.removeItem('lenstrack_refresh_token');
          }
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        // 401 or other error - try to refresh token
        if (response.status === 401) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            // Retry session validation with new token
            const retryResponse = await fetch('/api/auth/session', {
              headers: {
                'Authorization': `Bearer ${newToken}`,
              },
            });
            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              if (retryData.success && retryData.data && retryData.data.user) {
                setUser(retryData.data.user);
                setIsAuthenticated(true);
                setIsLoading(false);
                return;
              }
            }
          }
        }
        // 401 or other error - just clear auth state
        if (typeof window !== 'undefined') {
          localStorage.removeItem('lenstrack_token');
          localStorage.removeItem('lenstrack_refresh_token');
        }
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Session validation error:', error);
      // Don't crash on network errors - just clear auth state
      if (typeof window !== 'undefined') {
        localStorage.removeItem('lenstrack_token');
        localStorage.removeItem('lenstrack_refresh_token');
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

    const { token, refreshToken, user: userData } = data.data;
    if (typeof window !== 'undefined') {
      localStorage.setItem('lenstrack_token', token);
      if (refreshToken) {
        localStorage.setItem('lenstrack_refresh_token', refreshToken);
      }
    }
    setUser(userData);
    setIsAuthenticated(true);
  };

  const refreshAccessToken = async () => {
    if (typeof window === 'undefined') {
      return null;
    }

    const refreshToken = localStorage.getItem('lenstrack_refresh_token');
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Refresh token is invalid, clear auth
        localStorage.removeItem('lenstrack_token');
        localStorage.removeItem('lenstrack_refresh_token');
        setUser(null);
        setIsAuthenticated(false);
        return null;
      }

      const { token: newToken, refreshToken: newRefreshToken } = data.data;
      localStorage.setItem('lenstrack_token', newToken);
      if (newRefreshToken) {
        localStorage.setItem('lenstrack_refresh_token', newRefreshToken);
      }
      return newToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
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
        localStorage.removeItem('lenstrack_refresh_token');
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
        refreshAccessToken,
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
