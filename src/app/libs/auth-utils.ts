import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './auth-context';

// Hook for protecting pages that require authentication
export const useRequireAuth = (redirectTo: string = '/login') => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const loginUrl = new URL(redirectTo, window.location.origin);
      loginUrl.searchParams.set('redirect', pathname);
      router.push(loginUrl.toString());
    }
  }, [isAuthenticated, loading, router, pathname, redirectTo]);

  return { isAuthenticated, loading };
};

// Hook for protecting admin-only pages
export const useRequireAdmin = (redirectTo: string = '/unauthorized') => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push(redirectTo);
      }
    }
  }, [isAuthenticated, isAdmin, loading, router, redirectTo]);

  return { isAuthenticated, isAdmin, loading };
};

// Utility functions for cookie management
export const cookieUtils = {
  set: (name: string, value: string, days: number = 1) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/`;
  },

  get: (name: string): string | null => {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },

  delete: (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/`;
  },

  setAuthCookies: (token: string, role: string, isAdmin: boolean) => {
    cookieUtils.set('accessToken', token);
    cookieUtils.set('userRole', role);
    cookieUtils.set('isAdminMode', isAdmin.toString());
  },

  clearAuthCookies: () => {
    cookieUtils.delete('accessToken');
    cookieUtils.delete('userRole');
    cookieUtils.delete('isAdminMode');
  }
};

// Custom hook for handling authentication on protected pages
export const useAuthGuard = (options: {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
} = {}) => {
  const {
    requireAuth = true,
    requireAdmin = false,
    redirectTo = '/singin'
  } = options;

  const { isAuthenticated, isAdmin, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !isAuthenticated) {
        const loginUrl = new URL('/signin', window.location.origin);
        loginUrl.searchParams.set('redirect', pathname);
        router.push(loginUrl.toString());
        return;
      }

      if (requireAdmin && isAuthenticated && !isAdmin) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [
    loading,
    isAuthenticated,
    isAdmin,
    requireAuth,
    requireAdmin,
    router,
    pathname
  ]);

  return {
    isAuthenticated,
    isAdmin,
    loading,
    user,
    canAccess: isAuthenticated && (!requireAdmin || isAdmin)
  };
};