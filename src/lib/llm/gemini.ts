import {
  LLMProvider,
  IntakeContext,
  IntakeResponse,
  IntakeResponseSchema,
  ExplainResponse,
  ExplainResponseSchema,
  VendorMessageRequest,
  VendorMessageResponse,
  VendorMessageResponseSchema
} from './provider';
import { MockLLMProvider } from './mock';
import { ChatMessage, EventProfile, BudgetPlan } from '../types';

export class GeminiProvider implements LLMProvider {
  name = 'GeminiProvider';
  private apiKey: string;
  private mockFallback: MockLLMProvider;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    this.mockFallback = new MockLLMProvider();
  }

  private hasKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5 && !this.apiKey.includes('placeholder'));
  }

  async chat(messages: ChatMessage[], context: IntakeContext): Promise<IntakeResponse> {
    if (!this.hasKey()) {
      return this.mockFallback.chat(messages, context);
    }

    const systemPrompt = `You are Event Co-pilot's Intake Agent for cultural community celebrations (e.g., Diwali festivals, Navratri, Durga Puja, Society Cultural Nights, Neighborhood gatherings).
Your mission is to understand the user's celebration details conversationally and populate the EventProfile.

RULES:
1. Speak in a warm, welcoming, Indian-event-friendly tone.
2. Only gather information for cultural community events. Required fields:
   - eventSubType: 'festival' | 'cultural_night' | 'neighborhood'
   - eventDate: YYYY-MM-DD
   - budgetAmount: positive integer in INR
   - guestCount: positive integer
   - priorities: array of 2 category slugs ('food_prasad', 'stage_sound', 'decor', 'performers', 'volunteers', 'safety', 'photography', 'venue_permissions')
   - experienceTier: 'normal' | 'premium'
   - city: string
3. Ask ONE clear question at a time.
4. When budget and guest count are known, mention the calculated per-head budget and present 2-3 candidate plan styles (Food-first, Look-first, Balanced, and DIY-Max if < 1200/head).
5. Never hallucinate budget allocations or final numbers — explain that the deterministic calculation engine computes the exact rupee distribution.
6. When all required fields are present, set isComplete to true.

Output format: Respond strictly with a JSON object matching this schema:
{
  "message": "Conversational response",
  "profileUpdate": { ...fields extracted from user input... },
  "suggestedQuickReplies": ["Option 1", "Option 2"],
  "candidatePlans": [ ...optional candidate styles... ],
  "isComplete": boolean
}`;

    const formattedHistory = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const prompt = `${systemPrompt}\n\nCURRENT PROFILE CONTEXT:\n${JSON.stringify(context, null, 2)}\n\nCHAT HISTORY:\n${formattedHistory}\n\nRespond with JSON:`;

    try {
      const result = await this.callGeminiWithRetry(prompt);
      const parsed = IntakeResponseSchema.safeParse(result);
      if (parsed.success) {
        return parsed.data;
      }
      console.warn('Gemini chat response failed schema validation. Falling back to mock:', parsed.error);
      return this.mockFallback.chat(messages, context);
    } catch (err) {
      console.warn('Gemini API error during chat. Falling back to mock:', err);
      return this.mockFallback.chat(messages, context);
    }
  }

  async generateExplanations(plan: BudgetPlan, profile: EventProfile): Promise<ExplainResponse> {
    if (!this.hasKey()) {
      return this.mockFallback.generateExplanations(plan, profile);
    }

    const prompt = `You are Event Co-pilot's Explain Agent. Given the deterministic budget allocation for "${profile.eventName}", write one concise, trustworthy justification sentence (under 15 words) for each budget category explaining why it is allocated this amount.

PLAN SUMMARY:
- Total: ₹${plan.totalBudget}
- Guests: ${profile.guestCount}
- Top Priorities: ${profile.priorities.top2.join(', ')}
- Categories:
${plan.categories.map(c => `- ${c.slug} (${c.label}): ₹${c.allocatedAmount} (floor: ₹${c.floorAmount})`).join('\n')}

Output format: Strictly a JSON object matching:
{
  "explanations": [
    { "targetId": "category_slug", "why": "One short justification sentence." }
  ]
}`;

    try {
      const result = await this.callGeminiWithRetry(prompt);
      const parsed = ExplainResponseSchema.safeParse(result);
      if (parsed.success) {
        return parsed.data;
      }
      return this.mockFallback.generateExplanations(plan, profile);
    } catch (err) {
      return this.mockFallback.generateExplanations(plan, profile);
    }
  }

  async generateVendorMessage(request: VendorMessageRequest): Promise<VendorMessageResponse> {
    if (!this.hasKey()) {
      return this.mockFallback.generateVendorMessage(request);
    }

    const { vendorType, allocatedBudget, profile } = request;
    const minBudget = Math.round(allocatedBudget * 0.85);
    const maxBudget = Math.round(allocatedBudget * 1.15);

    const prompt = `You are Event Co-pilot's Vendor Communications Agent.
Generate a professional, warm vendor enquiry letter for "${vendorType}" for our community celebration "${profile.eventName}" on ${profile.eventDate} in ${profile.location.city || 'India'}.
Budget bracket: ₹${minBudget.toLocaleString('en-IN')} – ₹${maxBudget.toLocaleString('en-IN')} (±15% bracket, do not mention exact figure).
Estimated guests: ${profile.guestCount}.

Output format: Strictly a JSON object:
{
  "vendorType": "${vendorType}",
  "subject": "Email subject line",
  "message": "Full letter body with [Your Name / Society Committee] placeholder",
  "budgetRangeText": "₹${minBudget.toLocaleString('en-IN')} – ₹${maxBudget.toLocaleString('en-IN')}",
  "checklistQuestions": ["Question 1", "Question 2", "Question 3"]
}`;

    try {
      const result = await this.callGeminiWithRetry(prompt);
      const parsed = VendorMessageResponseSchema.safeParse(result);
      if (parsed.success) {
        return parsed.data;
      }
      return this.mockFallback.generateVendorMessage(request);
    } catch (err) {
      return this.mockFallback.generateVendorMessage(request);
    }
  }

  private async callGeminiWithRetry(prompt: string, isRetry = false): Promise<any> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      }),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('No candidate content returned by Gemini');
    }

    return JSON.parse(candidateText);
  }
}
