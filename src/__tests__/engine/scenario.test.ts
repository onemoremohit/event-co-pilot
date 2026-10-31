import { describe, it, expect } from 'vitest';
import { allocateBudget } from '../../lib/engine/budget';
import { scheduleBackward } from '../../lib/engine/timeline';
import { recomputeScenario } from '../../lib/engine/scenario';
import { EventProfile } from '../../lib/types';

const priyaProfile: EventProfile = {
  id: 'priya-diwali-2026',
  eventType: 'community',
  eventSubType: 'festival',
  eventName: 'Gokuldham Society Diwali Celebration 2026',
  eventDate: '2026-12-15',
  planningStartDate: '2026-11-01',
  totalBudget: { amount: 400000, currency: 'INR' },
  guestCount: 200,
  guestMix: { family: 50, elders: 20, kids: 20, colleagues: 5, friends: 5 },
  experienceTier: 'normal',
  priorities: { top2: ['food_prasad', 'stage_sound'], notes: '' },
  location: { city: 'Bengaluru' },
  specialRequirements: [],
  profileCompleteness: 100,
  intakeStatus: 'complete',
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z'
};

describe('ScenarioEngine (Priya Demo Story & Rebalancing)', () => {
  it('rebalances smoothly when +50 guests are added and scales Food & Prasad', () => {
    const initialPlan = allocateBudget(priyaProfile);
    const initialTasks = scheduleBackward(priyaProfile);

    const oldFood = initialPlan.categories.find(c => c.slug === 'food_prasad')!;

    // Scenario: Priya adds 50 more guests (200 -> 250)
    const result = recomputeScenario(initialPlan, initialTasks, priyaProfile, {
      guestCount: 250,
      lockedCategories: []
    });

    const newFood = result.newPlan.categories.find(c => c.slug === 'food_prasad')!;

    // Food & Prasad should increase to accommodate 50 more guests
    expect(newFood.allocatedAmount).toBeGreaterThan(oldFood.allocatedAmount);

    // Sum of budget still strictly equals 4,00,000
    const totalAllocated = result.newPlan.categories.reduce((sum, c) => sum + c.allocatedAmount, 0);
    expect(totalAllocated + result.newPlan.contingencyReserve.amount).toBe(400000);

    // Diffs must contain food_prasad with reason mentioning attendees
    const foodDiff = result.diffs.find(d => d.category === 'food_prasad');
    expect(foodDiff).toBeDefined();
    expect(foodDiff?.direction).toBe('increase');
    expect(foodDiff?.reason).toContain('+50 attendees');
  });

  it('strictly respects category locks while rebalancing unlocked categories', () => {
    const initialPlan = allocateBudget(priyaProfile);
    const initialTasks = scheduleBackward(priyaProfile);

    const oldSound = initialPlan.categories.find(c => c.slug === 'stage_sound')!;

    // User locks stage_sound, then adds 50 guests
    const result = recomputeScenario(initialPlan, initialTasks, priyaProfile, {
      guestCount: 250,
      lockedCategories: ['stage_sound']
    });

    const newSound = result.newPlan.categories.find(c => c.slug === 'stage_sound')!;

    // Locked category must remain identical to the single rupee
    expect(newSound.allocatedAmount).toBe(oldSound.allocatedAmount);
    expect(newSound.isLocked).toBe(true);

    // Budget invariant still holds
    const totalAllocated = result.newPlan.categories.reduce((sum, c) => sum + c.allocatedAmount, 0);
    expect(totalAllocated + result.newPlan.contingencyReserve.amount).toBe(400000);
  });

  it('detects rush mode transition if event date is compressed', () => {
    const initialPlan = allocateBudget(priyaProfile);
    const initialTasks = scheduleBackward(priyaProfile);

    // Date moved from Dec 15 to Nov 10 (only 9 days away from planning start)
    const result = recomputeScenario(initialPlan, initialTasks, priyaProfile, {
      eventDate: '2026-11-10',
      lockedCategories: []
    });

    expect(result.newTasks.rushMode).toBe(true);
    const timelineDiff = result.diffs.find(d => d.category === 'timeline');
    expect(timelineDiff).toBeDefined();
    expect(timelineDiff?.reason).toContain('Rush Mode');
  });
});
