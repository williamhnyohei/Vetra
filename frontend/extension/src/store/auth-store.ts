import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    provider: 'google' | 'guest';
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
      // Development fallback - always use mock for now
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      
      const mockGoogleUser = {
        id: 'google-user-dev-123',
        email: 'dev@vetra.com',
        name: 'Google User (Dev)',
        picture: 'https://via.placeholder.com/40'
      };
      
      set({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: mockGoogleUser.id,
          email: mockGoogleUser.email,
          name: mockGoogleUser.name,
          avatar: mockGoogleUser.picture,
          provider: 'google'
        },
        error: null
      });
      
      // Store in localStorage instead of chrome.storage for now
      localStorage.setItem('vetra-auth', JSON.stringify({
        provider: 'google',
        user: {
          id: mockGoogleUser.id,
          email: mockGoogleUser.email,
          name: mockGoogleUser.name,
          avatar: mockGoogleUser.picture
        }
      }));
      
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
    // Clear local storage
    localStorage.removeItem('vetra-auth');
    
    set({
      isAuthenticated: false,
      user: null,
      error: null
    });
  },
  
  checkAuthStatus: async () => {
    set({ isLoading: true });
    
    try {
      // Check localStorage first
      const authData = localStorage.getItem('vetra-auth');
      
      if (authData) {
        const { provider, user } = JSON.parse(authData);
        
        set({
          isAuthenticated: true,
          isLoading: false,
          user: {
            ...user,
            provider: provider
          }
        });
        return;
      }
      
      // No valid auth found
      set({
        isAuthenticated: false,
        isLoading: false,
        user: null
      });
      
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