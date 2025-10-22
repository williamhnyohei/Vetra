// Google OAuth Configuration
// IMPORTANT: Replace these with your actual Google OAuth credentials

export const GOOGLE_OAUTH_CONFIG = {
  // Get these from Google Cloud Console
  CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID', // This needs to be configured!
  
  // Scopes for the extension
  SCOPES: [
    'openid',
    'email', 
    'profile'
  ],
  
  // Redirect URI for Chrome extension
  REDIRECT_URI: chrome.identity.getRedirectURL(),
  
  // Google API endpoints
  ENDPOINTS: {
    USER_INFO: 'https://www.googleapis.com/oauth2/v2/userinfo',
    TOKEN_INFO: 'https://www.googleapis.com/oauth2/v1/tokeninfo'
  }
};

// Validation function
export const validateGoogleConfig = () => {
  const issues: string[] = [];
  
  if (!GOOGLE_OAUTH_CONFIG.CLIENT_ID || GOOGLE_OAUTH_CONFIG.CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
    issues.push('Google Client ID not configured');
  }
  
  if (!GOOGLE_OAUTH_CONFIG.CLIENT_ID.includes('.')) {
    issues.push('Invalid Google Client ID format');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};