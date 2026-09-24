import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '../../store/language-store';
import { t } from '../../i18n';
import ApiService from '../../services/api-service';
import { useAuthStore } from '../../store/auth-store';

/** Max rows on Home — rest go via “old transactions” → History */
const HOME_PREVIEW_LIMIT = 2;

interface HomeProps {
  onNavigateToAnalysis?: () => void;
  onNavigateToConnectWallet?: () => void;
  onNavigateToPlans?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToTransaction?: (transactionId: string) => void;
}

function formatTxAmount(tx: any): string {
  const raw = tx?.amount;
  if (raw === undefined || raw === null || raw === '' || raw === '0') {
    return tx?.type || '—';
  }
  const n = parseFloat(String(raw));
  if (!Number.isFinite(n) || n === 0) return tx?.type || '—';
  // stored as lamports (integer) or already SOL
  const sol = !String(raw).includes('.') && n >= 1000 ? n / 1e9 : n;
  if (sol < 0.0001) return `${sol.toPrecision(3)} SOL`;
  return `${sol.toFixed(4).replace(/\.?0+$/, '')} SOL`;
}

function shortAddr(addr?: string): string {
  if (!addr) return 'Desconhecido';
  if (addr.length < 10) return addr;
  return `${addr.substring(0, 5)}...${addr.substring(addr.length - 4)}`;
}

