/// <reference types="chrome"/>

import { Transaction } from '@solana/web3.js';
import { parseTransaction } from '../lib/solana/transaction-parser';
import { analyzeTransaction as analyzeLocal } from '../lib/risk-analyzer';
import { enrichAnalysisWithOpenAI } from '../lib/ai/openai-enrichment';
import {
  appendLocalHistory,
  normalizeTxType,
  updateLocalHistoryStatus,
} from '../lib/history/local-history';
import ApiService from '../services/api-service';
import AuthService from '../services/auth-service';
import { DEFAULT_SETTINGS } from '../types/settings';

console.log('🟡 Vetra background service worker initialized');

const apiService = ApiService.getInstance();
const authService = AuthService.getInstance();

/** Pending Block/Allow decisions keyed by intercept requestId */
const pendingUserDecisions = new Map<
  string,
  { resolve: (approved: boolean) => void; timer: ReturnType<typeof setTimeout> }
>();

function waitForUserDecision(requestId: string, timeoutMs = 90_000): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pendingUserDecisions.delete(requestId);
      console.warn('⏱️ User decision timeout — fail-open (allow)', requestId);
      resolve(true);
    }, timeoutMs);
    pendingUserDecisions.set(requestId, { resolve, timer });
  });
}

function resolveUserDecision(requestId: string | undefined, approved: boolean): boolean {
  if (!requestId) return false;
  const pending = pendingUserDecisions.get(requestId);
  if (!pending) return false;
  clearTimeout(pending.timer);
  pendingUserDecisions.delete(requestId);
  pending.resolve(approved);
  return true;
}

async function ensureAuthToken(): Promise<boolean> {
  try {
    await authService.waitForInitialization();
    // Re-read from storage — guest login happens in popup after SW may have started
    const stored = await chrome.storage.local.get(['authState']);
    const state = stored.authState;
    if (state?.token) {
      apiService.setAuthToken(state.token);
      return true;
    }
    const live = authService.getAuthState();
    if (live?.token) {
      apiService.setAuthToken(live.token);
      return true;
    }
  } catch (e) {
    console.warn('ensureAuthToken failed', e);
  }
  return false;
}

async function persistHistoryRecord(opts: {
  id: string;
  transactionData: any;
  riskScore: number;
  riskLevel: string;
  reasons: string[];
  status: string;
  source?: string;
  saveToBackend?: boolean;
}): Promise<void> {
  const now = new Date().toISOString();
  const type = normalizeTxType(opts.transactionData?.type);
  const signature =
    opts.transactionData?.signature ||
    `local-${opts.id}`;

  await appendLocalHistory({
    id: opts.id,
    signature,
    type,
    from_address: opts.transactionData?.from || 'Unknown',
    to_address: opts.transactionData?.to || 'Unknown',
    amount: String(opts.transactionData?.amount ?? '0'),
    token_address: opts.transactionData?.token || null,
    risk_score: opts.riskScore,
    risk_level: opts.riskLevel,
    risk_reasons: opts.reasons || [],
    status: opts.status,
    analyzed_at: now,
    created_at: now,
    source: opts.source,
  });

  if (opts.saveToBackend === false) return;

  const authed = await ensureAuthToken();
  if (!authed) {
    console.warn('⚠️ No auth token — history saved locally only');
    return;
  }

  try {
    await apiService.analyzeTransaction({
      signature,
      type,
      from: opts.transactionData?.from || 'Unknown',
      to: opts.transactionData?.to || 'Unknown',
      amount: String(opts.transactionData?.amount ?? '0'),
      token: opts.transactionData?.token,
      timestamp: Date.now(),
    });
  } catch (e) {
    console.warn('⚠️ Backend history save failed (local copy kept):', e);
  }
}

