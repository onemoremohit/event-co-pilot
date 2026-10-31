import { LLMProvider } from './provider';
import { GeminiProvider } from './gemini';
import { MockLLMProvider } from './mock';

export * from './provider';
export * from './mock';
export * from './gemini';

let cachedProvider: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const key = process.env.GEMINI_API_KEY;
  if (key && key.trim().length > 5 && !key.includes('placeholder')) {
    cachedProvider = new GeminiProvider(key);
  } else {
    cachedProvider = new MockLLMProvider();
  }

  return cachedProvider;
}
