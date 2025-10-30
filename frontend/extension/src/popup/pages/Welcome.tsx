import React from 'react';
import { t } from '../../i18n';
import { useAuthStore } from '../../store/auth-store';
import { useLanguageStore } from '../../store/language-store';

interface WelcomeProps {
  onGoogleLogin: () => void;
  onContinueAsGuest: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onGoogleLogin, onContinueAsGuest }) => {
  const { isLoading, error, clearError } = useAuthStore();
  const { language } = useLanguageStore();

  // limpa erros antigos ao montar a tela
  React.useEffect(() => {
    clearError();
  }, [clearError]);

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center p-8"
      style={{ backgroundColor: '#121212', borderRadius: '14px' }}
    >
      {/* Logo Vetra */}
      <div className="mb-8">
        <div className="w-16 h-16 flex items-center justify-center">
          <img
            src="/assets/logo.svg"
            alt="Vetra Logo"
            className="w-16 h-16"
            style={{ maxWidth: '64px', maxHeight: '64px' }}
          />
        </div>
      </div>

      {/* Título */}
      <h1 className="mb-4" style={{ color: '#E6E6E6', fontSize: 20, fontWeight: 700 }}>
        {t('welcome.title', language)}
      </h1>

      {/* Subtítulo */}
      <p className="mb-12" style={{ color: '#9CA3AF', textAlign: 'center', fontSize: 14 }}>
        {t('welcome.subtitle', language)}
      </p>

      {/* Botão Google */}
      <button
        onClick={onGoogleLogin}
        disabled={isLoading}
        className="w-full max-w-xs font-normal py-4 px-6 rounded-lg mb-4 flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: '#F5A524',
          color: '#0B0B0B',
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          lineHeight: '20px',
        }}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            {t('welcome.loading', language) || 'Signing in...'}
          </div>
        ) : (
          t('welcome.googleButton', language)
        )}
      </button>

      {/* Botão Guest */}
      <button
        onClick={onContinueAsGuest}
        disabled={isLoading}
        className="w-full max-w-xs font-normal py-3 px-6 rounded-lg mb-8 hover:opacity-80 transition-opacity border border-dark-border disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: '#1E1E1E4D',
          color: '#E6E6E6',
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          lineHeight: '20px',
        }}
      >
        {t('welcome.guestButton', language)}
      </button>

      {/* Erro */}
      {error && (
        <div className="w-full max-w-xs mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Disclaimer */}
      <p className="max-w-xs text-center" style={{ color: '#9CA3AF', fontSize: 12, lineHeight: '18px' }}>
        {t('welcome.disclaimer', language)}
      </p>
    </div>
  );
};

export default Welcome;