async function getAutoBlockHighRisk(): Promise<boolean> {
  try {
    const { vetraSettings } = await chrome.storage.local.get('vetraSettings');
    if (vetraSettings && typeof vetraSettings.autoBlockHighRisk === 'boolean') {
      return vetraSettings.autoBlockHighRisk;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_SETTINGS.autoBlockHighRisk;
}

async function getOpenAiSettings(): Promise<{ apiKey: string; enabled: boolean }> {
  try {
    const { vetraSettings } = await chrome.storage.local.get('vetraSettings');
    const apiKey =
      (vetraSettings?.openaiApiKey as string) ||
      DEFAULT_SETTINGS.openaiApiKey ||
      '';
    const enabled =
      vetraSettings?.openaiEnrichment !== false && DEFAULT_SETTINGS.openaiEnrichment;
    return { apiKey, enabled };
  } catch {
    return { apiKey: '', enabled: false };
  }
}

function formatAmountForDisplay(raw?: string | number): string {
  if (raw === undefined || raw === null || raw === '' || raw === 'Unknown') return '';
  const s = String(raw).trim();
  const n = typeof raw === 'number' ? raw : parseFloat(s);
  if (!Number.isFinite(n) || n === 0) return '';
  // Parser stores lamports (integer). Convert to SOL for UI.
  if (!s.includes('.') && (n >= 1_000 || Number.isInteger(n))) {
    const sol = n / 1e9;
    if (sol >= 0.0001) return sol.toFixed(4).replace(/\.?0+$/, '') || sol.toFixed(4);
    return sol.toPrecision(4);
  }
  return s;
}

async function maybeEnrichWithOpenAI(analysis: any, transactionData: any): Promise<any> {
  const { apiKey, enabled } = await getOpenAiSettings();
  if (!enabled || !apiKey) return analysis;

  const enriched = await enrichAnalysisWithOpenAI(apiKey, {
    from: transactionData?.from,
    to: transactionData?.to,
    amount: transactionData?.amount,
    type: transactionData?.type,
    riskScore: analysis.score ?? analysis.riskScore ?? 0,
    riskLevel: analysis.level ?? analysis.riskLevel ?? 'medium',
    reasons: analysis.reasons || [],
    scoreBreakdown: analysis.scoreBreakdown,
    network: 'solana',
  });

  if (!enriched) return analysis;

  return {
    ...analysis,
    reasons: enriched.reasons,
    aiSummary: enriched.summary,
    aiModel: enriched.model,
    sourceAi: 'openai',
  };
}

async function initializeServices() {
  try {
    await authService.waitForInitialization();
    const authState = authService.getAuthState();
    if (authState?.token) {
      apiService.setAuthToken(authState.token);
      console.log('✅ Auth token loaded into API service');
    } else {
      console.log('ℹ️ No auth token found');
    }
  } catch (e) {
    console.warn('⚠️ initializeServices failed:', e);
  }
}

initializeServices();

chrome.runtime.onStartup?.addListener(() => {
  console.log('🔁 onStartup → reinitializing services');
  initializeServices();
});

async function injectIntoTab(tabId: number): Promise<{ ok: boolean; error?: string }> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ['injected.js'],
      world: 'MAIN',
      injectImmediately: true,
    });
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ['content.js'],
      world: 'ISOLATED',
      injectImmediately: true,
    });
    try {
      await chrome.action.setBadgeText({ text: 'ON' });
      await chrome.action.setBadgeBackgroundColor({ color: '#00D386' });
    } catch {
      /* ignore */
    }
    console.log('✅ Injected Vetra into tab', tabId);
    return { ok: true };
  } catch (e: any) {
    console.warn('❌ injectIntoTab failed', tabId, e);
    return { ok: false, error: e?.message || String(e) };
  }
}

