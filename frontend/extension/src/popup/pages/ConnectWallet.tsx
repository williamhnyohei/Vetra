import React, { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';

interface ConnectWalletProps {
  onBack?: () => void;
}

type ProviderName = 'phantom' | 'backpack' | 'solflare' | 'auto';

type ConnectResult = {
  success: boolean;
  publicKey?: string;
  error?: string;
  provider?: 'phantom' | 'backpack' | 'solflare' | 'other';
};

async function sendToActiveTab<T = any>(msg: any): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs?.[0]?.id;
        if (!tabId) return reject(new Error('No active tab'));
        chrome.tabs.sendMessage(tabId, msg, (res) => {
          const lastErr = chrome.runtime.lastError;
          if (lastErr) return reject(new Error(lastErr.message));
          if (!res) return reject(new Error('No response from content script'));
          resolve(res);
        });
      });
    } catch (e: any) {
      reject(new Error(String(e?.message || e)));
    }
  });
}

async function requestWalletConnect(provider: ProviderName): Promise<ConnectResult> {
  try {
    const res = await sendToActiveTab<ConnectResult>({
      type: 'VETRA_CONNECT_WALLET',
      payload: { provider },
    });
    return res;
  } catch (e: any) {
    return { success: false, error: String(e?.message || e) };
  }
}

const providerLabel = (p?: string | null): string => {
  if (p === 'phantom') return 'Phantom';
  if (p === 'backpack') return 'Backpack';
  if (p === 'solflare') return 'Solflare';
  if (p === 'other') return 'Wallet';
  return 'Wallet';
};

