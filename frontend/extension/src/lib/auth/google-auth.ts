// Google OAuth service for Chrome extension
export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  access_token: string;
  refresh_token?: string;
}

export interface GoogleAuthError {
  error: string;
  error_description?: string;
}

import { GOOGLE_OAUTH_CONFIG } from './google-config';

class GoogleAuthService {
  private readonly CLIENT_ID = GOOGLE_OAUTH_CONFIG.CLIENT_ID;
  private readonly SCOPES = GOOGLE_OAUTH_CONFIG.SCOPES;

  /**
   * Initialize Google OAuth flow
   */
  async authenticate(): Promise<GoogleUser> {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        if (chrome.runtime.lastError) {
          reject({
            error: chrome.runtime.lastError.message,
            error_description: 'Failed to get auth token'
          });
          return;
        }

        if (!token) {
          reject({
            error: 'no_token',
            error_description: 'No auth token received'
          });
          return;
        }

        try {
          // Get user info from Google
          const userInfo = await this.getUserInfo(token);
          resolve({
            ...userInfo,
            access_token: token
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Get user information from Google API
   */
  private async getUserInfo(token: string): Promise<Omit<GoogleUser, 'access_token' | 'refresh_token'>> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const userInfo = await response.json();
      
      return {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      };
    } catch (error) {
      throw {
        error: 'userinfo_fetch_failed',
        error_description: 'Failed to fetch user information from Google'
      };
    }
  }

  /**
   * Revoke token and sign out
   */
  async signOut(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (token) {
          chrome.identity.removeCachedAuthToken({ token }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Check if user is already authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        resolve(!!token && !chrome.runtime.lastError);
      });
    });
  }

  /**
   * Get current user info if authenticated
   */
  async getCurrentUser(): Promise<GoogleUser | null> {
    try {
      const isAuth = await this.isAuthenticated();
      if (!isAuth) return null;

      return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: false }, async (token) => {
          if (chrome.runtime.lastError || !token) {
            resolve(null);
            return;
          }

          try {
            const userInfo = await this.getUserInfo(token);
            resolve({
              ...userInfo,
              access_token: token
            });
          } catch (error) {
            resolve(null);
          }
        });
      });
    } catch (error) {
      return null;
    }
  }
}

export const googleAuthService = new GoogleAuthService();