async function registerDynamicContentScripts(): Promise<void> {
  try {
    await chrome.scripting.unregisterContentScripts();
  } catch {
    /* ignore */
  }
  try {
    await chrome.scripting.registerContentScripts([
      {
        id: 'vetra-main',
        matches: ['http://*/*', 'https://*/*'],
        js: ['injected.js'],
        runAt: 'document_start',
        world: 'MAIN',
        allFrames: true,
        persistAcrossSessions: true,
      },
      {
        id: 'vetra-bridge',
        matches: ['http://*/*', 'https://*/*'],
        js: ['content.js'],
        runAt: 'document_start',
        world: 'ISOLATED',
        allFrames: true,
        persistAcrossSessions: true,
      },
    ]);
    console.log('✅ Dynamic content scripts registered');
  } catch (e) {
    console.warn('⚠️ registerContentScripts failed (manifest scripts still apply):', e);
  }
}

chrome.runtime.onInstalled?.addListener(() => {
  void registerDynamicContentScripts();
  void initializeServices();
});

void registerDynamicContentScripts();

chrome.tabs?.onUpdated?.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'loading' && changeInfo.status !== 'complete') return;
  const url = tab.url || '';
  if (!/^https?:\/\//i.test(url)) return;
  if (/^(chrome|chrome-extension|edge|about|devtools):/i.test(url)) return;
  void injectIntoTab(tabId);
});

async function persistLatestAnalysis(result: Record<string, unknown>): Promise<void> {
  try {
    await chrome.storage.session.set({
      vetraLatestAnalysis: {
        ...result,
        ts: Date.now(),
      },
    });
  } catch (e) {
    console.warn('⚠️ vetraLatestAnalysis write failed:', e);
  }
}

/** Open popup (or floating window) as soon as we know a tx was intercepted. */
async function surfaceInterceptUi(partial: Record<string, unknown>): Promise<void> {
  await persistLatestAnalysis(partial);

  try {
    await chrome.action.setBadgeText({ text: '…' });
    await chrome.action.setBadgeBackgroundColor({ color: '#F5A524' });
  } catch {
    /* ignore */
  }

  try {
    await chrome.action.openPopup();
    return;
  } catch (e) {
    console.warn('⚠️ openPopup early failed, falling back to window:', e);
  }

  try {
    await chrome.windows.create({
      url: chrome.runtime.getURL('index.html'),
      type: 'popup',
      width: 380,
      height: 620,
      focused: true,
    });
  } catch (e) {
    console.warn('⚠️ windows.create fallback failed:', e);
    try {
      await chrome.notifications.create('vetra-intercept-' + String(partial.requestId || Date.now()), {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
        title: 'Vetra — transação interceptada',
        message: 'Abra a extensão para revisar Block / Allow.',
        priority: 2,
      });
    } catch {
      /* ignore */
    }
  }
}

