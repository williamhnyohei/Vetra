import React, { useEffect, useState, useCallback } from 'react';
import ApiService from '../../services/api-service';
import { getLocalHistory } from '../../lib/history/local-history';

interface AnalysisView {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | string;
  reasons: string[];
  from?: string;
  to?: string;
  amount?: string;
  network?: string;
  type?: string;
  status?: 'pending' | 'approved' | 'blocked' | 'rejected';
  source?: string;
  requestId?: string;
  scoreBreakdown?: Array<{ factor: string; points: number; detail?: string }>;
  aiSummary?: string;
}

interface TransactionAnalysisProps {
  onBack?: () => void;
  /** When set, this is a history review — never show Allow/Block. */
  transactionId?: string;
}

function levelColor(level: string): string {
  if (level === 'high') return '#FF4444';
  if (level === 'medium') return '#FF8800';
  return '#00D386';
}

function shortAddr(addr?: string): string {
  if (!addr || addr === 'Unknown' || addr === 'Error') return '—';
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function friendlyType(type?: string): string {
  if (!type || type === 'unknown' || type === 'Error') return '—';
  return type;
}

function mapDecisionStatus(raw: any): 'pending' | 'approved' | 'blocked' | 'rejected' {
  const s = String(raw?.status || '').toLowerCase();
  if (raw?.shouldBlock || raw?.blocked || s === 'rejected' || s === 'blocked') return 'blocked';
  if (raw?.userApproved === true || s === 'approved' || s === 'completed') return 'approved';
  if (s === 'analyzing' || s === 'pending_decision' || s === 'pending' || s === 'intercepted') {
    return 'pending';
  }
  // Decided / unknown historical → don't treat as actionable pending
  if (raw?.userApproved === false) return 'blocked';
  return 'approved';
}

const TransactionAnalysis: React.FC<TransactionAnalysisProps> = ({ onBack, transactionId }) => {
  const isHistorical = Boolean(transactionId);
  const [data, setData] = useState<AnalysisView | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [status, setStatus] = useState<'pending' | 'approved' | 'blocked' | 'rejected'>('approved');

  const applyLiveAnalysis = useCallback((a: any) => {
    const isAnalyzing = a.status === 'analyzing';
    const mapped = mapDecisionStatus(a);
    // Live gate only while still waiting for a decision
    const actionable =
      isAnalyzing || a.status === 'pending_decision' || a.status === 'analyzing';
    const view: AnalysisView = {
      riskScore: a.riskScore ?? a.analysis?.score ?? 0,
      riskLevel: a.riskLevel ?? a.analysis?.level ?? 'medium',
      reasons: a.reasons ?? a.analysis?.reasons ?? [],
      from: a.transactionData?.from ?? a.parsedTransaction?.fromAddress,
      to: a.transactionData?.to ?? a.parsedTransaction?.toAddress,
      amount: a.transactionData?.amount ?? a.parsedTransaction?.amount,
      network: 'Solana',
      type: a.transactionData?.type ?? a.parsedTransaction?.type,
      source: a.source,
      requestId: a.requestId,
      scoreBreakdown: a.scoreBreakdown ?? a.analysis?.scoreBreakdown,
      aiSummary: a.aiSummary,
      status: actionable ? (isAnalyzing ? 'pending' : mapped) : mapped,
    };
    setData(view);
    setAnalyzing(isAnalyzing);
    if (isAnalyzing || a.status === 'pending_decision') {
      setStatus('pending');
    } else {
      setStatus(mapped === 'pending' ? 'approved' : mapped);
    }
    setLoading(false);
  }, []);

  const loadHistorical = useCallback(async (id: string) => {
    setLoading(true);
    setAnalyzing(false);
    try {
      const local = await getLocalHistory(100);
      const localHit = local.find((e) => e.id === id || e.signature === id);
      if (localHit) {
        const mapped = mapDecisionStatus(localHit);
        setData({
          riskScore: localHit.risk_score ?? 0,
          riskLevel: localHit.risk_level ?? 'medium',
          reasons: localHit.risk_reasons || [],
          from: localHit.from_address,
          to: localHit.to_address,
          amount: localHit.amount,
          network: 'Solana',
          type: localHit.type,
          source: localHit.source,
          status: mapped,
        });
        // Historical: never actionable — coerce pending → approved for button hide
        setStatus(mapped === 'pending' ? 'approved' : mapped);
        setLoading(false);
        return;
      }

      try {
        const api = ApiService.getInstance();
        const res = await api.getTransactionDetails(id);
        const tx = res.transaction as any;
        if (tx) {
          const mapped = mapDecisionStatus(tx);
          setData({
            riskScore: tx.risk_score ?? 0,
            riskLevel: tx.risk_level ?? 'medium',
            reasons: tx.analysis?.reasons || tx.risk_reasons || ['Saved analysis'],
            from: tx.from_address,
            to: tx.to_address,
            amount: tx.amount,
            network: 'Solana',
            type: tx.type,
            status: mapped,
          });
          setStatus(mapped === 'pending' ? 'approved' : mapped);
        }
      } catch (e) {
        console.warn('Historical API load failed', e);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLive = useCallback(async () => {
    try {
      const latest = await chrome.runtime.sendMessage({ type: 'GET_LATEST_ANALYSIS' });
      if (latest?.success && latest.analysis) {
        applyLiveAnalysis(latest.analysis);
        return;
      }
      setData(null);
    } catch (e) {
      console.error('Failed to load analysis:', e);
    } finally {
      setLoading(false);
    }
  }, [applyLiveAnalysis]);

  useEffect(() => {
    if (isHistorical && transactionId) {
      void loadHistorical(transactionId);
      return;
    }

    void loadLive();
    const interval = setInterval(loadLive, 800);
    const onStorage = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area === 'session' && changes.vetraLatestAnalysis?.newValue) {
        applyLiveAnalysis(changes.vetraLatestAnalysis.newValue);
      }
    };
    try {
      chrome.storage.onChanged.addListener(onStorage);
    } catch {
      /* ignore */
    }
    return () => {
      clearInterval(interval);
      try {
        chrome.storage.onChanged.removeListener(onStorage);
      } catch {
        /* ignore */
      }
    };
  }, [isHistorical, transactionId, loadHistorical, loadLive, applyLiveAnalysis]);

  const decide = async (approved: boolean) => {
    if (isHistorical) return;
    setStatus(approved ? 'approved' : 'blocked');
    setAnalyzing(false);
    try {
      await chrome.runtime.sendMessage({
        type: 'VETRA_ALERT_DECISION',
        approved,
        requestId: data?.requestId,
        riskLevel: data?.riskLevel,
        riskScore: data?.riskScore,
      });
    } catch {
      /* ignore */
    }
    onBack?.();
  };

  if (loading && !data) {
    return (
      <div className="w-full h-full bg-dark-bg text-dark-text flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-xs" style={{ color: '#858C94' }}>
            Interceptando…
          </p>
        </div>
      </div>
    );
  }

  const score = data?.riskScore ?? 0;
  const level = data?.riskLevel ?? 'medium';
  const color = analyzing ? '#F5A524' : levelColor(level);
  const circumference = 2 * Math.PI * 28;
  const dash = Math.min(100, Math.max(0, score)) * (circumference / 100);
  const reasons = (data?.reasons || []).slice(0, 3);
  const breakdown = (data?.scoreBreakdown || []).slice(0, 8);
  // Allow/Block only for live intercept awaiting decision — never for history
  const canDecide = !isHistorical && !analyzing && status === 'pending';
  const showOutcome =
    isHistorical || status === 'approved' || status === 'blocked' || status === 'rejected';

  return (
    <div
      className="w-full h-full bg-dark-bg text-dark-text flex flex-col overflow-hidden"
      style={{ padding: 12, gap: 10 }}
    >
      <style>{`
        @keyframes vetra-rainbow-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div className="flex items-center gap-2 shrink-0">
        <button className="p-1.5 text-gray-400 hover:text-white" onClick={onBack} type="button">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-bold" style={{ color: '#E6E6E6' }}>
          Transaction Analysis
        </h1>
      </div>

      {!data ? (
        <p className="text-sm text-gray-400 text-center mt-8">
          No analysis yet. Sign a Solana transaction to intercept.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-3 shrink-0">
            {analyzing ? (
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 64 64"
                  aria-hidden
                  style={{
                    animation: 'vetra-rainbow-spin 0.85s linear infinite',
                    willChange: 'transform',
                  }}
                >
                  <defs>
                    <linearGradient id="vetraRainbowStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#DA291C" />
                      <stop offset="16%" stopColor="#F5A524" />
                      <stop offset="33%" stopColor="#FBB500" />
                      <stop offset="50%" stopColor="#00D386" />
                      <stop offset="66%" stopColor="#3B82F6" />
                      <stop offset="83%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                  <circle cx="32" cy="32" r="28" stroke="#1E1E1E" strokeWidth="6" fill="none" />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="url(#vetraRainbowStroke)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="44 132"
                  />
                </svg>
              </div>
            ) : (
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" stroke="#1E1E1E" strokeWidth="6" fill="none" />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke={color}
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${dash} ${circumference}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span style={{ fontSize: 20, fontWeight: 700, color }}>{score}</span>
                </div>
              </div>
            )}
            <div className="min-w-0">
              {!analyzing && (
                <>
                  <p className="text-sm font-medium" style={{ color: '#E6E6E6' }}>
                    {level === 'high'
                      ? 'High risk'
                      : level === 'medium'
                        ? 'Medium risk'
                        : 'Low risk'}
                  </p>
                  <p className="text-xs truncate" style={{ color: '#858C94' }}>
                    0–100 · {data.source || 'local'}
                  </p>
                  {data.aiSummary && (
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#FBB500' }}>
                      {data.aiSummary}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="bg-dark-card rounded-lg px-3 py-2 shrink-0">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="min-w-0">
                <p style={{ color: '#858C94' }}>From</p>
                <p className="truncate" style={{ color: '#E6E6E6' }}>
                  {shortAddr(data.from)}
                </p>
              </div>
              <div className="min-w-0">
                <p style={{ color: '#858C94' }}>To</p>
                <p className="truncate" style={{ color: '#E6E6E6' }}>
                  {shortAddr(data.to)}
                </p>
              </div>
              <div className="min-w-0">
                <p style={{ color: '#858C94' }}>Value</p>
                <p className="truncate" style={{ color: '#E6E6E6' }}>
                  {data.amount && data.amount !== '0' && data.amount !== ''
                    ? `${data.amount} SOL`
                    : '—'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mt-2">
              <div>
                <p style={{ color: '#858C94' }}>Network</p>
                <p style={{ color: '#E6E6E6' }}>{data.network || 'Solana'}</p>
              </div>
              <div>
                <p style={{ color: '#858C94' }}>Type</p>
                <p style={{ color: '#E6E6E6' }}>{friendlyType(data.type)}</p>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            {canDecide && (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-lg h-10 text-sm font-medium"
                  style={{ backgroundColor: '#DA291C', color: '#fff' }}
                  onClick={() => decide(false)}
                >
                  Block
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-lg h-10 text-sm font-medium"
                  style={{ backgroundColor: '#00D386', color: '#0B0B0B' }}
                  onClick={() => decide(true)}
                >
                  Allow
                </button>
              </div>
            )}
            {analyzing && !isHistorical && (
              <div
                className="rounded-lg h-10 flex items-center justify-center text-sm"
                style={{ backgroundColor: '#1E1E1E', color: '#858C94' }}
                aria-busy
              >
                (interceptando...)
              </div>
            )}
            {showOutcome && !canDecide && !analyzing && (status === 'blocked' || status === 'rejected') && (
              <div
                className="rounded-lg h-10 flex items-center justify-center text-sm"
                style={{ backgroundColor: '#DA291C', color: '#fff' }}
              >
                Blocked
              </div>
            )}
            {showOutcome && !canDecide && !analyzing && status === 'approved' && (
              <div
                className="rounded-lg h-10 flex items-center justify-center text-sm"
                style={{ backgroundColor: '#00D386', color: '#0B0B0B' }}
              >
                Allowed
              </div>
            )}
          </div>

          <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
            <p className="text-sm shrink-0 mb-1.5" style={{ color: '#E6E6E6' }}>
              Motivos
            </p>
            <div className="space-y-1.5 overflow-hidden">
              {reasons.length === 0 ? (
                <div className="bg-dark-card rounded-lg px-3 py-2">
                  <p className="text-xs" style={{ color: '#858C94' }}>
                    {analyzing ? 'Aguardando análise…' : 'Nenhum motivo detalhado.'}
                  </p>
                </div>
              ) : (
                reasons.map((reason, i) => (
                  <div key={i} className="bg-dark-card rounded-lg px-3 py-2">
                    <p className="text-xs line-clamp-2" style={{ color: '#E6E6E6' }}>
                      {reason}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {breakdown.length > 0 && !analyzing && (
            <div className="shrink-0 bg-dark-card rounded-lg px-3 py-2">
              <p className="text-xs mb-1" style={{ color: '#858C94' }}>
                Parâmetros da nota
              </p>
              <div className="space-y-0.5">
                {breakdown.map((row, i) => (
                  <div key={i} className="flex justify-between gap-2 text-xs">
                    <span className="truncate" style={{ color: '#E6E6E6' }}>
                      {row.factor}
                    </span>
                    <span style={{ color: '#F5A524' }}>
                      {row.points >= 0 ? `+${row.points}` : row.points}
                    </span>
                  </div>
                ))}
                <div
                  className="flex justify-between text-xs pt-1"
                  style={{ borderTop: '1px solid #333' }}
                >
                  <span style={{ color: '#E6E6E6' }}>Total</span>
                  <span style={{ color: '#E6E6E6', fontWeight: 700 }}>{score}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransactionAnalysis;
