/**
 * Authentication Service
 * Handles Google OAuth authentication for the extension
 */

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null
  };

  private constructor() {
    this.loadAuthState();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Load authentication state from storage
   */
  private async loadAuthState(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['authState']);
      if (result.authState) {
        this.authState = result.authState;
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    }
  }

  /**
   * Save authentication state to storage
   */
  private async saveAuthState(): Promise<void> {
    try {
      await chrome.storage.local.set({ authState: this.authState });
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  }

  /**
   * Get current authentication state
   */
  public getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  /**
   * Get current user
   */
  public getCurrentUser(): User | null {
    return this.authState.user;
  }

  /**
   * Get access token
   */
  public getAccessToken(): string | null {
    return this.authState.token;
  }

  /**
   * Sign in with Google OAuth
   */
  public async signInWithGoogle(): Promise<boolean> {
    try {
      console.log('🔐 Starting Google OAuth flow...');
      
      let token: string | null = null;
      
      // Try method 1: chrome.identity.getAuthToken (requires OAuth2 in manifest)
      try {
        console.log('🔐 Trying chrome.identity.getAuthToken...');
        token = await new Promise<string>((resolve, reject) => {
          chrome.identity.getAuthToken({ interactive: true }, (resultToken) => {
            if (chrome.runtime.lastError) {
              console.warn('⚠️ getAuthToken failed:', chrome.runtime.lastError.message);
              reject(chrome.runtime.lastError);
            } else if (resultToken) {
              console.log('✅ Auth token obtained via getAuthToken');
              resolve(resultToken);
            } else {
              reject(new Error('No token received from getAuthToken'));
            }
          });
        });
      } catch (getAuthTokenError) {
        console.warn('⚠️ Method 1 (getAuthToken) failed, trying launchWebAuthFlow...');
        
        // Method 2: launchWebAuthFlow (fallback)
        try {
          console.log('🔐 Trying chrome.identity.launchWebAuthFlow...');
          const redirectUrl = await chrome.identity.launchWebAuthFlow({
            url: this.buildAuthUrl(),
            interactive: true
          });

          if (redirectUrl) {
            console.log('✅ Redirect URL received:', redirectUrl);
            // Extract access token from URL
            token = this.extractAccessToken(redirectUrl);
            if (!token) {
              throw new Error('Could not extract token from redirect URL');
            }
            console.log('✅ Token extracted from redirect URL');
          }
        } catch (launchError) {
          console.error('❌ Method 2 (launchWebAuthFlow) also failed:', launchError);
          throw launchError;
        }
      }

      if (token) {
        // Get user info from Google
        const userInfo = await this.getUserInfoFromGoogle(token);
        if (userInfo) {
          // Update auth state
          this.authState = {
            isAuthenticated: true,
            user: userInfo,
            token: token
          };
          
          // Save to storage
          await this.saveAuthState();
          
          console.log('✅ Google OAuth successful:', userInfo);
          return true;
        }
      }
      
      console.error('❌ Google OAuth failed - no token obtained');
      return false;
    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      return false;
    }
  }

  /**
   * Build Google OAuth URL for launchWebAuthFlow
   */
  private buildAuthUrl(): string {
    const clientId = '228752268593-0oc5m1qg37k27t7veo6f4jjtjgg7qtpc.apps.googleusercontent.com';
    const redirectUri = chrome.identity.getRedirectURL();
    const scopes = ['openid', 'email', 'profile'];
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'token', // Use implicit flow for extension
      scope: scopes.join(' '),
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log('🔐 Auth URL:', authUrl);
    console.log('🔐 Redirect URI:', redirectUri);
    
    return authUrl;
  }

  /**
   * Extract access token from redirect URL
   */
  private extractAccessToken(url: string): string | null {
    try {
      // Access token is in the hash fragment for implicit flow
      const hashParams = new URLSearchParams(url.split('#')[1]);
      const accessToken = hashParams.get('access_token');
      
      if (accessToken) {
        console.log('✅ Access token found in hash');
        return accessToken;
      }

      // Also check query params as fallback
      const urlObj = new URL(url);
      const queryToken = urlObj.searchParams.get('access_token');
      
      if (queryToken) {
        console.log('✅ Access token found in query');
        return queryToken;
      }

      console.warn('⚠️ No access token found in URL');
      return null;
    } catch (error) {
      console.error('❌ Error extracting access token:', error);
      return null;
    }
  }

  /**
   * Sign out
   */
  public async signOut(): Promise<void> {
    try {
      console.log('🔓 Starting logout...');
      
      // Revoke Chrome's cached auth token
      if (this.authState.token) {
        await new Promise<void>((resolve) => {
          chrome.identity.removeCachedAuthToken({ token: this.authState.token! }, () => {
            console.log('✅ Token removed from cache');
            resolve();
          });
        });
        
        // Also try to revoke the token with Google
        try {
          await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${this.authState.token}`);
          console.log('✅ Token revoked with Google');
        } catch (error) {
          console.warn('⚠️ Could not revoke token with Google:', error);
        }
      }
      
      // Clear auth state
      this.authState = {
        isAuthenticated: false,
        user: null,
        token: null
      };
      
      // Clear storage
      await chrome.storage.local.remove(['authState']);
      
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
  }


  /**
   * Get user info from Google
   */
  private async getUserInfoFromGoogle(token: string): Promise<User | null> {
    try {
      console.log('👤 Fetching user info from Google...');
      
      // Call Google's userinfo endpoint
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ User info received:', data);

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture
      };
    } catch (error) {
      console.error('❌ Error getting user info:', error);
      return null;
    }
  }
}

export default AuthService;
