/**
 * Optional OpenAI enrichment for risk reasons (runs in extension background).
 * API key stays in chrome.storage.local — never logged.
 */

export interface OpenAiEnrichmentInput {
  from?: string;
  to?: string;
  amount?: string;
  type?: string;
  riskScore: number;
  riskLevel: string;
  reasons: string[];
  scoreBreakdown?: Array<{ factor: string; points: number; detail?: string }>;
  network?: string;
}

export interface OpenAiEnrichmentResult {
  reasons: string[];
  summary?: string;
  model?: string;
}

export async function enrichAnalysisWithOpenAI(
  apiKey: string,
  input: OpenAiEnrichmentInput
): Promise<OpenAiEnrichmentResult | null> {
  const key = apiKey?.trim();
  if (!key || !key.startsWith('sk-')) return null;

  const system = `You are Vetra, a Solana wallet security analyst.
Respond ONLY with valid JSON:
{"summary":"one short sentence in Portuguese","reasons":["reason1","reason2",...]}
Each reason must be concrete (what was found and why it affects risk). Max 6 reasons.
Do not invent addresses or amounts that are Unknown/missing.`;

  const user = JSON.stringify(
    {
      network: input.network || 'solana',
      from: input.from,
      to: input.to,
      amount: input.amount,
      type: input.type,
      heuristicScore: input.riskScore,
      heuristicLevel: input.riskLevel,
      heuristicReasons: input.reasons,
      scoreBreakdown: input.scoreBreakdown,
    },
    null,
    0
  );

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn('OpenAI enrichment HTTP', res.status, errText.slice(0, 200));
      return null;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') return null;

    const parsed = JSON.parse(content);
    const reasons = Array.isArray(parsed.reasons)
      ? parsed.reasons.map((r: unknown) => String(r)).filter(Boolean).slice(0, 6)
      : [];
    if (reasons.length === 0) return null;

    return {
      reasons,
      summary: typeof parsed.summary === 'string' ? parsed.summary : undefined,
      model: data?.model || 'gpt-4o-mini',
    };
  } catch (e) {
    console.warn('OpenAI enrichment failed:', e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
