import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import client from '../api/client';

export type OnboardingStep = 
  | 'sso_complete'
  | 'face_liveness_verified'
  | 'identity_verified'
  | 'business_profile_created'
  | 'business_verified'
  | 'financials_provided'
  | 'completed';

interface AuthContextData {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  onboardingStep: OnboardingStep | null;
  checkSession: () => Promise<void>;
  login: (code: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep | null>(null);

  const checkSession = async () => {
    setIsLoading(true);
    try {
      const res = await client.get('/auth/session');
      if (res.data.authenticated) {
        setIsAuthenticated(true);
        setUser(res.data.user);
        
        // Also fetch onboarding status
        const statusRes = await client.get('/onboarding/status');
        setOnboardingStep(statusRes.data.currentStep);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setOnboardingStep(null);
      }
    } catch (error) {
      console.log('Session check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      setOnboardingStep(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (code: string) => {
    try {
      setIsLoading(true);
      const res = await client.post('/auth/egov/exchange', { code });
      // If we got here, cookie is set.
      await checkSession();
    } catch (error) {
      console.log('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await client.post('/auth/logout');
    } catch (error) {
      console.log('Logout error', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setOnboardingStep(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, onboardingStep, checkSession, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
