import { NextResponse } from 'next/server';
import { getLLMProvider, GeminiProvider } from '@/lib/llm';

export async function GET() {
  const provider = getLLMProvider();
  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyConfigured = Boolean(apiKey && apiKey.trim().length > 5 && !apiKey.includes('placeholder'));

  let liveGeminiActive = false;
  let testError: string | null = null;
  const modelName = 'gemini-2.5-flash';

  if (isKeyConfigured) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'respond: {"status":"healthy"}' }] }],
          generationConfig: { responseMimeType: 'application/json' }
        }),
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        liveGeminiActive = true;
      } else {
        testError = `HTTP ${res.status}: ${res.statusText}`;
      }
    } catch (err: any) {
      testError = err.message || 'Connection timeout';
    }
  }

  return NextResponse.json({
    status: 'ok',
    provider: liveGeminiActive ? 'GeminiProvider' : 'MockLLMProvider',
    model: modelName,
    liveGeminiActive,
    keyConfigured: isKeyConfigured,
    testError,
    timestamp: new Date().toISOString()
  });
}

