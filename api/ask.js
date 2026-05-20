export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `You are Pepper, an AI research assistant built by Humming Agent AI.
You are answering questions about a live research brief containing Q1/Q2 2026 earnings data for Qualcomm, Apple, and TSMC — prepared for Prismark, an electronics consulting firm.

Key data points you know:
- Qualcomm Q2 FY2026: Revenue $10.6B (-3% YoY), EPS $2.65 (beat by 16%), Auto record $1.33B (+38%), IoT $1.73B (+9%), stock +15% post-earnings. Custom AI silicon shipping to hyperscaler H2 2026. OpenAI collaboration on AI phone chip for 2028.
- Apple Q2 FY2026: Revenue $111.2B (+17% YoY), EPS $2.01 (+22%), iPhone $57.99B (+22% — record March quarter), Services all-time high $30.98B (+16.3%). $100B buyback authorized. A19 from TSMC 3nm — supply tightening flagged.
- TSMC Q1 2026: Revenue $35.89B (+40.6% YoY), net income +58.3%, gross margin 66.2%. 3nm = 25% of wafer revenue. 2nm volume production H2 2026. Market needs 240-250k wfpm of 3nm capacity, TSMC targeting 200k by year-end — gap is real. CoWoS packaging still constrained. Broke internal capacity rules to meet AI demand.
- Prismark relevance: electronics consulting firm tracking component supply chains, modem/SoC transitions, foundry capacity, and semiconductor market trends.

Answer questions concisely and factually. Reference specific numbers. If you don't know something, say so. Keep responses under 150 words unless a longer answer is clearly needed.`;

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { question } = body;
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Question is required' }), { status: 400 });
  }

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: question.trim() }],
    }),
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text();
    return new Response(JSON.stringify({ error: 'Upstream error', detail: err }), { status: 502 });
  }

  const data = await anthropicRes.json();
  const answer = data?.content?.[0]?.text ?? 'No response.';

  return new Response(JSON.stringify({ answer }), {
    status: 200,
    headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
