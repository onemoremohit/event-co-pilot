import { describe, it, expect } from 'vitest';
import { allocateBudget, checkFeasibility, computeCategoryFloors } from '../../lib/engine/budget';
import { EventProfile } from '../../lib/types';

const mockProfile: EventProfile = {
  id: 'event-1',
  eventType: 'community',
  eventSubType: 'festival',
  eventName: 'Gokuldham Society Diwali Mela',
  eventDate: '2026-12-15',
  planningStartDate: '2026-11-01',
  totalBudget: {
    amount: 400000,
    currency: 'INR'
  },
  guestCount: 200,
  guestMix: {
    family: 50,
    elders: 20,
    kids: 20,
    colleagues: 5,
    friends: 5
  },
  experienceTier: 'normal',
  priorities: {
    top2: ['food_prasad', 'stage_sound'],
    notes: 'Focus on grand community dinner and crystal-clear sound.'
  },
  location: {
    city: 'Bengaluru'
  },
  specialRequirements: [],
  profileCompleteness: 100,
  intakeStatus: 'complete',
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z'
};

describe('BudgetAllocator (Deterministic Math Engine)', () => {
  it('reserves exactly 10% for contingency', () => {
    const plan = allocateBudget(mockProfile);
    expect(plan.contingencyReserve.percentage).toBe(10);
    expect(plan.contingencyReserve.amount).toBe(40000);
    expect(plan.allocatableBudget).toBe(360000);
  });

  it('guarantees that sum of all categories plus contingency equals total budget exactly', () => {
    const plan = allocateBudget(mockProfile);
    const sumCategories = plan.categories.reduce((acc, cat) => acc + cat.allocatedAmount, 0);
    expect(sumCategories).toBe(plan.allocatableBudget);
    expect(sumCategories + plan.contingencyReserve.amount).toBe(mockProfile.totalBudget.amount);
    expect(plan.remainingBuffer).toBe(0);
  });

  it('ensures no category falls below its minimum viable floor cost', () => {
    const plan = allocateBudget(mockProfile);
    const floors = computeCategoryFloors(mockProfile);

    plan.categories.forEach(cat => {
      expect(cat.allocatedAmount).toBeGreaterThanOrEqual(cat.floorAmount);
      expect(cat.floorAmount).toBe(floors[cat.slug]);
    });
  });

  it('boosts top priority categories above baseline', () => {
    const plan = allocateBudget(mockProfile);
    const foodCat = plan.categories.find(c => c.slug === 'food_prasad')!;
    const decorCat = plan.categories.find(c => c.slug === 'decor')!;

    // Food is a top priority boosted by 1.5x
    expect(foodCat.allocatedAmount).toBeGreaterThan(decorCat.allocatedAmount);
    expect(foodCat.why).toContain('Top priority selection');
  });

  it('preserves user locked categories exactly and redistributes remaining funds', () => {
    const lockedAmount = 120000;
    const planWithLock = allocateBudget(mockProfile, {
      locks: {
        food_prasad: lockedAmount
      }
    });

    const foodCat = planWithLock.categories.find(c => c.slug === 'food_prasad')!;
    expect(foodCat.isLocked).toBe(true);
    expect(foodCat.allocatedAmount).toBe(lockedAmount);
    expect(foodCat.lockedAmount).toBe(lockedAmount);

    // Sum invariant still strictly holds
    const totalAlloc = planWithLock.categories.reduce((acc, c) => acc + c.allocatedAmount, 0);
    expect(totalAlloc).toBe(planWithLock.allocatableBudget);
  });

  it('flags unviable budgets accurately in feasibility check', () => {
    // 200 guests with only ₹20,000 is clearly below minimum floors
    const result = checkFeasibility(20000, 200, mockProfile);
    expect(result.isViable).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