async function notifyHighRisk(result: {
  riskLevel?: string;
  riskScore?: number;
  reasons?: string[];
  requestId?: string;
}): Promise<void> {
  const payload = {
    title: 'Vetra: alto risco detectado',
    riskLevel: result.riskLevel,
    riskScore: result.riskScore,
    reasons: Array.isArray(result.reasons) ? result.reasons.slice(0, 8) : [],
    requestId: result.requestId,
    ts: Date.now(),
  };

  try {
    await chrome.storage.session.set({ vetraPendingAlert: payload });
  } catch (e) {
    console.warn('⚠️ vetraPendingAlert session write failed:', e);
  }

  try {
    await chrome.windows.create({
      url: chrome.runtime.getURL('alert.html'),
      type: 'popup',
      width: 440,
      height: 420,
      focused: true,
    });
    return;
  } catch (e) {
    console.warn('⚠️ windows.create for alert failed:', e);
  }

  try {
    await chrome.action.openPopup();
  } catch {
    /* ignore */
  }

  try {
    await chrome.notifications.create('vetra-high-risk', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
      title: 'Vetra — alto risco',
      message:
        (payload.reasons && payload.reasons[0]) ||
        'Revise a transação antes de assinar.',
    });
  } catch (e) {
    console.warn('⚠️ notifications.create failed:', e);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'INJECT_PAGE_SCRIPT' && sender.tab?.id) {
    void injectIntoTab(sender.tab.id).then(sendResponse);
    return true;
  }

  if (message?.type === 'INJECT_ACTIVE_TAB') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        sendResponse({ ok: false, error: 'No active tab' });
        return;
      }
      const url = tab.url || '';
      if (!/^https?:\/\//i.test(url)) {
        sendResponse({
          ok: false,
          error: 'Open an http(s) page first (e.g. http://127.0.0.1:8080/...)',
          url,
        });
        return;
      }
      void injectIntoTab(tab.id).then(sendResponse);
    });
    return true;
  }

  if (message?.type === 'ANALYZE_TRANSACTION') {
    handleTransactionAnalysis(message.payload, message.requestId)
      .then(sendResponse)
      .catch((error) => {
        console.error('❌ Error analyzing transaction:', error);
        sendResponse({
          success: false,
          error: error?.message || String(error),
          riskScore: 50,
          riskLevel: 'medium',
          userApproved: true,
          shouldBlock: false,
        });
      });
    return true;
  }

  if (message?.type === 'ANALYZE_RPC_TRANSACTION') {
    handleRPCTransactionAnalysis(message.payload)
      .then(sendResponse)
      .catch((error) => {
        console.error('❌ Error analyzing RPC transaction:', error);
        sendResponse({
          success: false,
          error: error?.message || String(error),
          riskLevel: 'medium',
          riskScore: 50,
        });
      });
    return true;
  }

  if (message?.type === 'GET_ATTESTATIONS') {
    handleGetAttestations(message.payload)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({
          success: false,
          error: error?.message || String(error),
          attestations: [],
        });
      });
    return true;
  }

  if (message?.type === 'GET_LATEST_ANALYSIS') {
    chrome.storage.session
      .get('vetraLatestAnalysis')
      .then(({ vetraLatestAnalysis }) => {
        sendResponse({ success: true, analysis: vetraLatestAnalysis || null });
      })
      .catch((e) => sendResponse({ success: false, error: String(e) }));
    return true;
  }

  if (message?.type === 'VETRA_ALERT_DECISION') {
    const approved = message.approved === true;
    const requestId = message.requestId as string | undefined;

    // Unblock the awaiting inject hook (Block must stop signTransaction)
    const resolved = resolveUserDecision(requestId, approved);
    console.log('📥 User decision', { requestId, approved, resolved });

    // Also forward to active tab content script (legacy / multi-tab)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId != null) {
        chrome.tabs.sendMessage(tabId, {
          type: 'VETRA_USER_DECISION',
          approved,
          requestId,
          riskLevel: message.riskLevel,
          riskScore: message.riskScore,
        });
      }
      sendResponse({ ok: true, resolved });
    });
    return true;
  }

  return false;
});

async function runLocalHeuristicAnalysis(transaction: Transaction) {
  try {
    if (!transaction?.instructions?.length) {
      return {
        score: 40,
        level: 'medium' as const,
        reasons: [
          'Could not decode transaction bytes for local heuristics',
          'Metadata incomplete — Block/Allow still applies',
        ],
        scoreBreakdown: [
          { factor: 'decode_fallback', points: 40, detail: 'Empty or undecoded transaction' },
        ],
        heuristics: {
          tokenCheck: false,
          programCheck: false,
          accountReputation: 50,
          amountAnalysis: false,
        },
      };
    }
    return await analyzeLocal(transaction);
  } catch (e) {
    console.warn('⚠️ Local risk analyzer failed:', e);
    return {
      score: 50,
      level: 'medium' as const,
      reasons: [
        'Local heuristic analysis failed to run',
        String((e as Error)?.message || e),
      ],
      scoreBreakdown: [
        { factor: 'analyzer_error', points: 50, detail: 'Exception in local analyzer' },
      ],
      heuristics: {
        tokenCheck: false,
        programCheck: false,
        accountReputation: 50,
        amountAnalysis: false,
      },
    };
  }
}

