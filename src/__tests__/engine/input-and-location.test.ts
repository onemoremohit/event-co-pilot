import { describe, it, expect } from 'vitest';
import { extractFieldsFromText } from '../../lib/llm/parser';
import { allocateBudget, checkFeasibility, computeCategoryFloors } from '../../lib/engine/budget';
import { resolveLocationTier, getCategoryLocationMultiplier, LOCATION_TIERS } from '../../lib/engine/location';
import { EventProfile } from '../../lib/types';

describe('Input Parser & Honest Extraction (Fix 1 & Fix 2)', () => {
  it('parses various Indian budget formats accurately to exact integer rupees', () => {
    expect(extractFieldsFromText('Our budget is 4 lakh')?.budgetAmount).toBe(400000);
    expect(extractFieldsFromText('We have 4.5 lakhs for this festival')?.budgetAmount).toBe(450000);
    expect(extractFieldsFromText('budget is ₹4,00,000')?.budgetAmount).toBe(400000);
    expect(extractFieldsFromText('we have 1.5L')?.budgetAmount).toBe(150000);
    expect(extractFieldsFromText('around 50k')?.budgetAmount).toBe(50000);
    expect(extractFieldsFromText('INR 75,000')?.budgetAmount).toBe(75000);
  });

  it('parses guest counts from diverse natural language expressions', () => {
    expect(extractFieldsFromText('expecting 200 guests')?.guestCount).toBe(200);
    expect(extractFieldsFromText('around 150 people will attend')?.guestCount).toBe(150);
    expect(extractFieldsFromText('60 attendees')?.guestCount).toBe(60);
    expect(extractFieldsFromText('500 members in our society')?.guestCount).toBe(500);
  });

  it('parses dates and relative timeframes', () => {
    const inSixWeeks = extractFieldsFromText('event is in 6 weeks');
    expect(inSixWeeks?.eventDate).toBeDefined();

    const inThreeWeeks = extractFieldsFromText('planned in 3 weeks');
    expect(inThreeWeeks?.eventDate).toBeDefined();

    const decDate = extractFieldsFromText('scheduled on 15 December');
    expect(decDate?.eventDate).toContain('-12-15');

    const dandiyaNov = extractFieldsFromText('dandiya night on 11th of nov');
    expect(dandiyaNov?.eventSubType).toBe('festival');
    expect(dandiyaNov?.eventDate).toContain('-11-11');

    const novEleventh = extractFieldsFromText('11th of november');
    expect(novEleventh?.eventDate).toContain('-11-11');

    const monthFirst = extractFieldsFromText('nov 11th');
    expect(monthFirst?.eventDate).toContain('-11-11');

    const nextWeekend = extractFieldsFromText('next weekend');
    expect(nextWeekend?.eventDate).toBeDefined();

    const thisWeekend = extractFieldsFromText('this weekend');
    expect(thisWeekend?.eventDate).toBeDefined();

    const inTwoWeeks = extractFieldsFromText('In 2 weeks');
    expect(inTwoWeeks?.eventDate).toBeDefined();

    const inFourWeeks = extractFieldsFromText('In 4 weeks');
    expect(inFourWeeks?.eventDate).toBeDefined();
  });

  it('extracts event sub-types and priorities accurately', () => {
    const festival = extractFieldsFromText('We want a grand Diwali festival celebration');
    expect(festival?.eventSubType).toBe('festival');

    const perf = extractFieldsFromText('Society cultural night and dance performance');
    expect(perf?.eventSubType).toBe('cultural_night');

    const gathering = extractFieldsFromText('Simple neighborhood community gathering');
    expect(gathering?.eventSubType).toBe('neighborhood');

    const priorities = extractFieldsFromText('We want to splurge on food and stage sound');
    expect(priorities?.priorities).toContain('food_prasad');
    expect(priorities?.priorities).toContain('stage_sound');
  });

  it('resolves location strings to correct cost tiers', () => {
    expect(resolveLocationTier('Bengaluru').tier).toBe('metro');
    expect(resolveLocationTier('Mumbai').tier).toBe('metro');
    expect(resolveLocationTier('Delhi NCR').tier).toBe('metro');
    expect(resolveLocationTier('Jaipur').tier).toBe('tier2');
    expect(resolveLocationTier('Lucknow').tier).toBe('tier2');
    expect(resolveLocationTier('Our ancestral village in Bihar').tier).toBe('village');
    expect(resolveLocationTier('small town in Kerala').tier).toBe('small_town');
  });

  it('updates only the targeted field without corrupting existing values', () => {
    const update = extractFieldsFromText('make it 150 guests');
    expect(update?.guestCount).toBe(150);
    // Should NOT inject any budget or date or preset guesses
    expect(update?.budgetAmount).toBeUndefined();
    expect(update?.eventDate).toBeUndefined();
    expect(update?.eventName).toBeUndefined();
  });
});

