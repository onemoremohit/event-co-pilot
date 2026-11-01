import { describe, it, expect } from 'vitest';
import { allocateBudget, verifyPlanInvariants, checkFeasibility } from '../../lib/engine/budget';
import { evaluateInputSanity } from '../../lib/engine/sanity';
import { extractFieldsFromText } from '../../lib/llm/parser';
import { SOURCING_MODE_ORDER } from '../../lib/engine/sourcing';
import { EventProfile, EventSubType, BudgetCategorySlug } from '../../lib/types';
import { LocationTier } from '../../lib/engine/location';

function createProfile(
  budget: any,
  guests: any,
  subType: EventSubType = 'festival',
  tier: LocationTier = 'tier2',
  date = '2026-12-15',
  priorities: BudgetCategorySlug[] = ['food_prasad', 'stage_sound']
): EventProfile {
  return {
    id: 'test-profile',
    eventType: 'community',
    eventSubType: subType,
    eventName: 'Community Celebration',
    eventDate: date,
    planningStartDate: '2026-11-01',
    totalBudget: { amount: budget, currency: 'INR' },
    guestCount: guests,
    guestMix: { family: 50, elders: 20, kids: 20, colleagues: 5, friends: 5 },
    experienceTier: 'normal',
    priorities: { top2: priorities as [BudgetCategorySlug, BudgetCategorySlug], notes: '' },
    location: { city: 'Test City', tier },
    specialRequirements: [],
    profileCompleteness: 100,
    intakeStatus: 'complete',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

describe('Redesigned Budget Engine: Invariant Guarantees & Resilience', () => {
  it('passes invariants across 150 randomized edge-case inputs without throwing', () => {
    const subTypes: EventSubType[] = ['festival', 'cultural_night', 'neighborhood'];
    const tiers: LocationTier[] = ['metro', 'tier2', 'small_town', 'village'];
    const budgets = [
      0, 500, 800, 2000, 5000, 10000, 25000, 45000, 50000, 100000, 500000, 2500000, 10000000,
      -5000, -100000, NaN, undefined, null
    ];
    const guestCounts = [0, -10, 1, 10, 50, 80, 200, 300, 500, 2000, 10000, 25000, NaN, undefined, null];

    let testRuns = 0;

    for (let i = 0; i < 150; i++) {
      const b = budgets[Math.floor(Math.random() * budgets.length)];
      const g = guestCounts[Math.floor(Math.random() * guestCounts.length)];
      const sub = subTypes[Math.floor(Math.random() * subTypes.length)];
      const tier = tiers[Math.floor(Math.random() * tiers.length)];

      const profile = createProfile(b, g, sub, tier);
      const plan = allocateBudget(profile);

      testRuns++;

      // Invariant 1: No category allocation is ever negative
      plan.categories.forEach(cat => {
        expect(cat.allocatedAmount).toBeGreaterThanOrEqual(0);
      });
      expect(plan.contingencyReserve.amount).toBeGreaterThanOrEqual(0);

      // Invariant 2: sum(categories) + contingency === totalBudget exactly
      const sumCats = plan.categories.reduce((acc, c) => acc + c.allocatedAmount, 0);
      expect(sumCats + plan.contingencyReserve.amount).toBe(plan.totalBudget);
      expect(sumCats).toBe(plan.allocatableBudget);

      // Invariant 3: Percentage shares sum to ~100% when budget > 0
      if (plan.allocatableBudget > 0) {
        const sumPct = plan.categories.reduce((acc, c) => acc + c.allocatedPercentage, 0);
        expect(Math.abs(sumPct - 100)).toBeLessThanOrEqual(0.3);
      }

      // Invariant 4: Per guest figures are never negative, NaN, or Infinity
      plan.categories.forEach(cat => {
        if (cat.perHeadCost !== null) {
          expect(cat.perHeadCost).toBeGreaterThanOrEqual(0);
          expect(isNaN(cat.perHeadCost)).toBe(false);
          expect(isFinite(cat.perHeadCost)).toBe(true);
        }
      });

      // Invariant 5: Plan verification function passes
      expect(plan.verification?.isVerified).toBe(true);
    }

    expect(testRuns).toBe(150);
  });

  it('guarantees Monotonicity: increasing budget never degrades any sourcing mode', () => {
    const budgetLadder = [10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000];
    const profileBase = createProfile(10000, 200, 'festival', 'tier2');

    let previousModeIndices: Record<string, number> = {};

    for (const b of budgetLadder) {
      const plan = allocateBudget({
        ...profileBase,
        totalBudget: { amount: b, currency: 'INR' }
      });

      plan.categories.forEach(cat => {
        const mode = cat.sourcingMode || 'community_sourced';
        const currentIdx = SOURCING_MODE_ORDER.indexOf(mode);
        const prevIdx = previousModeIndices[cat.slug] ?? -1;

        // Current mode must be greater than or equal to previous mode
        if (currentIdx < prevIdx) {
          console.log(`MONOTONICITY VIOLATION at budget ${b}: category ${cat.slug} dropped from mode ${prevIdx} to ${currentIdx}`);
        }
        expect(currentIdx).toBeGreaterThanOrEqual(prevIdx);
        previousModeIndices[cat.slug] = currentIdx;
      });
    }
  });
});

describe('The 8 Mandated Evaluation Scenarios', () => {
  // Case 1: INR 800, 100 guests, society cultural night (Absurd input)
  it('Scenario 1: Handles INR 800 for 100 guests with kind human response without crashing', () => {
    const sanity = evaluateInputSanity(800, 100, '2026-12-15', 'cultural_night');
    expect(sanity.isAbsurd).toBe(true);
    expect(sanity.humanMessage).toContain('₹800 is really not enough to host an event for 100 people');
    expect(sanity.humanMessage).toContain('Could you check the amount?');
    expect(sanity.nearestWorkableOption).toBeDefined();

    // The engine itself does not throw and returns a safe ₹0-community plan
    const profile = createProfile(800, 100, 'cultural_night', 'tier2');
    const plan = allocateBudget(profile);
    expect(plan.totalBudget).toBe(800);
    expect(plan.categories.every(c => c.allocatedAmount >= 0)).toBe(true);
  });

  // Case 2: INR 10,000, 80 guests, neighborhood gathering, village
  it('Scenario 2: INR 10,000 for 80 guests in Village produces a clean volunteer-powered plan', () => {
    const profile = createProfile(10000, 80, 'neighborhood', 'village');
    const plan = allocateBudget(profile);

    expect(plan.totalBudget).toBe(10000);
    expect(plan.contingencyReserve.amount).toBe(500); // 5% contingency on tight budget
    expect(plan.allocatableBudget).toBe(9500);

    // Food and venue receive cash while optional items stay community-sourced
    const food = plan.categories.find(c => c.slug === 'food_prasad')!;
    expect(food.allocatedAmount).toBeGreaterThan(0);
    expect(food.sourcingMode).toBe('minimal_paid');

    const photo = plan.categories.find(c => c.slug === 'photography')!;
    expect(photo.allocatedAmount).toBe(0);
    expect(photo.sourcingMode).toBe('community_sourced');
    expect(photo.why).toContain('community volunteers');

    expect(plan.verification?.isVerified).toBe(true);
  });

  // Case 3: INR 45,000, 200 guests, society cultural night, small town, 3 weeks (THE FAILING CASE)
  it('Scenario 3: INR 45,000 for 200 guests in Small Town (FAILED PREVIOUSLY) is strictly positive and verified', () => {
    const profile = createProfile(45000, 200, 'cultural_night', 'small_town', '2026-11-22', ['food_prasad', 'stage_sound']);
    const plan = allocateBudget(profile);

    expect(plan.totalBudget).toBe(45000);
    expect(plan.contingencyReserve.amount).toBe(3150); // 7%
    expect(plan.allocatableBudget).toBe(41850);

    // CRITICAL BUG VERIFICATION: Food & Prasad MUST NOT be negative!
    const food = plan.categories.find(c => c.slug === 'food_prasad')!;
    expect(food.allocatedAmount).toBeGreaterThan(5000); // healthy positive allocation!
    expect(food.allocatedPercentage).toBeGreaterThan(0);

    // Stage & sound (cultural night top priority) is upgraded
    const sound = plan.categories.find(c => c.slug === 'stage_sound')!;
    expect(sound.allocatedAmount).toBeGreaterThan(0);

    // Invariants strictly verified
    plan.categories.forEach(c => {
      expect(c.allocatedAmount).toBeGreaterThanOrEqual(0);
      expect(c.allocatedPercentage).toBeGreaterThanOrEqual(0);
    });

    const sumCats = plan.categories.reduce((acc, c) => acc + c.allocatedAmount, 0);
    expect(sumCats + plan.contingencyReserve.amount).toBe(45000);
    expect(plan.verification?.isVerified).toBe(true);
  });

  // Case 4: INR 50,000, 200 guests, festival, metro
  it('Scenario 4: INR 50,000 for 200 guests in Metro correctly navigates higher metro rates', () => {
    const profile = createProfile(50000, 200, 'festival', 'metro');
    const plan = allocateBudget(profile);

    expect(plan.totalBudget).toBe(50000);
    expect(plan.categories.every(c => c.allocatedAmount >= 0)).toBe(true);
    expect(plan.verification?.isVerified).toBe(true);

    // Check feasibility warning for metro rates
    const check = checkFeasibility(50000, 200, profile, 'metro');
    expect(check.warnings.some(w => w.includes('Metro'))).toBe(true);
  });

  // Case 5: INR 1,00,000, 300 guests, festival, tier-2 city
  it('Scenario 5: INR 1,00,000 for 300 guests in Tier-2 city builds a balanced festival blueprint', () => {
    const profile = createProfile(100000, 300, 'festival', 'tier2');
    const plan = allocateBudget(profile);

    expect(plan.totalBudget).toBe(100000);
    expect(plan.contingencyReserve.amount).toBe(8000); // 8%
    expect(plan.allocatableBudget).toBe(92000);

    const food = plan.categories.find(c => c.slug === 'food_prasad')!;
    expect(food.allocatedAmount).toBeGreaterThan(20000);
    expect(plan.verification?.isVerified).toBe(true);
  });

  // Case 6: INR 5,00,000, 500 guests, festival, Bengaluru
  it('Scenario 6: INR 5,00,000 for 500 guests in Bengaluru delivers standard & enhanced packages', () => {
    const profile = createProfile(500000, 500, 'festival', 'metro');
    const plan = allocateBudget(profile);

    expect(plan.totalBudget).toBe(500000);
    expect(plan.contingencyReserve.amount).toBe(50000); // 10%
    expect(plan.allocatableBudget).toBe(450000);

    const sound = plan.categories.find(c => c.slug === 'stage_sound')!;
    expect(['standard_paid', 'enhanced_paid', 'premium_paid']).toContain(sound.sourcingMode);
    expect(plan.verification?.isVerified).toBe(true);
  });

  // Case 7: INR 25,00,000, 2,000 guests, festival, Mumbai (Large scale)
  it('Scenario 7: INR 25,00,000 for 2,000 guests in Mumbai activates Premium Turnkey production', () => {
    const profile = createProfile(2500000, 2000, 'festival', 'metro');
    const plan = allocateBudget(profile);

    expect(plan.totalBudget).toBe(2500000);
    expect(plan.contingencyReserve.amount).toBe(200000); // capped at 2L

    const food = plan.categories.find(c => c.slug === 'food_prasad')!;
    expect(food.sourcingMode).toBe('premium_paid');

    const sound = plan.categories.find(c => c.slug === 'stage_sound')!;
    expect(['enhanced_paid', 'premium_paid']).toContain(sound.sourcingMode);

    expect(plan.verification?.isVerified).toBe(true);
  });

  // Case 8: Edge cases: 0 guests, negative budget, past date, word numbers
  it('Scenario 8: Edge cases (0 guests, negative budget, past dates, word numbers) handled gracefully', () => {
    // 0 guests
    const sanityZeroGuests = evaluateInputSanity(50000, 0);
    expect(sanityZeroGuests.flags).toContain('zero_or_negative_guests');
    expect(sanityZeroGuests.humanMessage).toContain('at least a small group of attendees');

    // Negative budget
    const sanityNegBudget = evaluateInputSanity(-50000, 100);
    expect(sanityNegBudget.flags).toContain('zero_or_negative_budget');
    expect(sanityNegBudget.humanMessage).toContain('zero or negative');

    // Past date
    const sanityPastDate = evaluateInputSanity(50000, 100, '2020-01-01');
    expect(sanityPastDate.flags).toContain('past_date');
    expect(sanityPastDate.humanMessage).toContain('appears to be in the past');

    // Word number extraction: "forty five thousand"
    const parsedWord = extractFieldsFromText('We have forty five thousand for this celebration');
    expect(parsedWord.budgetAmount).toBe(45000);

    // "45k"
    const parsedK = extractFieldsFromText('our budget is 45k');
    expect(parsedK.budgetAmount).toBe(45000);

    // Negative in parser
    const parsedNeg = extractFieldsFromText('budget is -50000');
    expect(parsedNeg.budgetAmount).toBe(-50000);
  });
});