async function handleTransactionAnalysis(payload: any, requestId?: string) {
  console.log('🔍 Analyzing transaction payload:', payload);
  console.log('🔐 Vetra: Intercepting sign path in background', { requestId });

  const decisionId =
    (typeof requestId === 'string' && requestId.length > 0
      ? requestId
      : Math.random().toString(36).slice(2)) as string;

  // Open UI immediately — don't wait for parse / API / OpenAI
  void surfaceInterceptUi({
    success: true,
    status: 'analyzing',
    riskScore: 0,
    riskLevel: 'medium',
    reasons: ['Analisando transação…'],
    requestId: decisionId,
    shouldBlock: false,
    blocked: false,
    source: 'intercept',
  });

  const transaction = reconstructTransaction(payload?.transaction);
  let parsedTx: any = {};
  try {
    parsedTx = parseTransaction(transaction);
  } catch (e) {
    console.warn('⚠️ parseTransaction failed, using minimal parsedTx:', e);
    parsedTx = {
      signature: undefined,
      type: 'unknown',
      fromAddress: undefined,
      toAddress: undefined,
      amount: undefined,
      tokenAddress: undefined,
      instructions: transaction?.instructions ?? [],
      programs: [],
    };
  }

  const transactionData = {
    signature: parsedTx.signature || `vetra-${decisionId}`,
    type: normalizeTxType(parsedTx.type || payload?.method || 'other'),
    from: parsedTx.fromAddress || 'Unknown',
    to: parsedTx.toAddress || 'Unknown',
    amount: formatAmountForDisplay(parsedTx.amount) || parsedTx.amount || '0',
    token: parsedTx.tokenAddress,
    timestamp: Date.now(),
    instructions: parsedTx.instructions,
    programs: parsedTx.programs || parsedTx.metadata?.programIds || [],
  };

  // First useful info: From / To / amount — refresh UI before heavy analysis
  await persistLatestAnalysis({
    success: true,
    status: 'analyzing',
    riskScore: 0,
    riskLevel: 'medium',
    reasons: ['Analisando risco…'],
    requestId: decisionId,
    shouldBlock: false,
    blocked: false,
    transactionData,
    parsedTransaction: parsedTx,
    source: 'parse',
  });

  // Fast local score first so the popup isn't empty while API/AI run
  const local = await runLocalHeuristicAnalysis(transaction);
  let analysis: any = {
    score: local.score,
    level: local.level,
    reasons: local.reasons,
    heuristics: local.heuristics,
    scoreBreakdown: local.scoreBreakdown,
    recommendations: [],
    confidence: 0.6,
  };
  let source = 'local';
  let savedOnBackend = false;

  await persistLatestAnalysis({
    success: true,
    status: 'analyzing',
    riskScore: analysis.score,
    riskLevel: analysis.level,
    reasons: analysis.reasons ?? [],
    heuristics: analysis.heuristics ?? {},
    scoreBreakdown: analysis.scoreBreakdown ?? [],
    requestId: decisionId,
    shouldBlock: false,
    blocked: false,
    transactionData,
    parsedTransaction: parsedTx,
    source,
  });

  const hasAuth = await ensureAuthToken();
  if (hasAuth) {
    try {
      const analysisResponse = await apiService.analyzeTransaction(transactionData);
      const remote = analysisResponse?.analysis ?? null;
      if (remote) {
        const remoteBreakdown = Array.isArray(remote.scoreBreakdown)
          ? remote.scoreBreakdown
          : [];
        const localBreakdown = Array.isArray(analysis.scoreBreakdown)
          ? analysis.scoreBreakdown
          : [];
        // Prefer backend breakdown when present; otherwise keep local so UI isn't just "baseline"
        let scoreBreakdown =
          remoteBreakdown.length > 0 ? remoteBreakdown : localBreakdown;

        // If backend score ≠ sum of kept local rows, rebuild so Total matches the list
        const remoteScore = Number(remote.score ?? remote.riskScore ?? analysis.score);
        const sumParts = (scoreBreakdown || []).reduce(
          (acc: number, row: any) => acc + (Number(row.points) || 0),
          0
        );
        if (
          remoteBreakdown.length > 0 &&
          Number.isFinite(remoteScore) &&
          Math.abs(sumParts - remoteScore) > 1
        ) {
          const delta = remoteScore - sumParts;
          scoreBreakdown = [
            ...remoteBreakdown,
            {
              factor: 'other_signals',
              points: delta,
              detail: 'Remaining score adjustments',
            },
          ];
        } else if (
          remoteBreakdown.length === 0 &&
          Number.isFinite(remoteScore) &&
          Math.abs(sumParts - remoteScore) > 1
        ) {
          // Backend gave a new score without breakdown — synthesize from reasons
          scoreBreakdown = [
            { factor: 'baseline', points: 20, detail: 'Backend baseline' },
          ];
          let accounted = 20;
          const reasonRows = Array.isArray(remote.reasons) ? remote.reasons : [];
          for (const r of reasonRows) {
            const text = String(r);
            let points = 0;
            let factor = 'signal';
            if (/unfunded|no on-chain history/i.test(text)) {
              points = 12;
              factor = 'unfunded_destination';
            } else if (/Very high transaction amount/i.test(text)) {
              points = 25;
              factor = 'amount';
            } else if (/High transaction amount/i.test(text)) {
              points = 15;
              factor = 'amount';
            } else if (/Approval|allowance/i.test(text)) {
              points = 30;
              factor = 'approve';
            } else if (/Limited transaction metadata/i.test(text)) {
              points = 10;
              factor = 'limited_metadata';
            } else if (/Destination address unknown/i.test(text)) {
              points = 8;
              factor = 'unknown_destination';
            } else if (/many instructions/i.test(text)) {
              points = 8;
              factor = 'many_instructions';
            } else {
              continue;
            }
            scoreBreakdown.push({ factor, points, detail: text });
            accounted += points;
          }
          const delta = remoteScore - accounted;
          if (Math.abs(delta) > 0) {
            scoreBreakdown.push({
              factor: 'other_signals',
              points: delta,
              detail: 'Remaining score adjustments',
            });
          }
        }

        analysis = {
          ...analysis,
          ...remote,
          score: remote.score ?? remote.riskScore ?? analysis.score,
          level: remote.level ?? remote.riskLevel ?? analysis.level,
          reasons: remote.reasons?.length ? remote.reasons : analysis.reasons,
          scoreBreakdown,
          heuristics: remote.heuristics ?? analysis.heuristics,
        };
        source = analysisResponse?.cached ? 'backend-cached' : 'backend';
        savedOnBackend = !!analysisResponse?.success || !!remote;
        await persistLatestAnalysis({
          success: true,
          status: 'analyzing',
          riskScore: analysis.score,
          riskLevel: analysis.level,
          reasons: analysis.reasons ?? [],
          heuristics: analysis.heuristics ?? {},
          scoreBreakdown: analysis.scoreBreakdown ?? [],
          requestId: decisionId,
          shouldBlock: false,
          blocked: false,
          transactionData,
          parsedTransaction: parsedTx,
          source,
        });
      }
    } catch (e) {
      console.warn('⚠️ Backend analysis failed, keeping local heuristics:', e);
    }
  } else {
    console.warn('⚠️ User not authenticated — using local heuristics only');
  }

  analysis = await maybeEnrichWithOpenAI(analysis, transactionData);
  if (analysis?.sourceAi === 'openai') {
    source = `${source}+openai`;
  }

  const autoBlock = await getAutoBlockHighRisk();
  const riskLevel = analysis.level ?? 'medium';
  const riskScore = analysis.score ?? 50;

  // High + autoBlock: hard stop without UI
  if (riskLevel === 'high' && autoBlock) {
    const result = {
      success: true,
      riskScore,
      riskLevel,
      reasons: analysis.reasons ?? [],
      heuristics: analysis.heuristics ?? {},
      recommendations: analysis.recommendations ?? [],
      confidence: analysis.confidence ?? 0.5,
      parsedTransaction: parsedTx,
      transactionData,
      source,
      requestId: decisionId,
      userApproved: false,
      shouldBlock: true,
      blocked: true,
    };
    await persistLatestAnalysis(result);
    await persistHistoryRecord({
      id: decisionId,
      transactionData,
      riskScore,
      riskLevel,
      reasons: analysis.reasons ?? [],
      status: 'rejected',
      source,
      saveToBackend: !savedOnBackend,
    });
    return result;
  }

  // Always gate on Block/Allow so the user sees Vetra before Phantom
  const needsUserDecision = true;

  const baseResult = {
    success: true,
    riskScore,
    riskLevel,
    reasons: analysis.reasons ?? [],
    heuristics: analysis.heuristics ?? {},
    scoreBreakdown: analysis.scoreBreakdown ?? [],
    aiSummary: analysis.aiSummary,
    aiModel: analysis.aiModel,
    recommendations: analysis.recommendations ?? [],
    confidence: analysis.confidence ?? 0.5,
    parsedTransaction: parsedTx,
    transactionData,
    source,
    requestId: decisionId,
  };

  await persistLatestAnalysis({
    ...baseResult,
    userApproved: undefined,
    shouldBlock: false,
    blocked: false,
    status: 'pending_decision',
  });

  try {
    await chrome.action.setBadgeText({ text: String(Math.round(riskScore)) });
    await chrome.action.setBadgeBackgroundColor({
      color:
        riskLevel === 'high' ? '#DA291C' : riskLevel === 'medium' ? '#F5A524' : '#00D386',
    });
  } catch {
    /* ignore */
  }

  if (!needsUserDecision) {
    const result = {
      ...baseResult,
      userApproved: true,
      shouldBlock: false,
      blocked: false,
    };
    await persistLatestAnalysis(result);
    await persistHistoryRecord({
      id: decisionId,
      transactionData,
      riskScore,
      riskLevel,
      reasons: analysis.reasons ?? [],
      status: 'approved',
      source,
      saveToBackend: !savedOnBackend,
    });
    return result;
  }

  // Store alert payload so popup/alert UI can send decision with requestId
  try {
    await chrome.storage.session.set({
      vetraPendingAlert: {
        title: `Vetra: risco ${riskLevel}`,
        riskLevel,
        riskScore,
        reasons: Array.isArray(analysis.reasons) ? analysis.reasons.slice(0, 8) : [],
        requestId: decisionId,
        ts: Date.now(),
      },
    });
  } catch (e) {
    console.warn('⚠️ vetraPendingAlert write failed:', e);
  }

  // Popup already opened at intercept start — only nudge if still closed
  try {
    await chrome.action.openPopup();
  } catch {
    /* already open or gesture-blocked — UI updates via session storage */
  }

  console.log('⏳ Waiting for Block/Allow decision…', decisionId);

  // Show in Recent Activity / History immediately
  await persistHistoryRecord({
    id: decisionId,
    transactionData,
    riskScore,
    riskLevel,
    reasons: analysis.reasons ?? [],
    status: 'pending',
    source,
    saveToBackend: !savedOnBackend,
  });

  const approved = await waitForUserDecision(decisionId, 90_000);
  console.log('✅ Decision received:', { decisionId, approved });

  const result = {
    ...baseResult,
    userApproved: approved,
    shouldBlock: !approved,
    blocked: !approved,
    status: approved ? 'approved' : 'rejected',
  };
  await persistLatestAnalysis(result);
  await updateLocalHistoryStatus(decisionId, approved ? 'approved' : 'rejected');

  return result;
}