describe('Location-Aware Cost Engine (Fix 3)', () => {
  const baseProfile: EventProfile = {
    id: 'test-loc-1',
    eventType: 'community',
    eventSubType: 'festival',
    eventName: 'Cultural Fest',
    eventDate: '2026-12-15',
    planningStartDate: '2026-11-01',
    totalBudget: { amount: 400000, currency: 'INR' },
    guestCount: 200,
    guestMix: { family: 50, elders: 20, kids: 20, colleagues: 5, friends: 5 },
    experienceTier: 'normal',
    priorities: { top2: ['food_prasad', 'stage_sound'], notes: 'Standard priorities' },
    location: { city: 'Bengaluru', tier: 'metro' },
    specialRequirements: [],
    profileCompleteness: 100,
    intakeStatus: 'complete',
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  };

  it('scales category minimum floor costs significantly between Metro (1.35x) and Village (0.6x)', () => {
    const metroFloors = computeCategoryFloors({
      ...baseProfile,
      location: { city: 'Bengaluru', tier: 'metro' },
    });

    const villageFloors = computeCategoryFloors({
      ...baseProfile,
      location: { city: 'Rampur', tier: 'village' },
    });

    // Metro stage & sound floor (high sensitivity) must be much higher than village
    expect(metroFloors['stage_sound']).toBeGreaterThan(villageFloors['stage_sound']);
    expect(metroFloors['decor']).toBeGreaterThan(villageFloors['decor']);
    expect(metroFloors['photography']).toBeGreaterThan(villageFloors['photography']);

    // Check exact sensitivity formula:
    // Stage & sound sensitivity = 1.0 -> Metro = 1.35x base, Village = 0.6x base
    expect(metroFloors['stage_sound'] / villageFloors['stage_sound']).toBeCloseTo(1.35 / 0.6, 1);
  });

  it('preserves exact 10% contingency and 100% budget sum invariant regardless of location tier', () => {
    const tiers = ['metro', 'tier2', 'small_town', 'village'] as const;

    for (const tier of tiers) {
      const plan = allocateBudget({
        ...baseProfile,
        location: { city: 'Test City', tier },
      });

      const catSum = plan.categories.reduce((acc, c) => acc + c.allocatedAmount, 0);
      expect(plan.contingencyReserve.amount).toBe(40000);
      expect(catSum).toBe(360000);
      expect(catSum + plan.contingencyReserve.amount).toBe(400000);

      // Verify every category satisfies its tier-adjusted floor
      const floors = computeCategoryFloors({
        ...baseProfile,
        location: { city: 'Test City', tier },
      });
      plan.categories.forEach(c => {
        expect(c.allocatedAmount).toBeGreaterThanOrEqual(c.floorAmount);
        expect(c.allocatedAmount).toBeGreaterThanOrEqual(0);
      });
    }
  });

  it('adjusts feasibility recommendations according to location tier', () => {
    const metroCheck = checkFeasibility(400000, 200, { eventSubType: 'festival' }, 'metro');
    const villageCheck = checkFeasibility(400000, 200, { eventSubType: 'festival' }, 'village');

    // Both are viable at ₹2000 per head
    expect(metroCheck.isViable).toBe(true);
    expect(villageCheck.isViable).toBe(true);

    // Village should offer generous/comfortable advice due to low overhead
    const villageSuggestions = villageCheck.suggestions.join(' ');
    expect(villageSuggestions).toContain('Village/Rural setting');

    // In a metro with a tight budget (₹1.5L for 200 guests = ₹750/head), metro check flags tight/warning
    const tightMetro = checkFeasibility(150000, 200, { eventSubType: 'festival' }, 'metro');
    expect(tightMetro.warnings.length).toBeGreaterThan(0);
    expect(tightMetro.warnings.some(w => w.includes('Metro'))).toBe(true);
  });
});
