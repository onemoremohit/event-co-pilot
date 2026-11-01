import { describe, it, expect } from 'vitest';
import { resolveLocationTier, detectLocationTierFromText, LOCATION_TIERS } from '@/lib/engine/location';
import { extractFieldsFromText } from '@/lib/llm/parser';
import { MockLLMProvider } from '@/lib/llm/mock';
import { IntakeContext } from '@/lib/llm/provider';

describe('Location Resolution & Clarification Flow', () => {
  it('resolves Meerut directly to tier2 (1.0x baseline)', () => {
    const res = resolveLocationTier('Meerut');
    expect(res.tier).toBe('tier2');
    expect(res.baseMultiplier).toBe(1.0);
    expect(res.isUnknown).toBe(false);

    // From user message extraction
    const extracted = extractFieldsFromText('We are celebrating in Meerut');
    expect(extracted.city?.toLowerCase()).toContain('meerut');
    expect(extracted.locationTier).toBe('tier2');
    expect(extracted.isLocationUnknown).toBe(false);
  });

  it('resolves NCR satellite cities (Ghaziabad, Noida, Gurugram, Faridabad) directly to metro (1.35x rate)', () => {
    const ghaziabadRes = resolveLocationTier('Ghaziabad');
    expect(ghaziabadRes.tier).toBe('metro');
    expect(ghaziabadRes.baseMultiplier).toBe(1.35);
    expect(ghaziabadRes.isUnknown).toBe(false);

    const noidaRes = resolveLocationTier('Noida');
    expect(noidaRes.tier).toBe('metro');
    expect(noidaRes.baseMultiplier).toBe(1.35);
    expect(noidaRes.isUnknown).toBe(false);

    const gurgaonRes = resolveLocationTier('Gurgaon');
    expect(gurgaonRes.tier).toBe('metro');

    const faridabadRes = resolveLocationTier('Faridabad');
    expect(faridabadRes.tier).toBe('metro');

    // Standalone short-city messages
    const extGhaziabad = extractFieldsFromText('Ghaziabad');
    expect(extGhaziabad.city).toBe('Ghaziabad');
    expect(extGhaziabad.locationTier).toBe('metro');

    const extNoida = extractFieldsFromText('in Noida');
    expect(extNoida.city).toBe('Noida');
    expect(extNoida.locationTier).toBe('metro');
  });

  it('triggers the ONE-TIME fallback question for misspelled or unrecognized cities', async () => {
    const provider = new MockLLMProvider();

    // Context with type, budget, guests, date filled in
    const context: IntakeContext = {
      currentProfile: {
        eventType: 'community',
        eventSubType: 'festival',
        eventName: 'Society Diwali Celebration',
        totalBudget: { amount: 150000, currency: 'INR' },
        guestCount: 200,
        eventDate: '2026-12-15'
      },
      completeness: 80
    };

    // User types misspelled city "Meeeruttt"
    const response = await provider.chat(
      [{ id: '1', eventId: 'test', role: 'user', content: 'Meeeruttt', timestamp: '' }],
      context
    );

    expect(response.message).toContain('How would you describe your location?');
    expect(response.suggestedQuickReplies).toBeDefined();
    expect(response.suggestedQuickReplies?.length).toBe(4);
    expect(response.suggestedQuickReplies![0]).toContain('Big metro');
    expect(response.suggestedQuickReplies![1]).toContain('Large city');
    expect(response.suggestedQuickReplies![2]).toContain('Smaller city or town');
    expect(response.suggestedQuickReplies![3]).toContain('Village or rural area');
  });

  it('never asks for the city or location tier twice', async () => {
    const provider = new MockLLMProvider();

    // Context after the fallback question was already asked (clarificationAsked is true)
    const contextAfterClarification: IntakeContext = {
      currentProfile: {
        eventType: 'community',
        eventSubType: 'festival',
        eventName: 'Society Diwali Celebration',
        totalBudget: { amount: 150000, currency: 'INR' },
        guestCount: 200,
        eventDate: '2026-12-15',
        location: {
          city: 'Meeeruttt',
          tier: 'tier2',
          clarificationAsked: true,
          isUnknown: true
        }
      },
      completeness: 80
    };

    // User responds with anything (e.g. "We want good food" or non-tier chat)
    const response = await provider.chat(
      [{ id: '2', eventId: 'test', role: 'user', content: 'Food and sound are our priorities', timestamp: '' }],
      contextAfterClarification
    );

    // Must NOT ask for location or describe location again!
    expect(response.message).not.toContain('How would you describe your location?');
    expect(response.message).not.toContain('Which city, town, or village');
    // Proceeds to priority selection or plan generation
    expect(response.suggestedQuickReplies).not.toContain('Big metro');
  });

  it('accepts clicked quick-reply options and sets appropriate tier', () => {
    const metroChoice = 'Big metro, for example Delhi NCR, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata, Pune';
    expect(detectLocationTierFromText(metroChoice)).toBe('metro');

    const largeCityChoice = 'Large city, for example Jaipur, Lucknow, Indore, Nagpur, Meerut';
    expect(detectLocationTierFromText(largeCityChoice)).toBe('tier2');

    const smallTownChoice = 'Smaller city or town';
    expect(detectLocationTierFromText(smallTownChoice)).toBe('small_town');

    const villageChoice = 'Village or rural area';
    expect(detectLocationTierFromText(villageChoice)).toBe('village');
  });

  it('accepts typed text answers ("small town", "village", "metro", "large city")', () => {
    expect(detectLocationTierFromText('metro')).toBe('metro');
    expect(detectLocationTierFromText('big metro')).toBe('metro');
    expect(detectLocationTierFromText('large city')).toBe('tier2');
    expect(detectLocationTierFromText('small town')).toBe('small_town');
    expect(detectLocationTierFromText('smaller city')).toBe('small_town');
    expect(detectLocationTierFromText('village')).toBe('village');
    expect(detectLocationTierFromText('rural area')).toBe('village');
    expect(detectLocationTierFromText('gaon')).toBe('village');
  });

  it('correctly handles full multi-turn conversational location clarification', async () => {
    const provider = new MockLLMProvider();

    // Turn 1: Bot asks for city
    const contextTurn1: IntakeContext = {
      currentProfile: {
        eventType: 'community',
        eventSubType: 'cultural_night',
        eventName: 'Annual Cultural Night',
        totalBudget: { amount: 200000, currency: 'INR' },
        guestCount: 150,
        eventDate: '2026-11-20'
      },
      completeness: 80
    };

    // User enters a misspelled city "Xyzpur"
    const reply1 = await provider.chat(
      [{ id: '1', eventId: 'test', role: 'user', content: 'In Xyzpur', timestamp: '' }],
      contextTurn1
    );

    // Bot asks fallback question
    expect(reply1.message).toContain('How would you describe your location?');

    // Turn 2: User clicks or types "Smaller city or town"
    const contextTurn2: IntakeContext = {
      currentProfile: {
        ...contextTurn1.currentProfile,
        location: {
          city: 'Xyzpur',
          tier: 'tier2',
          clarificationAsked: true,
          isUnknown: true
        }
      },
      completeness: 80
    };

    const reply2 = await provider.chat(
      [{ id: '2', eventId: 'test', role: 'user', content: 'Smaller city or town', timestamp: '' }],
      contextTurn2
    );

    // Bot accepts it, does NOT ask again, and moves to priorities
    expect(reply2.message).not.toContain('How would you describe your location?');
    expect(reply2.profileUpdate?.locationTier).toBe('small_town');
    expect(reply2.candidatePlans).toBeDefined();
  });
});