async function handleRPCTransactionAnalysis(payload: any) {
  console.log('🔥 Analyzing RPC transaction...', payload);
  const { url, method, params } = payload || {};

  // Do not overwrite a richer signTransaction analysis already waiting for Block/Allow
  try {
    const { vetraLatestAnalysis } = await chrome.storage.session.get('vetraLatestAnalysis');
    const latest = vetraLatestAnalysis as any;
    if (
      latest &&
      Date.now() - (latest.ts || 0) < 120_000 &&
      latest.transactionData?.type &&
      latest.transactionData.type !== 'rpc_send' &&
      (latest.status === 'pending_decision' || latest.requestId)
    ) {
      console.log('⏭️ Skipping RPC overwrite — sign analysis already pending');
      return {
        success: true,
        skipped: true,
        riskLevel: latest.riskLevel,
        riskScore: latest.riskScore,
        reasons: latest.reasons || [],
      };
    }
  } catch {
    /* ignore */
  }

  const transactionData = {
    signature: undefined,
    type: 'rpc_send',
    from: 'Unknown',
    to: 'Unknown',
    amount: '0',
    token: undefined,
    timestamp: Date.now(),
    rpcMethod: method,
    rpcUrl: url,
    rpcParams: params,
  };

  const analysis = {
    score: 45,
    level: 'medium' as const,
    reasons: [
      'RPC-level send detected (sendTransaction/sendRawTransaction)',
      'Limited metadata at RPC layer — prefer analyzing the wallet signTransaction path',
    ],
    scoreBreakdown: [
      { factor: 'rpc_send', points: 45, detail: 'Baseline for opaque RPC broadcast' },
    ],
    confidence: 0.4,
  };

  const enriched = await maybeEnrichWithOpenAI(analysis, transactionData);

  const result = {
    success: true,
    analysis: enriched,
    riskLevel: enriched.level,
    riskScore: enriched.score,
    reasons: enriched.reasons || [],
    scoreBreakdown: enriched.scoreBreakdown || [],
    userApproved: true,
    shouldBlock: false,
    blocked: false,
  };

  await persistLatestAnalysis({
    ...result,
    transactionData,
    source: enriched.sourceAi === 'openai' ? 'rpc+openai' : 'rpc',
  });

  return result;
}

