import { describe, it } from 'vitest';
import { allocateBudget } from '../../lib/engine/budget';
import { EventProfile } from '../../lib/types';

describe('Run Scenarios', () => {
  it('outputs the 3 required scenario tables', () => {
    function runScenario(
      name: string,
      city: string,
      tier: 'metro' | 'tier2' | 'small_town' | 'village',
      budget: number,
      guests: number,
      subType: 'festival' | 'cultural_night' | 'neighborhood',
      weeks: number,
      priorities: any = { top2: ['food_prasad', 'stage_sound'], notes: '' }
    ) {
      const profile: EventProfile = {
        id: `scenario-${name.toLowerCase().replace(/\s+/g, '-')}`,
        eventType: 'community',
        eventSubType: subType,
        eventName: name,
        eventDate: '2026-12-15',
        planningStartDate: '2026-11-01',
        totalBudget: { amount: budget, currency: 'INR' },
        guestCount: guests,
        guestMix: { family: 50, elders: 20, kids: 20, colleagues: 5, friends: 5 },
        experienceTier: 'normal',
        priorities,
        location: { city, tier },
        specialRequirements: [],
        profileCompleteness: 100,
        intakeStatus: 'complete',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const plan = allocateBudget(profile);
      console.log(`\n================================================================================`);
      console.log(`### ${name}`);
      console.log(`Location: ${city} (${tier.toUpperCase()}) | Budget: ₹${budget.toLocaleString('en-IN')} | Guests: ${guests} (₹${Math.round(budget/guests)}/head) | Time: ${weeks} weeks`);
      console.log(`Contingency (10%): ₹${plan.contingencyReserve.amount.toLocaleString('en-IN')} | Allocatable: ₹${plan.allocatableBudget.toLocaleString('en-IN')}`);
      console.log(`--------------------------------------------------------------------------------`);
      console.log(`| Category | Allocated (₹) | Share (%) | Floor (₹) | Per Head (₹) | Why / Planning Rationale |`);
      console.log(`| :--- | :--- | :--- | :--- | :--- | :--- |`);
      plan.categories.forEach(cat => {
        console.log(`| ${cat.label} | ₹${cat.allocatedAmount.toLocaleString('en-IN')} | ${cat.allocatedPercentage}% | ₹${cat.floorAmount.toLocaleString('en-IN')} | ${cat.perHeadCost ? '₹' + cat.perHeadCost : 'N/A'} | ${cat.why} |`);
      });
      const sumCats = plan.categories.reduce((acc, c) => acc + c.allocatedAmount, 0);
      console.log(`Total Allocated: ₹${sumCats.toLocaleString('en-IN')} + Contingency: ₹${plan.contingencyReserve.amount.toLocaleString('en-IN')} = ₹${(sumCats + plan.contingencyReserve.amount).toLocaleString('en-IN')}`);
    }

    runScenario('Scenario 1: Bengaluru Metro Festival', 'Bengaluru', 'metro', 400000, 200, 'festival', 6);
    runScenario('Scenario 2: Village / Rural Setting Festival', 'Rampur Village Ground', 'village', 400000, 200, 'festival', 6);
    runScenario('Scenario 3: Small Town Neighborhood Gathering', 'Anand Town Community Center', 'small_town', 150000, 60, 'neighborhood', 3, { top2: ['food_prasad', 'decor'], notes: '' });
  });
});

