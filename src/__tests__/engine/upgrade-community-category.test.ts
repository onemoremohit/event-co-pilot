import { describe, it, expect } from 'vitest';
import { EventProfile, BudgetPlan, BudgetCategorySlug } from '../../lib/types';
import { allocateBudget } from '../../lib/engine/budget';
import { recomputeScenario } from '../../lib/engine/scenario';
import { scheduleBackward } from '../../lib/engine/timeline';

function createTightBudgetProfile(): EventProfile {
  return {
    id: 'tight-budget-event',
    eventType: 'community',
    eventSubType: 'festival',
    eventName: 'Small Society Gathering',
    eventDate: '2026-11-20',
    planningStartDate: '2026-11-01',
    totalBudget: { amount: 45000, currency: 'INR' },
    guestCount: 200,
    guestMix: { family: 60, elders: 20, kids: 20, colleagues: 0, friends: 0 },
    experienceTier: 'normal',
    priorities: { top2: ['food_prasad', 'stage_sound'], notes: '' },
    location: { city: 'Ghaziabad', tier: 'metro' },
    specialRequirements: [],
    profileCompleteness: 100,
    intakeStatus: 'complete',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

describe('Upgrade Community Sourced (₹0) Categories & Replan', () => {
  it('correctly identifies community sourced ₹0 categories in tight budget baseline', () => {
    const profile = createTightBudgetProfile();
    const plan = allocateBudget(profile);

    // In a ₹45k budget for 200 guests, multiple optional/heavy categories are ₹0 community sourced
    const zeroCategories = plan.categories.filter(c => c.allocatedAmount === 0);
    expect(zeroCategories.length).toBeGreaterThan(0);

    const decor = plan.categories.find(c => c.slug === 'decor');
    expect(decor).toBeDefined();
    expect(decor?.allocatedAmount).toBe(0);
    expect(decor?.sourcingMode).toBe('community_sourced');

    // Invariants must hold
    expect(plan.verification?.isVerified).toBe(true);
    expect(plan.totalAllocated + plan.contingencyReserve.amount).toBe(45000);
  });

  it('upgrades a ₹0 category to a paid cash expense and rebalances within existing budget', () => {
    const profile = createTightBudgetProfile();
    const baselinePlan = allocateBudget(profile);
    const tasks = scheduleBackward(profile);

    // User chooses to fund Decor with ₹5,000 within the existing ₹45k budget
    const scenario = recomputeScenario(baselinePlan, tasks, profile, {
      budget: 45000,
      lockedCategories: ['decor'],
      categoryOverrides: { decor: 5000 }
    });

    const upgradedDecor = scenario.newPlan.categories.find(c => c.slug === 'decor');
    expect(upgradedDecor).toBeDefined();
    expect(upgradedDecor?.allocatedAmount).toBe(5000);
    expect(upgradedDecor?.isLocked).toBe(true);
    expect(upgradedDecor?.sourcingMode).not.toBe('community_sourced');

    // Mathematical invariants check
    const totalAllocated = scenario.newPlan.categories.reduce((acc, c) => acc + c.allocatedAmount, 0);
    expect(totalAllocated + scenario.newPlan.contingencyReserve.amount).toBe(45000);
    scenario.newPlan.categories.forEach(c => {
      expect(c.allocatedAmount).toBeGreaterThanOrEqual(0);
    });

    // Diff check
    const decorDiff = scenario.diffs.find(d => d.category === 'decor');
    expect(decorDiff).toBeDefined();
    expect(decorDiff?.oldValue).toBe(0);
    expect(decorDiff?.newValue).toBe(5000);
    expect(decorDiff?.reason).toContain('Upgraded from Community Sourced (₹0) to paid expense');
  });

  it('upgrades a ₹0 category with expanded total budget so other categories are preserved', () => {
    const profile = createTightBudgetProfile();
    const baselinePlan = allocateBudget(profile);
    const tasks = scheduleBackward(profile);

    // User adds ₹8,000 for Decor by expanding overall budget to ₹53,000
    const scenario = recomputeScenario(baselinePlan, tasks, profile, {
      budget: 53000,
      lockedCategories: ['decor'],
      categoryOverrides: { decor: 8000 }
    });

    const upgradedDecor = scenario.newPlan.categories.find(c => c.slug === 'decor');
    expect(upgradedDecor).toBeDefined();
    expect(upgradedDecor?.allocatedAmount).toBe(8000);
    expect(scenario.newPlan.totalBudget).toBe(53000);

    // Check rupee conservation
    const sum = scenario.newPlan.categories.reduce((acc, c) => acc + c.allocatedAmount, 0);
    expect(sum + scenario.newPlan.contingencyReserve.amount).toBe(53000);
  });

  it('reverts a paid category back to ₹0 community sourcing and redistributes cash to other categories', () => {
    const profile = createTightBudgetProfile();
    const baselinePlan = allocateBudget(profile, { locks: { decor: 6000 } });
    const tasks = scheduleBackward(profile);

    expect(baselinePlan.categories.find(c => c.slug === 'decor')?.allocatedAmount).toBe(6000);

    // Revert decor to 0
    const scenario = recomputeScenario(baselinePlan, tasks, profile, {
      budget: 45000,
      lockedCategories: [],
      categoryOverrides: { decor: 0 }
    });

    const revertedDecor = scenario.newPlan.categories.find(c => c.slug === 'decor');
    expect(revertedDecor?.allocatedAmount).toBe(0);
    expect(revertedDecor?.sourcingMode).toBe('community_sourced');

    // Rupee sum strictly holds
    const sum = scenario.newPlan.categories.reduce((acc, c) => acc + c.allocatedAmount, 0);
    expect(sum + scenario.newPlan.contingencyReserve.amount).toBe(45000);

    const decorDiff = scenario.diffs.find(d => d.category === 'decor');
    expect(decorDiff?.reason).toContain('Reverted from paid allocation');
  });

  it('gracefully handles excessive lock amounts without negative allocations or throws', () => {
    const profile = createTightBudgetProfile();
    // Allocatable budget on ₹45k is ₹40,500. Attempt to lock ₹50,000 in decor!
    const plan = allocateBudget(profile, { locks: { decor: 50000 } });

    expect(plan.verification?.isVerified).toBe(true);
    plan.categories.forEach(c => {
      expect(c.allocatedAmount).toBeGreaterThanOrEqual(0);
    });
    const sum = plan.categories.reduce((acc, c) => acc + c.allocatedAmount, 0);
    expect(sum + plan.contingencyReserve.amount).toBe(45000);
  });
});
