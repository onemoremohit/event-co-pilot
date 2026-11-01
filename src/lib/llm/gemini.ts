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
  public readonly modelName = 'gemini-2.5-flash';
  private apiKey: string;
  private mockFallback: MockLLMProvider;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    this.mockFallback = new MockLLMProvider();
  }

  public hasKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5 && !this.apiKey.includes('placeholder'));
  }

  async chat(messages: ChatMessage[], context: IntakeContext): Promise<IntakeResponse> {
    if (!this.hasKey()) {
      return this.mockFallback.chat(messages, context);
    }

    const todayISO = new Date().toISOString().split('T')[0];
    const systemPrompt = `You are Event Co-pilot's Intake Agent for Indian cultural community celebrations (e.g., Diwali festivals, Navratri, Durga Puja, Society Cultural Nights, Neighborhood gatherings).
Your mission is to understand the user's celebration details conversationally and extract structured fields.
TODAY'S REFERENCE DATE: ${todayISO} (Anchor all relative dates and yearless dates to this date!).

CRITICAL EXTRACTION RULES:
1. ONLY extract fields that the user explicitly mentions or confirms in their messages.
2. NEVER guess, assume, or inject default budgets, guest counts, dates, or cities that the user did not specify!
3. If the user corrects a field (e.g., "make it 150 guests" or "actually budget is 2.5L"), update ONLY that field in profileUpdate.
4. Required fields to gather:
   - eventSubType: 'festival' | 'cultural_night' | 'neighborhood'
   - eventName: descriptive string
   - budgetAmount: positive integer in INR (e.g. 400000 for 4 lakh, 150000 for 1.5L)
   - guestCount: positive integer
   - eventDate: YYYY-MM-DD. When user specifies a date without an explicit year (e.g. "11th of nov", "15 December", "in 3 weeks"), resolve it to the UPCOMING occurrence relative to ${todayISO}. If the date for the current year is in the past, roll it over to next year! Never output a past year for an event being planned.
   - city: free-text string (e.g. "Ghaziabad", "Meerut", "Noida", "Bengaluru", "Village near Pune")
   - locationTier: 'metro' | 'tier2' | 'small_town' | 'village' (NCR satellite cities like Ghaziabad, Noida, Gurugram, Faridabad are 'metro'; Meerut and large regional cities are 'tier2'; small towns are 'small_town'; villages are 'village')
   - priorities: array of 2 category slugs ('food_prasad', 'stage_sound', 'decor', 'performers', 'volunteers', 'safety', 'photography', 'venue_permissions')
5. Ask ONE clear question at a time for the next missing field in order: event sub-type -> budget -> guest count -> date -> location -> priorities.
   LOCATION HANDLING RULES:
   - Never ask for the city name twice!
   - If a typed city/location cannot be matched, ask ONE fallback question: "How would you describe your location?" with options:
     (a) "Big metro, for example Delhi NCR, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata, Pune"
     (b) "Large city, for example Jaipur, Lucknow, Indore, Nagpur, Meerut"
     (c) "Smaller city or town"
     (d) "Village or rural area"
   - Accept tier answers as typed text ("metro", "large city", "small town", "village") or button clicks. Once set, never ask again.
6. When budget and guest count are known, mention the calculated per-head budget (budget ÷ guests) and present candidate plan styles (Food-first, Look-first, Balanced, and DIY-Max if < 1200/head).
7. When all required fields are present and priorities chosen, set isComplete to true.
8. SANITY RULES & KINDNESS:
   - If the user's budget is plainly absurd (under ₹2,000, or under ₹5 per guest, e.g. ₹800 for 100 guests), reply warmly and honestly, like an experienced community elder:
     "₹800 is really not enough to host an event for a group of people, even a very simple one. Could you check the amount? Or tell me whether this is only a small starting amount and there is more coming from donations or families, and I'll help you plan around it." Never lecture, never crash, and do NOT set isComplete to true.
   - If the budget is very tight (₹5,000 to ₹15,000), encourage them with warmth: "This is tight, and it can still work wonderfully if the community pitches in with borrowed gear and potluck contributions!"
   - If a date is in the past or guest count is 0, ask one friendly clarifying question.

Output format: Respond strictly with a JSON object matching this schema:
{
  "message": "Conversational response asking for the next missing detail",
  "profileUpdate": { ...ONLY the fields explicitly extracted from the user's message... },
  "suggestedQuickReplies": ["Option 1", "Option 2"],
  "candidatePlans": [ ...optional candidate styles... ],
  "isComplete": boolean
}`;

    const formattedHistory = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const prompt = `${systemPrompt}\n\nCURRENT PROFILE CONTEXT:\n${JSON.stringify(context, null, 2)}\n\nCHAT HISTORY:\n${formattedHistory}\n\nRespond strictly with JSON:`;

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

    const prompt = `You are Event Co-pilot's Explain Agent. Given the deterministic budget allocation for "${profile.eventName}" in ${profile.location.city || 'India'}, write one concise, trustworthy justification sentence (under 15 words) for each budget category explaining why it is allocated this amount.

PLAN SUMMARY:
- Total: ₹${plan.totalBudget}
- Guests: ${profile.guestCount}
- City / Tier: ${profile.location.city} (${profile.location.tier || 'standard'})
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

  async resolveUnknownCityTier(cityName: string): Promise<'metro' | 'tier2' | 'small_town' | 'village' | 'unknown'> {
    if (!this.hasKey() || !cityName) {
      return 'unknown';
    }

    const prompt = `You are an Indian geographical cost classification agent.
Classify the Indian city/town/location "${cityName}" into EXACTLY one of these four cost tiers:
- "metro": Mega metro or NCR satellite (e.g. Delhi NCR, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata, Pune, Ahmedabad, Ghaziabad, Noida, Gurugram, Faridabad)
- "tier2": Large regional city or state capital (e.g. Jaipur, Lucknow, Indore, Nagpur, Meerut, Chandigarh, Patna, Surat, Bhopal, Kochi, Coimbatore)
- "small_town": Smaller district town or tehsil
- "village": Rural village, gram panchayat, or rural countryside
- "unknown": If completely unrecognized, gibberish, or fictional

Respond strictly with JSON:
{
  "tier": "metro" | "tier2" | "small_town" | "village" | "unknown"
}`;

    try {
      const result = await this.callGeminiWithRetry(prompt);
      if (result && ['metro', 'tier2', 'small_town', 'village'].includes(result.tier)) {
        return result.tier;
      }
      return 'unknown';
    } catch (err) {
      console.warn('Gemini city classification failed:', err);
      return 'unknown';
    }
  }

  private async callGeminiWithRetry(prompt: string): Promise<any> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;

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
          temperature: 0.2
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
