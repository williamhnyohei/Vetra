import React from 'react';
import { t, DEV_LANGUAGE } from '../../i18n';
import { useAuthStore } from '../../store/auth-store';

interface WelcomeProps {
  onGoogleLogin: () => void;
  onContinueAsGuest: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onGoogleLogin, onContinueAsGuest }) => {
  const { isLoading, error, clearError } = useAuthStore();

  // Clear error when component mounts
  React.useEffect(() => {
    if (error) {
      clearError();
    }
  }, [error, clearError]);
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8" style={{ backgroundColor: '#121212', borderRadius: '14px' }}>
      {/* Logo Vetra */}
      <div className="mb-8">
        <div className="w-16 h-16 flex items-center justify-center">
          {/* Logo oficial do Vetra - carregando do asset */}
          <img 
            src="/assets/logo.svg" 
            alt="Vetra Logo" 
            className="w-16 h-16"
            style={{ maxWidth: '64px', maxHeight: '64px' }}
          />
        </div>
      </div>

      {/* Título de Boas-vindas */}
      <h1 className="title-welcome mb-4" style={{ color: '#E6E6E6' }}>
        {t('welcome.title', DEV_LANGUAGE)}
      </h1>

      {/* Descrição */}
      <p className="subtitle-welcome mb-12" style={{ color: '#9CA3AF' }}>
        {t('welcome.subtitle', DEV_LANGUAGE)}
      </p>

      {/* Botão Entrar com Google */}
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
          letterSpacing: '0px',
          fontWeight: '400'
        }}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            Signing in...
          </div>
        ) : (
          t('welcome.googleButton', DEV_LANGUAGE)
        )}
      </button>

      {/* Botão Continuar como Visitante */}
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
          letterSpacing: '0px',
          fontWeight: '400'
        }}
      >
        {t('welcome.guestButton', DEV_LANGUAGE)}
      </button>

      {/* Error Message */}
      {error && (
        <div className="w-full max-w-xs mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm text-center">
            {error}
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <p className="description-welcome max-w-xs" style={{ color: '#9CA3AF' }}>
        {t('welcome.disclaimer', DEV_LANGUAGE)}
      </p>
    </div>
  );
};

export default Welcome;