async function handleGetAttestations(payload: any) {
  try {
    const { transactionHash } = payload || {};
    if (!transactionHash) throw new Error('Transaction hash is required');
    const response = await apiService.getAttestations(transactionHash);
    return {
      success: true,
      attestations: response?.attestations ?? [],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || String(error),
      attestations: [],
    };
  }
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function reconstructTransaction(transactionData: any): Transaction {
  try {
    if (transactionData instanceof Transaction) return transactionData;

    if (typeof transactionData === 'string') {
      return Transaction.from(base64ToBytes(transactionData));
    }

    if (transactionData?.serialized) {
      return Transaction.from(base64ToBytes(String(transactionData.serialized)));
    }

    if (transactionData instanceof Uint8Array) {
      return Transaction.from(transactionData);
    }
    if (transactionData?.type === 'Buffer' && Array.isArray(transactionData?.data)) {
      return Transaction.from(Uint8Array.from(transactionData.data));
    }

    // postMessage-cloned partial object (last resort)
    const tx = new Transaction();
    if (transactionData?.recentBlockhash) {
      tx.recentBlockhash = transactionData.recentBlockhash;
    }
    if (transactionData?.feePayer) {
      try {
        const { PublicKey } = require('@solana/web3.js');
        tx.feePayer =
          typeof transactionData.feePayer === 'string'
            ? new PublicKey(transactionData.feePayer)
            : transactionData.feePayer;
      } catch {
        /* ignore */
      }
    }
    if (Array.isArray(transactionData?.instructions) && transactionData.instructions.length) {
      (tx as any).instructions = transactionData.instructions;
    }
    return tx;
  } catch (error) {
    console.error('❌ Error reconstructing transaction:', error);
    return new Transaction();
  }
}

chrome.runtime.onInstalled.addListener((details) => {
  console.log('🧩 Vetra extension installed/updated:', details?.reason);
});

export {};