const Home: React.FC<HomeProps> = ({
  onNavigateToConnectWallet,
  onNavigateToPlans,
  onNavigateToSettings,
  onNavigateToHistory,
  onNavigateToTransaction,
}) => {
  const { language } = useLanguageStore();
  const { wallet } = useAuthStore((s) => ({ wallet: s.wallet }));
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [protectStatus, setProtectStatus] = useState<string | null>(null);

  const activateOnTab = () => {
    setProtectStatus('Ativando proteção na aba…');
    chrome.runtime.sendMessage({ type: 'INJECT_ACTIVE_TAB' }, (res) => {
      if (chrome.runtime.lastError) {
        setProtectStatus('Falha: ' + chrome.runtime.lastError.message);
        return;
      }
      if (res?.ok) {
        setProtectStatus('Proteção injetada — dê F5 na página e envie a tx.');
      } else {
        setProtectStatus('Falha: ' + (res?.error || 'desconhecida'));
      }
    });
  };

  useEffect(() => {
    let cancelled = false;
    let initial = true;

    const fetchTransactions = async () => {
      try {
        if (initial) setLoading(true);
        const { getLocalHistory, mergeHistory, FREE_HISTORY_LIMIT } = await import(
          '../../lib/history/local-history'
        );
        const local = await getLocalHistory(20);
        let apiRows: any[] = [];
        try {
          const apiService = ApiService.getInstance();
          const response = await apiService.getTransactionHistory({ limit: 10 });
          apiRows = response.transactions || [];
        } catch (error) {
          console.warn('API history unavailable, using local only', error);
        }
        if (cancelled) return;
        setAllTransactions(mergeHistory(apiRows, local, FREE_HISTORY_LIMIT));
      } catch (error) {
        console.error('Error fetching transactions:', error);
        if (!cancelled) setAllTransactions([]);
      } finally {
        if (!cancelled && initial) {
          setLoading(false);
          initial = false;
        }
      }
    };

    fetchTransactions();
    const interval = setInterval(fetchTransactions, 5000);
    const onStorage = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area === 'local' && changes.vetraHistory) fetchTransactions();
    };
    try {
      chrome.storage.onChanged.addListener(onStorage);
    } catch {
      /* ignore */
    }
    return () => {
      cancelled = true;
      clearInterval(interval);
      try {
        chrome.storage.onChanged.removeListener(onStorage);
      } catch {
        /* ignore */
      }
    };
  }, []);

  const preview = allTransactions.slice(0, HOME_PREVIEW_LIMIT);
  const hasOlder = allTransactions.length > HOME_PREVIEW_LIMIT;

  const walletButtonLabel = (() => {
    if (wallet?.address) {
      const short = `${wallet.address.slice(0, 4)}…${wallet.address.slice(-4)}`;
      const provider =
        wallet.provider === 'phantom'
          ? 'Phantom'
          : wallet.provider === 'backpack'
            ? 'Backpack'
            : wallet.provider === 'solflare'
              ? 'Solflare'
              : 'Wallet';
      return `${provider}: ${short}`;
    }
    return t('Connect Wallet', language) || 'Connect wallet';
  })();

  const walletButtonColor = wallet?.address ? '#00D386' : '#FFFFFF';

  return (
    <div
      className="w-full h-full bg-dark-bg text-dark-text flex flex-col overflow-hidden"
      style={{ padding: 16, gap: 12 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 shrink-0">
            <img
              src="/assets/logo.svg"
              alt="Vetra Logo"
              className="w-8 h-8"
              style={{ maxWidth: 32, maxHeight: 32 }}
            />
          </div>
          <div className="flex flex-col">
            <span style={{ fontSize: 12, lineHeight: '16px', color: '#E6E6E6' }}>
              {t('home.status', language)}
            </span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span style={{ fontSize: 12, lineHeight: '16px', color: '#E6E6E6' }}>
                {t('home.protected', language)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="px-3 py-1 rounded-full"
            style={{
              backgroundColor: '#1E1E1E',
              fontSize: 12,
              color: walletButtonColor,
              maxWidth: 120,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            onClick={onNavigateToConnectWallet}
            title={wallet?.address || undefined}
          >
            {walletButtonLabel}
          </button>
          <button
            type="button"
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: '#1E1E1E', fontSize: 12, color: '#FFFFFF' }}
            onClick={onNavigateToPlans}
          >
            {t('home.free', language)}
          </button>
          <button
            type="button"
            className="p-2 rounded-full"
            style={{ backgroundColor: '#1E1E1E', color: '#FFFFFF' }}
            onClick={onNavigateToSettings}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={activateOnTab}
        className="w-full rounded-lg py-2.5 px-3 text-sm shrink-0"
        style={{ backgroundColor: '#FBB500', color: '#1A141F', fontWeight: 700 }}
      >
        Ativar proteção nesta aba
      </button>
      {protectStatus && (
        <p
          className="shrink-0 rounded-md px-2.5 py-2"
          style={{
            backgroundColor: '#1E1E1E',
            color: '#E6E6E6',
            fontSize: 12,
            lineHeight: '16px',
            marginTop: 0,
          }}
        >
          {protectStatus}
        </p>
      )}

      {/* Recent Activity — fixed slots, no scroll */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <h2
          className="shrink-0"
          style={{ fontSize: 14, lineHeight: '20px', color: '#E6E6E6', marginBottom: 8 }}
        >
          {t('home.recentActivity', language)}
        </h2>

        <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-hidden">
          {loading ? (
            <div className="text-center py-6 text-gray-400 text-sm">Carregando...</div>
          ) : preview.length === 0 ? (
            <div className="text-center py-6">
              <p style={{ color: '#858C94', fontSize: 14 }}>Nenhuma transação ainda</p>
              <p style={{ color: '#858C94', fontSize: 12, marginTop: 6 }}>
                As transações aparecem aqui quando interceptadas
              </p>
            </div>
          ) : (
            preview.map((tx) => {
              let icon = '/assets/icon-success.svg';
              if (tx.status === 'rejected' || tx.risk_level === 'high') {
                icon = '/assets/icon-forbidden.svg';
              } else if (tx.risk_level === 'medium') {
                icon = '/assets/icon-droplet.svg';
              }

              return (
                <div
                  key={tx.id}
                  className="bg-dark-card rounded-lg px-3 py-3 flex items-center justify-between cursor-pointer shrink-0"
                  onClick={() => onNavigateToTransaction?.(tx.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                      <img src={icon} alt="" className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className="truncate"
                        style={{ fontSize: 14, lineHeight: '18px', color: '#E6E6E6' }}
                      >
                        {shortAddr(tx.to_address)}
                      </p>
                      <p style={{ fontSize: 13, lineHeight: '18px', color: '#858C94' }}>
                        {formatTxAmount(tx)}
                      </p>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              );
            })
          )}

          {hasOlder && (
            <button
              type="button"
              onClick={onNavigateToHistory}
              className="w-full rounded-lg py-2.5 text-sm shrink-0"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #333',
                color: '#FBB500',
                fontWeight: 500,
              }}
            >
              Ver transações antigas
            </button>
          )}
        </div>
      </div>

      {/* Footer — always visible */}
      <div className="flex gap-3 shrink-0">
        <button
          type="button"
          className="flex-1 bg-dark-card rounded-lg py-3 px-3 flex items-center justify-center gap-2"
          style={{ fontSize: 14, color: '#E6E6E6' }}
          onClick={onNavigateToHistory}
        >
          <img
            src="/assets/icon-history.svg"
            alt=""
            width={20}
            height={20}
            className="w-5 h-5 shrink-0"
          />
          <span>{t('home.history', language)}</span>
        </button>
        <button
          type="button"
          className="flex-1 bg-dark-card rounded-lg py-3 px-3 flex items-center justify-center gap-2"
          style={{ fontSize: 14, color: '#E6E6E6' }}
          onClick={onNavigateToPlans}
        >
          <img
            src="/assets/icon-payment-card.svg"
            alt=""
            width={20}
            height={20}
            className="w-5 h-5 shrink-0"
          />
          <span>{t('home.plans', language)}</span>
        </button>
      </div>
    </div>
  );
};

export default Home;
