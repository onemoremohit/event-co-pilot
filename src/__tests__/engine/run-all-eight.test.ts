import { describe, it } from 'vitest';
import { allocateBudget } from '../../lib/engine/budget';
import { evaluateInputSanity } from '../../lib/engine/sanity';
import { extractFieldsFromText } from '../../lib/llm/parser';
import { EventProfile, EventSubType, BudgetCategorySlug } from '../../lib/types';
import { LocationTier } from '../../lib/engine/location';

function printScenario(
  title: string,
  budget: number,
  guests: number,
  subType: EventSubType,
  city: string,
  tier: LocationTier,
  priorities: BudgetCategorySlug[] = ['food_prasad', 'stage_sound'],
  date = '2026-12-15'
) {
  const sanity = evaluateInputSanity(budget, guests, date, subType);
  console.log(`\n================================================================================`);
  console.log(`### ${title}`);
  console.log(`Input: Budget ₹${budget.toLocaleString('en-IN')}, ${guests} Guests, ${city} (${tier.toUpperCase()})`);
  console.log(`Assistant Reply: "${sanity.humanMessage}"`);

  if (sanity.isAbsurd) {
    console.log(`Status: ABSURD INPUT (Handled with kindness, no broken plan generated)`);
    if (sanity.nearestWorkableOption) {
      console.log(`Suggested Nearest Option: ${sanity.nearestWorkableOption.suggestedPlan}`);
    }
    return;
  }

  const profile: EventProfile = {
    id: `eval-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    eventType: 'community',
    eventSubType: subType,
    eventName: title,
    eventDate: date,
    planningStartDate: '2026-11-01',
    totalBudget: { amount: budget, currency: 'INR' },
    guestCount: guests,
    guestMix: { family: 50, elders: 20, kids: 20, colleagues: 5, friends: 5 },
    experienceTier: 'normal',
    priorities: { top2: priorities as [BudgetCategorySlug, BudgetCategorySlug], notes: '' },
    location: { city, tier },
    specialRequirements: [],
    profileCompleteness: 100,
    intakeStatus: 'complete',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const plan = allocateBudget(profile);

  console.log(`Contingency (${plan.contingencyReserve.percentage}%): ₹${plan.contingencyReserve.amount.toLocaleString('en-IN')} | Allocatable: ₹${plan.allocatableBudget.toLocaleString('en-IN')}`);
  console.log(`Verification: ${plan.verification?.badgeText} (${plan.verification?.details})`);
  console.log(`--------------------------------------------------------------------------------`);
  console.log(`| Category | Sourcing Mode | Cash (₹) | Share (%) | What the Organizer Actually Gets | Community / Volunteer Tasks |`);
  console.log(`| :--- | :--- | :--- | :--- | :--- | :--- |`);
  plan.categories.forEach(c => {
    const cashStr = c.allocatedAmount === 0 ? '₹0 (Community)' : `₹${c.allocatedAmount.toLocaleString('en-IN')}`;
    const taskSummary = c.communityTasks && c.communityTasks.length > 0 ? c.communityTasks[0] : 'Standard vendor contract';
    console.log(`| ${c.label} | ${c.sourcingModeLabel} | ${cashStr} | ${c.allocatedPercentage}% | ${c.deliverablesDescription} | ${taskSummary} |`);
  });

  if (plan.resourcefulnessToolkit) {
    console.log(`\nResourcefulness: ${plan.resourcefulnessToolkit.perHouseholdContribution.note}`);
    console.log(`What Next ₹10,000 Unlocks: ${plan.resourcefulnessToolkit.nextTierUnlock.unlockDescription}`);
  }
}

describe('Mandated 8 Evaluation Scenarios Runner', () => {
  it('runs all 8 scenarios cleanly', () => {
    // 1. INR 800, 100 guests, society cultural night
    printScenario('Scenario 1: Plainly Absurd Input', 800, 100, 'cultural_night', 'Town Hall', 'tier2');

    // 2. INR 10,000, 80 guests, neighborhood gathering, village
    printScenario('Scenario 2: Village Volunteer Gathering', 10000, 80, 'neighborhood', 'Rampur Village Ground', 'village', ['food_prasad', 'venue_permissions']);

    // 3. INR 45,00, 200 guests, society cultural night, small town, 3 weeks
    printScenario('Scenario 3: Small Town Cultural Night (Previously Failed Case)', 45000, 200, 'cultural_night', 'Anand Town Community Center', 'small_town', ['food_prasad', 'stage_sound'], '2026-11-22');

    // 4. INR 50,000, 200 guests, festival, metro
    printScenario('Scenario 4: Metro Budget Festival', 50000, 200, 'festival', 'Bengaluru Central Lawn', 'metro');

    // 5. INR 1,00,000, 300 guests, festival, tier-2 city
    printScenario('Scenario 5: Tier-2 Society Festival', 100000, 300, 'festival', 'Jaipur Society Grounds', 'tier2');

    // 6. INR 5,00,000, 500 guests, festival, Bengaluru
    printScenario('Scenario 6: Grand Bengaluru Festival', 500000, 500, 'festival', 'Bengaluru', 'metro');

    // 7. INR 25,00,000, 2,000 guests, festival, Mumbai
    printScenario('Scenario 7: Mega Cultural Festival Mumbai', 2500000, 2000, 'festival', 'Mumbai Festival Grounds', 'metro');

    // 8. Edge cases
    console.log(`\n================================================================================`);
    console.log(`### Scenario 8: Edge Cases & Illogical Inputs`);
    console.log(`- 0 Guests Sanity: "${evaluateInputSanity(50000, 0).humanMessage}"`);
    console.log(`- Negative Budget (-₹50,000) Sanity: "${evaluateInputSanity(-50000, 100).humanMessage}"`);
    console.log(`- Past Date (2020-01-01) Sanity: "${evaluateInputSanity(50000, 100, '2020-01-01').humanMessage}"`);
    console.log(`- "forty five thousand" Parser: ₹${extractFieldsFromText('we have forty five thousand').budgetAmount?.toLocaleString('en-IN')}`);
    console.log(`- "45k" Parser: ₹${extractFieldsFromText('budget is 45k').budgetAmount?.toLocaleString('en-IN')}`);
  });
});
