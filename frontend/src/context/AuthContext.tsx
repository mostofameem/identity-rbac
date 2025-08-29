import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../services/api';

interface User {
  id: number;
  email: string;
  name: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasResourcePermission: (resource: string, action?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const loginResponse = await apiClient.login({
        email,
        password,
      });

      const { accessToken, refreshToken } = loginResponse.data;
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Fetch user permissions after successful login
      const permissionsResponse = await apiClient.getUserPermissions();
      const permissions = permissionsResponse.data.data || [];
      
      // Debug: Log permissions to console
      console.log('User permissions:', permissions);
      
      const userData: User = {
        id: 0, // We don't have user ID from backend
        email,
        name: email.split('@')[0], // Use email prefix as name
        permissions,
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    setUser(null);
  };

  // Check if user is already logged in on app start
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        logout();
      }
    }
  }, []);

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user || !user.permissions) return false;
    return permissions.some(permission => user.permissions?.includes(permission));
  };

  const hasResourcePermission = (resource: string, action?: string): boolean => {
    if (!user || !user.permissions) return false;
    if (action) {
      return user.permissions.includes(`${resource}.${action}`);
    }
    return user.permissions.some(permission => permission.startsWith(`${resource}.`));
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasResourcePermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 