import { create } from 'zustand';
import AuthService from '../services/auth-service';
import ApiService from '../services/api-service';

type AuthProvider = 'google' | 'guest';
type WalletProvider = 'phantom' | 'backpack' | 'solflare' | 'other';

interface WalletInfo {
  address: string;
  provider: WalletProvider;
  connectedAt: number;
}

interface AuthState {
  // auth
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    provider: AuthProvider;
    token?: string;
  } | null;
  error: string | null;

  // wallet
  wallet: WalletInfo | null;

  // actions
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  clearError: () => void;

  // wallet actions
  setWalletConnected: (wallet: WalletInfo) => void;
  disconnectWallet: () => void;
}

const LOCAL_KEY = 'vetra-auth';

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  error: null,
  wallet: null,

  // ---------- GOOGLE ----------
  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });

    try {
      const authService = AuthService.getInstance();
      const success = await authService.signInWithGoogle();

      if (!success) {
        throw new Error('Google authentication failed');
      }

      const authState = authService.getAuthState();
      const user = authState.user;

      if (!user) {
        throw new Error('No user data received from Google');
      }

      // seta token no api service
      if (authState.token) {
        const apiService = ApiService.getInstance();
        apiService.setAuthToken(authState.token);
        console.log('✅ Auth token set in API service');
      }

      const next = {
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.picture,
          provider: 'google' as const,
          token: authState.token || undefined,
        },
        error: null,
        // mantém wallet atual se tiver
        wallet: get().wallet ?? null,
      };

      // persiste
      localStorage.setItem(
        LOCAL_KEY,
        JSON.stringify({
          ...next,
          // não precisa salvar token aqui, AuthService já cuida
        }),
      );

      set(next);
    } catch (error: any) {
      console.error('Google login error:', error);
      set({
        isAuthenticated: false,
        isLoading: false,
        error: error?.message || 'Failed to authenticate with Google',
      });
    }
  },

  // ---------- GUEST ----------
  loginAsGuest: async () => {
    set({ isLoading: true, error: null });

    try {
      const authService = AuthService.getInstance();
      const success = await authService.signInAsGuest();

      if (!success) {
        throw new Error(
          'Guest authentication failed — start the backend on localhost:3000 and reload the extension.',
        );
      }

      const authState = authService.getAuthState();
      const user = authState.user;

      if (!user || !authState.token) {
        throw new Error('No guest token received from backend');
      }

      const apiService = ApiService.getInstance();
      apiService.setAuthToken(authState.token);

      const next = {
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          provider: 'guest' as const,
          token: authState.token,
        },
        error: null,
        wallet: get().wallet ?? null,
      };

      localStorage.setItem(
        LOCAL_KEY,
        JSON.stringify({
          provider: 'guest',
          user: next.user,
          wallet: next.wallet,
        }),
      );

      set(next);
    } catch (error: any) {
      console.error('Guest login error:', error);
      set({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: error?.message || 'Failed to sign in as guest',
      });
    }
  },

  // ---------- LOGOUT ----------
  logout: async () => {
    try {
      const authService = AuthService.getInstance();
      await authService.signOut();
    } catch (error) {
      console.warn('Logout error (non fatal):', error);
    }

    // limpa tudo, inclusive wallet
    set({
      isAuthenticated: false,
      user: null,
      error: null,
      wallet: null,
      isLoading: false,
    });

    localStorage.removeItem(LOCAL_KEY);
  },

  // ---------- CHECK STATUS (startup) ----------
  checkAuthStatus: async () => {
    set({ isLoading: true });

    try {
      const authService = AuthService.getInstance();

      // espera carregar do chrome.storage/local
      await authService.waitForInitialization();

      const authState = authService.getAuthState();
      console.log('🔍 Checking auth status:', authState);

      if (authState.isAuthenticated && authState.user) {
        // seta token no api
        if (authState.token) {
          const apiService = ApiService.getInstance();
          apiService.setAuthToken(authState.token);
          console.log('✅ Auth token restored in API service');
        }

        // tenta recuperar wallet do localStorage (se tiver)
        let wallet: WalletInfo | null = null;
        try {
          const raw = localStorage.getItem(LOCAL_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.wallet?.address) {
              wallet = parsed.wallet as WalletInfo;
            }
          }
        } catch {
          // ignore
        }

        set({
          isAuthenticated: true,
          isLoading: false,
          user: {
            id: authState.user.id,
            email: authState.user.email,
            name: authState.user.name,
            avatar: authState.user.picture,
            provider: authState.user.email?.includes('guest_') ? 'guest' : 'google',
            token: authState.token || undefined,
          },
          wallet,
        });
      } else {
        // Guest JWT may live only in AuthService; avoid fake local-only guest
        set({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          wallet: null,
        });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      set({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        wallet: null,
        error: 'Failed to check authentication status',
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  // ---------- WALLET ----------
  setWalletConnected: (wallet: WalletInfo) => {
    set({ wallet });

    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.wallet = wallet;
        localStorage.setItem(LOCAL_KEY, JSON.stringify(parsed));
      } else {
        localStorage.setItem(LOCAL_KEY, JSON.stringify({ wallet }));
      }
    } catch {
      /* ignore */
    }

    // Persist pubkey on backend for attestations
    try {
      const api = ApiService.getInstance();
      if (api.getAuthToken() && wallet?.address) {
        void fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/users/profile`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${api.getAuthToken()}`,
          },
          body: JSON.stringify({ wallet_pubkey: wallet.address }),
        }).catch(() => {});
      }
    } catch {
      /* ignore */
    }
  },

  disconnectWallet: () => {
    set({ wallet: null });

    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.wallet = null;
        localStorage.setItem(LOCAL_KEY, JSON.stringify(parsed));
      }
    } catch {
      // ignore
    }
  },
}));
