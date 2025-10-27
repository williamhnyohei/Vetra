import { create } from 'zustand';
import AuthService from '../services/auth-service';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    provider: 'google' | 'guest';
    token?: string;
  } | null;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  error: null,
  
  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const authService = AuthService.getInstance();
      const success = await authService.signInWithGoogle();
      
      if (success) {
        const authState = authService.getAuthState();
        const user = authState.user;
        
        if (user) {
          set({
            isAuthenticated: true,
            isLoading: false,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              avatar: user.picture,
              provider: 'google',
              token: authState.token || undefined
            },
            error: null
          });
        } else {
          throw new Error('No user data received from Google');
        }
      } else {
        throw new Error('Google authentication failed');
      }
      
    } catch (error: any) {
      console.error('Google login error:', error);
      set({
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Failed to authenticate with Google'
      });
    }
  },
  
  loginAsGuest: () => {
    set({
      isAuthenticated: true,
      user: {
        id: 'guest-user-id',
        email: 'guest@vetra.com',
        name: 'Guest User',
        provider: 'guest'
      }
    });
    
    // Store guest auth data in localStorage
    localStorage.setItem('vetra-auth', JSON.stringify({
      provider: 'guest',
      user: {
        id: 'guest-user-id',
        email: 'guest@vetra.com',
        name: 'Guest User'
      }
    }));
  },
  
  logout: async () => {
    try {
      const authService = AuthService.getInstance();
      await authService.signOut();
      
      set({
        isAuthenticated: false,
        user: null,
        error: null
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      set({
        isAuthenticated: false,
        user: null,
        error: error.message || 'Failed to logout'
      });
    }
  },
  
  checkAuthStatus: async () => {
    set({ isLoading: true });
    
    try {
      const authService = AuthService.getInstance();
      const authState = authService.getAuthState();
      
      if (authState.isAuthenticated && authState.user) {
        set({
          isAuthenticated: true,
          isLoading: false,
          user: {
            id: authState.user.id,
            email: authState.user.email,
            name: authState.user.name,
            avatar: authState.user.picture,
            provider: 'google',
            token: authState.token || undefined
          }
        });
      } else {
        set({
          isAuthenticated: false,
          isLoading: false,
          user: null
        });
      }
      
    } catch (error) {
      set({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: 'Failed to check authentication status'
      });
    }
  },
  
  clearError: () => {
    set({ error: null });
  }
}));