import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/auth-store';
import { useLanguageStore } from '../../store/language-store';
import { useThemeStore } from '../../store/theme-store';
import { t } from '../../i18n';
import SettingsService, { UserSettings } from '../../services/settings-service';

interface SettingsProps {
  onBack?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const { user, logout, loginWithGoogle } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const { theme, setTheme } = useThemeStore();
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [shareInsights, setShareInsights] = useState(true);
  const [transactionMemory, setTransactionMemory] = useState(false);
  const [smartContractFingerprints, setSmartContractFingerprints] = useState(false);
  const [aiRigidity, setAiRigidity] = useState(65);
  const [aiLanguage, setAiLanguage] = useState<'en' | 'pt'>('pt');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      console.log('✅ Logout successful, redirecting...');
      // The App component will automatically redirect to Welcome page
      // when isAuthenticated becomes false
    } catch (error) {
      console.error('❌ Logout error:', error);
      alert('Failed to logout. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('❌ Login error:', error);
      alert('Failed to login with Google. Please try again.');
    }
  };

  // Load settings from backend when component mounts (only once)
  useEffect(() => {
    const loadSettings = async () => {
      // Only load from backend if user is logged in with Google (has token)
      if (user?.provider === 'google' && user?.token) {
        try {
          const settingsService = SettingsService.getInstance();
          const backendSettings = await settingsService.getSettings(user.token);
          
          // Update local state with backend settings
          if (backendSettings.theme) {
            setTheme(backendSettings.theme); // This will trigger theme application
          }
          if (backendSettings.language) setLanguage(backendSettings.language);
          if (backendSettings.soundAlerts !== undefined) setSoundAlerts(backendSettings.soundAlerts);
          if (backendSettings.shareInsights !== undefined) setShareInsights(backendSettings.shareInsights);
          if (backendSettings.transactionMemory !== undefined) setTransactionMemory(backendSettings.transactionMemory);
          if (backendSettings.smartContractFingerprints !== undefined) setSmartContractFingerprints(backendSettings.smartContractFingerprints);
          if (backendSettings.aiRigidity !== undefined) setAiRigidity(backendSettings.aiRigidity);
          if (backendSettings.aiLanguage) setAiLanguage(backendSettings.aiLanguage);
          
          console.log('✅ Settings loaded from backend');
        } catch (error) {
          console.error('❌ Error loading settings:', error);
          // Continue with default settings if backend fails
        }
      }
    };

    loadSettings();
  }, []); // Empty dependency array - only load once on mount

  // Function to save settings to backend
  const saveSettingToBackend = async (key: keyof UserSettings, value: any) => {
    // Only save to backend if user is logged in with Google
    if (user?.provider !== 'google' || !user?.token) {
      console.log('⚠️ Guest user - settings not saved to backend');
      return;
    }

    setIsSavingSettings(true);
    try {
      const settingsService = SettingsService.getInstance();
      await settingsService.updateSetting(key, value, user.token);
      console.log(`✅ Setting ${key} saved to backend:`, value);
    } catch (error) {
      console.error(`❌ Error saving ${key}:`, error);
      // Don't show error to user, just log it
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handler for theme change
  const handleThemeChange = async (newTheme: 'light' | 'dark') => {
    // Update theme store (this will persist and apply theme globally)
    setTheme(newTheme);
    
    // Save to backend if logged in
    await saveSettingToBackend('theme', newTheme);
  };

  // Handler for language change
  const handleLanguageChange = async (newLanguage: 'en' | 'pt') => {
    // Update global language store (this will trigger re-render of all components)
    setLanguage(newLanguage);
    console.log(`🌐 Language changed to: ${newLanguage}`);
    
    // Save to backend if logged in
    await saveSettingToBackend('language', newLanguage);
  };

  return (
    <div className="w-full h-full bg-dark-bg text-dark-text p-4 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            className="p-2 text-gray-400 hover:text-white"
            onClick={onBack}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 
            style={{
              fontFamily: 'Arial',
              fontWeight: '700',
              fontSize: '18px',
              lineHeight: '24px',
              letterSpacing: '0px',
              color: '#E6E6E6'
            }}
          >
            {t('settings.title', language)}
          </h1>
        </div>
      </div>

      {/* Account Information Card */}
      <div className="bg-dark-card rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 
            style={{
              fontFamily: 'Arial',
              fontWeight: '400',
              fontSize: '16px',
              lineHeight: '20px',
              letterSpacing: '0px',
              color: '#E6E6E6'
            }}
          >
            {t('settings.account', language)}
          </h2>
          <div 
            className="px-3 py-1 rounded-full"
            style={{
              backgroundColor: '#1E1E1E',
              fontFamily: 'Arial',
              fontWeight: '400',
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0px',
              color: '#FFFFFF'
            }}
          >
            {t('settings.free', language)}
          </div>
        </div>
        
        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-start gap-3">
            {user?.avatar && (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-12 h-12 rounded-full"
              />
            )}
            <div className="flex-1">
              <p 
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '14px',
                  lineHeight: '20px',
                  letterSpacing: '0px',
                  color: '#E6E6E6'
                }}
              >
                {user?.name || 'Guest User'}
              </p>
              {user?.provider !== 'guest' && (
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: '0px',
                    color: '#858C94'
                  }}
                >
                  {user?.email || 'Not logged in'}
                </p>
              )}
            </div>
          </div>

          {/* Login with Google button (only for guests) */}
          {user?.provider === 'guest' && (
            <button
              onClick={handleGoogleLogin}
              className="w-full py-2.5 rounded-lg transition-colors"
              style={{
                backgroundColor: '#F5A524',
                fontFamily: 'Arial',
                fontWeight: '500',
                fontSize: '14px',
                lineHeight: '20px',
                color: '#0B0B0B'
              }}
            >
              {t('settings.signInWithGoogle', language)}
            </button>
          )}
          
          {/* Connected Wallet - commented out for now, can be added later when wallet connection is implemented */}
          {/* <div>
            <p 
              style={{
                fontFamily: 'Arial',
                fontWeight: '400',
                fontSize: '14px',
                lineHeight: '20px',
                letterSpacing: '0px',
                color: '#E6E6E6'
              }}
            >
              Connected Wallet
            </p>
            <p 
              style={{
                fontFamily: 'Arial',
                fontWeight: '400',
                fontSize: '14px',
                lineHeight: '20px',
                letterSpacing: '0px',
                color: '#858C94'
              }}
            >
              {truncateAddress('0x742d35Cc6634C0532925a3b8D5c3Cf6Ba3e')}
            </p>
          </div> */}
        </div>
      </div>

      {/* Preferences and AI Personalization Card */}
      <div className="bg-dark-card rounded-lg p-4">
        {/* Preferences Section */}
        <div className="mb-6">
          <h3 
            style={{
              fontFamily: 'Arial',
              fontWeight: '400',
              fontSize: '16px',
              lineHeight: '20px',
              letterSpacing: '0px',
              color: '#E6E6E6',
              marginBottom: '16px'
            }}
          >
            {t('settings.preferences', language)}
          </h3>
          
          <div className="space-y-4">
            {/* Theme */}
            <div className="flex items-center justify-between">
              <div>
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: '0px',
                    color: '#E6E6E6'
                  }}
                >
                  {t('settings.theme', language)}
                </p>
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '12px',
                    lineHeight: '16px',
                    letterSpacing: '0px',
                    color: '#858C94'
                  }}
                >
                  {t('settings.themeDescription', language)}
                </p>
              </div>
              <select 
                value={theme}
                onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark')}
                disabled={isSavingSettings}
                className="bg-dark-bg border border-dark-border rounded px-3 py-2"
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '14px',
                  lineHeight: '20px',
                  letterSpacing: '0px',
                  color: '#E6E6E6',
                  opacity: isSavingSettings ? 0.5 : 1
                }}
              >
                <option value="dark">{t('settings.dark', language)}</option>
                <option value="light">{t('settings.light', language)}</option>
              </select>
            </div>

            {/* Sound Alerts */}
            <div className="flex items-center justify-between">
              <div>
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: '0px',
                    color: '#E6E6E6'
                  }}
                >
                  {t('settings.soundAlerts', language)}
                </p>
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '12px',
                    lineHeight: '16px',
                    letterSpacing: '0px',
                    color: '#858C94'
                  }}
                >
                  {t('settings.soundAlertsDescription', language)}
                </p>
              </div>
              <button
                className={`w-12 h-6 rounded-full transition-colors ${
                  soundAlerts ? 'bg-yellow-500' : 'bg-gray-600'
                }`}
                onClick={() => {
                  const newValue = !soundAlerts;
                  setSoundAlerts(newValue);
                  saveSettingToBackend('soundAlerts', newValue);
                }}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    soundAlerts ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between">
              <div>
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: '0px',
                    color: '#E6E6E6'
                  }}
                >
                  {t('settings.language', language)}
                </p>
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '12px',
                    lineHeight: '16px',
                    letterSpacing: '0px',
                    color: '#858C94'
                  }}
                >
                  {t('settings.languageDescription', language)}
                </p>
              </div>
              <select 
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as 'en' | 'pt')}
                disabled={isSavingSettings}
                className="bg-dark-bg border border-dark-border rounded px-3 py-2"
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '14px',
                  lineHeight: '20px',
                  letterSpacing: '0px',
                  color: '#E6E6E6',
                  opacity: isSavingSettings ? 0.5 : 1
                }}
              >
                <option value="en">English</option>
                <option value="pt">Portuguese (BR)</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Personalization Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 
              style={{
                fontFamily: 'Arial',
                fontWeight: '400',
                fontSize: '16px',
                lineHeight: '20px',
                letterSpacing: '0px',
                color: '#E6E6E6'
              }}
            >
              {t('settings.aiPersonalization', language)}
            </h3>
            <span 
              style={{
                fontFamily: 'Arial',
                fontWeight: '400',
                fontSize: '12px',
                lineHeight: '16px',
                letterSpacing: '0px',
                color: '#FBB500'
              }}
            >
              {t('settings.proFeature', language)}
            </span>
          </div>
          
          <div className="space-y-4">
            {/* AI Rigidity */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: '0px',
                    color: '#E6E6E6'
                  }}
                >
                  {t('settings.aiRigidity', language)}
                </p>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span 
                    style={{
                      fontFamily: 'Arial',
                      fontWeight: '400',
                      fontSize: '12px',
                      lineHeight: '16px',
                      letterSpacing: '0px',
                      color: '#858C94'
                    }}
                  >
                    {t('settings.moreConservative', language)}
                  </span>
                  <span 
                    style={{
                      fontFamily: 'Arial',
                      fontWeight: '400',
                      fontSize: '14px',
                      lineHeight: '20px',
                      letterSpacing: '0px',
                      color: '#E6E6E6'
                    }}
                  >
                    {aiRigidity}%
                  </span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={aiRigidity}
                  onChange={(e) => {
                    const newValue = Number(e.target.value);
                    setAiRigidity(newValue);
                  }}
                  onMouseUp={async () => {
                    await saveSettingToBackend('aiRigidity', aiRigidity);
                  }}
                  onTouchEnd={async () => {
                    await saveSettingToBackend('aiRigidity', aiRigidity);
                  }}
                  disabled={isSavingSettings}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #FBB500 0%, #FBB500 ${aiRigidity}%, #374151 ${aiRigidity}%, #374151 100%)`
                  }}
                />
                
                <div className="text-right">
                  <span 
                    style={{
                      fontFamily: 'Arial',
                      fontWeight: '400',
                      fontSize: '12px',
                      lineHeight: '16px',
                      letterSpacing: '0px',
                      color: '#858C94'
                    }}
                  >
                    {t('settings.morePermissive', language)}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Language */}
            <div className="flex items-center justify-between">
              <div>
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: '0px',
                    color: '#E6E6E6'
                  }}
                >
                  {t('settings.aiLanguage', language)}
                </p>
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '12px',
                    lineHeight: '16px',
                    letterSpacing: '0px',
                    color: '#858C94'
                  }}
                >
                  {t('settings.aiLanguageDescription', language)}
                </p>
              </div>
              <select 
                value={aiLanguage}
                onChange={(e) => {
                  const newLang = e.target.value as 'en' | 'pt';
                  setAiLanguage(newLang);
                  saveSettingToBackend('aiLanguage', newLang);
                }}
                disabled={isSavingSettings}
                className="bg-dark-bg border border-dark-border rounded px-3 py-2"
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '14px',
                  lineHeight: '20px',
                  letterSpacing: '0px',
                  color: '#E6E6E6',
                  opacity: isSavingSettings ? 0.5 : 1
                }}
              >
                <option value="en">English</option>
                <option value="pt">Portuguese (BR)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Data & Feature Settings Card */}
      <div className="bg-dark-card rounded-lg p-4">
        <div className="space-y-4">
          {/* Share insights */}
          <div className="flex items-center justify-between">
            <div>
              <p 
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '14px',
                  lineHeight: '20px',
                  letterSpacing: '0px',
                  color: '#E6E6E6'
                }}
              >
                {t('settings.shareInsights', language)}
              </p>
              <p 
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '12px',
                  lineHeight: '16px',
                  letterSpacing: '0px',
                  color: '#858C94'
                }}
              >
                {t('settings.shareInsightsDescription', language)}
              </p>
            </div>
            <button
              className={`w-12 h-6 rounded-full transition-colors ${
                shareInsights ? 'bg-yellow-500' : 'bg-gray-600'
              }`}
              onClick={() => {
                const newValue = !shareInsights;
                setShareInsights(newValue);
                saveSettingToBackend('shareInsights', newValue);
              }}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  shareInsights ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Transaction Memory */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: '0px',
                    color: '#E6E6E6'
                  }}
                >
                  {t('settings.transactionMemory', language)}
                </p>
                <span 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '12px',
                    lineHeight: '16px',
                    letterSpacing: '0px',
                    color: '#FBB500'
                  }}
                >
                  {t('settings.proFeature', language)}
                </span>
              </div>
              <p 
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '12px',
                  lineHeight: '16px',
                  letterSpacing: '0px',
                  color: '#858C94'
                }}
              >
                {t('settings.transactionMemoryDescription', language)}
              </p>
            </div>
            <button
              className={`w-12 h-6 rounded-full transition-colors ${
                transactionMemory ? 'bg-yellow-500' : 'bg-gray-600'
              }`}
              onClick={() => {
                const newValue = !transactionMemory;
                setTransactionMemory(newValue);
                saveSettingToBackend('transactionMemory', newValue);
              }}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  transactionMemory ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Smart Contract fingerprints */}
          <div className="flex items-center justify-between">
            <div>
              <p 
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '14px',
                  lineHeight: '20px',
                  letterSpacing: '0px',
                  color: '#E6E6E6'
                }}
              >
                {t('settings.smartContractFingerprints', language)}
              </p>
              <p 
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '12px',
                  lineHeight: '16px',
                  letterSpacing: '0px',
                  color: '#858C94'
                }}
              >
                {t('settings.smartContractFingerprintsDescription', language)}
              </p>
            </div>
            <button
              className={`w-12 h-6 rounded-full transition-colors ${
                smartContractFingerprints ? 'bg-yellow-500' : 'bg-gray-600'
              }`}
              onClick={() => {
                const newValue = !smartContractFingerprints;
                setSmartContractFingerprints(newValue);
                saveSettingToBackend('smartContractFingerprints', newValue);
              }}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  smartContractFingerprints ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button 
          className="flex-1 rounded-lg flex items-center justify-center gap-2 transition-colors"
          style={{
            backgroundColor: '#E91E63',
            color: '#FFFFFF',
            fontFamily: 'Arial',
            fontWeight: '400',
            fontSize: '14px',
            lineHeight: '20px',
            letterSpacing: '0px',
            height: '3rem',
            paddingLeft: '16px',
            paddingRight: '16px'
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
          {t('settings.disconnectWallet', language)}
        </button>
        
        {/* Show logout button only for logged in users (not guests) */}
        {user?.provider !== 'guest' && (
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex-1 rounded-lg flex items-center justify-center gap-2 transition-colors"
            style={{
              backgroundColor: '#1E1E1E',
              color: '#FFFFFF',
              fontFamily: 'Arial',
              fontWeight: '400',
              fontSize: '14px',
              lineHeight: '20px',
              letterSpacing: '0px',
              height: '3rem',
              paddingLeft: '16px',
              paddingRight: '16px',
              opacity: isLoggingOut ? 0.5 : 1,
              cursor: isLoggingOut ? 'not-allowed' : 'pointer'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isLoggingOut ? (language === 'pt' ? 'Saindo...' : 'Logging out...') : t('settings.logoutAccount', language)}
          </button>
        )}
      </div>

      {/* Footer Disclaimer */}
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p 
          style={{
            fontFamily: 'Arial',
            fontWeight: '400',
            fontSize: '12px',
            lineHeight: '16px',
            letterSpacing: '0px',
            color: '#858C94'
          }}
        >
          {t('settings.privacy', language)}
        </p>
      </div>
    </div>
  );
};

export default Settings;