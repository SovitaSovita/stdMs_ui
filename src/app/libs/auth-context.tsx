// lib/auth-context.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Types
interface User {
  token: string;
  role: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, role: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('accessToken');
        const storedRole = localStorage.getItem('userRole');
        const storedIsAdmin = localStorage.getItem('isAdminMode');

        if (storedToken && storedRole) {
          setUser({
            token: storedToken,
            role: storedRole,
            isAdmin: storedIsAdmin === 'true'
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear potentially corrupted data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('isAdminMode');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (token: string, role: string) => {
    const isAdmin = role === 'ADMIN';
    const userData: User = {
      token,
      role,
      isAdmin
    };

    // Store in localStorage
    localStorage.setItem('accessToken', token);
    localStorage.setItem('userRole', role);
    localStorage.setItem('isAdminMode', isAdmin.toString());

    setUser(userData);
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('isAdminMode');

    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for login integration
export const useLogin = () => {
  const { login } = useAuth();
  const router = useRouter();

  const handleLoginSuccess = (
    accessToken: string, 
    isAdminMode: string, 
    role: string = isAdminMode === 'true' ? 'ADMIN' : 'USER',
    redirectTo: string = '/'
  ) => {
    login(accessToken, role);
    router.push(redirectTo);
  };

  return { handleLoginSuccess };
};

// Loading Component
export const AuthLoading: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
  </div>
);