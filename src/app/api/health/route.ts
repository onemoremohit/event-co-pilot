import { NextResponse } from 'next/server';
import { getLLMProvider, GeminiProvider } from '@/lib/llm';

export async function GET() {
  const provider = getLLMProvider();
  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyConfigured = Boolean(apiKey && apiKey.trim().length > 5 && !apiKey.includes('placeholder'));

  let liveGeminiActive = false;
  let testError: string | null = null;
  let activeModel = 'gemini-3.5-flash';
  const candidateModels = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];

  if (isKeyConfigured) {
    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'respond: {"status":"healthy"}' }] }],
            generationConfig: { responseMimeType: 'application/json' }
          }),
          signal: AbortSignal.timeout(6000)
        });
        if (res.ok) {
          liveGeminiActive = true;
          activeModel = model;
          testError = null;
          break;
        } else {
          testError = `HTTP ${res.status}: ${res.statusText}`;
        }
      } catch (err: any) {
        testError = err.message || 'Connection timeout';
      }
    }
  }

  return NextResponse.json({
    status: 'ok',
    provider: liveGeminiActive ? 'GeminiProvider' : 'MockLLMProvider',
    model: activeModel,
    liveGeminiActive,
    keyConfigured: isKeyConfigured,
    testError,
    timestamp: new Date().toISOString()
  });
}