const ConnectWallet: React.FC<ConnectWalletProps> = ({ onBack }) => {
  const {
    wallet,
    setWalletConnected,
    disconnectWallet,
  } = useAuthStore((s) => ({
    wallet: s.wallet,
    setWalletConnected: s.setWalletConnected,
    disconnectWallet: s.disconnectWallet,
  }));

  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [lastProvider, setLastProvider] = useState<ProviderName | null>(null);
  const [lastPubkey, setLastPubkey] = useState<string | null>(null);

  const handleConnect = async (provider: ProviderName) => {
    setBusy(true);
    setErr(null);
    setLastProvider(provider);

    const res = await requestWalletConnect(provider);
    setBusy(false);

    if (!res?.success || !res.publicKey) {
      setErr(res?.error || 'Failed to connect');
      return;
    }

    // provider real que o injected detectou
    const detectedProvider =
      res.provider && res.provider !== 'other'
        ? res.provider
        : provider === 'auto'
        ? 'other'
        : provider;

    // salva globalmente
    setWalletConnected({
      address: res.publicKey,
      provider: detectedProvider as any,
      connectedAt: Date.now(),
    });

    setLastPubkey(res.publicKey);
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setLastPubkey(null);
    setLastProvider(null);
    setErr(null);
  };

  // dado mostrado no topo: prioriza o que está no store
  const activeWalletAddress = wallet?.address || lastPubkey;
  const activeWalletProvider = wallet?.provider || (lastProvider as string | null);

  return (
    <div className="w-full h-full bg-dark-bg text-dark-text p-4 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-400 hover:text-white" onClick={onBack}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1
            style={{
              fontFamily: 'Arial',
              fontWeight: 700,
              fontSize: 18,
              lineHeight: '24px',
              color: '#E6E6E6',
            }}
          >
            Connect Wallet
          </h1>
        </div>

        {/* se tem wallet, mostra disconnect */}
        {activeWalletAddress ? (
          <button
            onClick={handleDisconnect}
            className="text-xs px-3 py-1 rounded-full bg-red-500/10 text-red-300 hover:bg-red-500/20"
          >
            Disconnect
          </button>
        ) : null}
      </div>

      {/* Intro + status */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <svg className="w-16 h-16 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 7h-3V6a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1h3a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1zM5 4h10a1 1 0 0 1 1 1v1H5V5a1 1 0 0 1 1-1zm11 14H5a1 1 0 0 1-1-1V8h12v10a1 1 0 0 1-1 1z" />
            <path d="M15 10a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1z" />
          </svg>
        </div>
        <p
          style={{
            fontFamily: 'Arial',
            fontSize: 14,
            lineHeight: '20px',
            color: '#E6E6E6',
          }}
        >
          Choose your wallet to start protecting your transactions.
        </p>

        {activeWalletAddress ? (
          <p className="mt-2 text-xs text-green-400">
            Connected ({providerLabel(activeWalletProvider)}):{' '}
            <span className="font-mono">
              {activeWalletAddress.slice(0, 6)}…{activeWalletAddress.slice(-6)}
            </span>
          </p>
        ) : null}

        {err && (
          <p className="mt-2 text-xs text-red-400">
            {err}
          </p>
        )}
      </div>

      {/* Wallet options */}
      <div className="space-y-3">
        {/* Phantom */}
        <button
          onClick={() => handleConnect('phantom')}
          disabled={busy}
          className={`w-full rounded-lg p-4 flex items-center justify-between transition-colors ${
            busy ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'
          }`}
          style={{ backgroundColor: '#7C3AED' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span style={{ fontFamily: 'Arial', fontWeight: 700, fontSize: 16, color: '#7C3AED' }}>
                P
              </span>
            </div>
            <div className="text-left">
              <p style={{ fontFamily: 'Arial', fontSize: 14, color: '#FFFFFF' }}>Phantom</p>
              <p style={{ fontFamily: 'Arial', fontSize: 12, color: '#FFFFFF' }}>Connect via extension</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Backpack */}
        <button
          onClick={() => handleConnect('backpack')}
          disabled={busy}
          className={`w-full rounded-lg p-4 flex items-center justify-between transition-colors ${
            busy ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'
          }`}
          style={{ backgroundColor: '#F59E0B' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span style={{ fontFamily: 'Arial', fontWeight: 700, fontSize: 16, color: '#F59E0B' }}>
                B
              </span>
            </div>
            <div className="text-left">
              <p style={{ fontFamily: 'Arial', fontSize: 14, color: '#FFFFFF' }}>Backpack</p>
              <p style={{ fontFamily: 'Arial', fontSize: 12, color: '#FFFFFF' }}>Connect via extension</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Solflare */}
        <button
          onClick={() => handleConnect('solflare')}
          disabled={busy}
          className={`w-full rounded-lg p-4 flex items-center justify-between transition-colors ${
            busy ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'
          }`}
          style={{ backgroundColor: '#FF6B00' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span style={{ fontFamily: 'Arial', fontWeight: 700, fontSize: 16, color: '#FF6B00' }}>
                S
              </span>
            </div>
            <div className="text-left">
              <p style={{ fontFamily: 'Arial', fontSize: 14, color: '#FFFFFF' }}>Solflare</p>
              <p style={{ fontFamily: 'Arial', fontSize: 12, color: '#FFFFFF' }}>Connect via extension</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Other wallets (auto) */}
        <button
          onClick={() => handleConnect('auto')}
          disabled={busy}
          className={`w-full bg-dark-card rounded-lg p-4 flex items-center justify-between transition-colors ${
            busy ? 'opacity-60 cursor-not-allowed' : 'hover:bg-dark-card/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <div className="flex flex-col gap-1">
                <div className="w-1 h-1 bg-yellow-500 rounded-full" />
                <div className="w-1 h-1 bg-yellow-500 rounded-full" />
                <div className="w-1 h-1 bg-yellow-500 rounded-full" />
              </div>
            </div>
            <div className="text-left">
              <p style={{ fontFamily: 'Arial', fontSize: 14, color: '#FFFFFF' }}>Other wallets</p>
              <p style={{ fontFamily: 'Arial', fontSize: 12, color: '#FFFFFF' }}>
                Tries Phantom → Backpack → Solflare
              </p>
            </div>
          </div>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Security note */}
      <div className="bg-dark-card rounded-lg p-4 flex items-center gap-3">
        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p style={{ fontFamily: 'Arial', fontSize: 12, lineHeight: '16px', color: '#858C94' }}>
          Your private keys remain secure. Vetra never requests or stores your credentials.
        </p>
      </div>

      {/* Skip */}
      <button className="w-full bg-dark-card rounded-lg p-4 flex items-center justify-center gap-2 hover:bg-dark-card/80 transition-colors">
        <span style={{ fontFamily: 'Arial', fontSize: 14, color: '#E6E6E6' }}>Skip for now</span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default ConnectWallet;