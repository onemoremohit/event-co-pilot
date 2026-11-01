import {
  BudgetPlan,
  TaskGraph,
  EventProfile,
  Diff,
  ScenarioInput,
  BudgetCategorySlug,
  VendorChecklistItem
} from '../types';
import { allocateBudget, CategoryLockMap } from './budget';
import { scheduleBackward } from './timeline';
import { generateVendorChecklist } from './vendor';
import { resolveLocationTier, LOCATION_TIERS, LocationTier } from './location';

export interface ScenarioResult {
  newPlan: BudgetPlan;
  newTasks: TaskGraph;
  newVendors: VendorChecklistItem[];
  diffs: Diff[];
}

/**
 * Deterministic reason generator for a category diff
 */
function generateDiffReason(
  slug: string,
  delta: number,
  inputChanges: ScenarioInput,
  oldProfile: EventProfile,
  isLocked: boolean,
  oldMode?: string,
  newMode?: string,
  oldAmount?: number,
  newAmount?: number
): string {
  if (oldAmount === 0 && (newAmount ?? 0) > 0) {
    return `Upgraded from Community Sourced (₹0) to paid expense (₹${(newAmount ?? 0).toLocaleString('en-IN')}); other categories rebalanced.`;
  }

  if ((oldAmount ?? 0) > 0 && newAmount === 0) {
    return `Reverted from paid allocation (₹${(oldAmount ?? 0).toLocaleString('en-IN')}) back to Community Sourced (₹0 cash spend); cash redistributed.`;
  }

  if (isLocked) {
    return delta !== 0
      ? `Category locked at ₹${(newAmount ?? 0).toLocaleString('en-IN')} by organizer; cash amount preserved across rebalancing.`
      : 'Category is locked by organizer; exact cash amount strictly preserved across rebalancing.';
  }

  const reasons: string[] = [];
  const guestChange = (inputChanges.guestCount ?? oldProfile.guestCount) - oldProfile.guestCount;
  const budgetChange = (inputChanges.budget ?? oldProfile.totalBudget.amount) - oldProfile.totalBudget.amount;
  const oldLocTier = oldProfile.location?.tier || resolveLocationTier(oldProfile.location?.city).tier;
  const newLocTier = inputChanges.locationTier || oldLocTier;

  if (oldMode && newMode && oldMode !== newMode) {
    reasons.push(`Sourcing transitioned from ${oldMode} to ${newMode}`);
  }

  if (newLocTier !== oldLocTier) {
    const oldConfig = LOCATION_TIERS[oldLocTier];
    const newConfig = LOCATION_TIERS[newLocTier];
    reasons.push(
      `Location benchmark shifted from ${oldConfig.label} (${oldConfig.baseMultiplier}x) to ${newConfig.label} (${newConfig.baseMultiplier}x)`
    );
  }

  if (slug === 'food_prasad' && guestChange !== 0) {
    reasons.push(
      `${guestChange > 0 ? '+' : ''}${guestChange} attendees directly scales dinner buffet and prasad portioning`
    );
  }

  if (slug === 'safety' && guestChange > 0) {
    reasons.push('Increased crowd requires proportional security staffing and queue barricades');
  }

  if (budgetChange !== 0) {
    reasons.push(
      `Overall budget ${budgetChange > 0 ? 'expanded' : 'compressed'} by ₹${Math.abs(budgetChange).toLocaleString('en-IN')}`
    );
  }

  if (delta < 0 && guestChange > 0 && slug !== 'food_prasad' && slug !== 'safety') {
    reasons.push(
      `Rebalanced to absorb +${guestChange} extra guests in hospitality without exceeding total budget`
    );
  }

  if (reasons.length === 0) {
    reasons.push(
      delta > 0
        ? 'Allocation increased to support enhanced production benchmarks'
        : 'Rebalanced to accommodate priority shifts and community constraints'
    );
  }

  return reasons.join('. ') + '.';
}

/**
 * Pure deterministic scenario recomputation engine.
 * Computes exact diffs with natural human explanations.
 */
export function recomputeScenario(
  currentPlan: BudgetPlan,
  currentTasks: TaskGraph,
  profile: EventProfile,
  inputChanges: ScenarioInput
): ScenarioResult {
  const oldLocTier = profile.location?.tier || resolveLocationTier(profile.location?.city).tier;
  const newLocTier: LocationTier = inputChanges.locationTier || oldLocTier;

  // 1. Create modified profile clone
  const updatedProfile: EventProfile = {
    ...profile,
    totalBudget: {
      ...profile.totalBudget,
      amount: inputChanges.budget !== undefined && inputChanges.budget !== null
        ? Math.round(inputChanges.budget)
        : profile.totalBudget.amount
    },
    guestCount: inputChanges.guestCount !== undefined && inputChanges.guestCount !== null
      ? Math.max(1, Math.round(inputChanges.guestCount))
      : profile.guestCount,
    eventDate: inputChanges.eventDate || profile.eventDate,
    location: {
      ...profile.location,
      tier: newLocTier
    },
    updatedAt: new Date().toISOString()
  };

  // 2. Build category lock map
  const locks: CategoryLockMap = {};
  const lockedSlugs = [...(inputChanges.lockedCategories || [])];
  lockedSlugs.forEach(slug => {
    const existing = currentPlan.categories.find(c => c.slug === slug);
    if (existing) {
      locks[slug] = existing.lockedAmount ?? existing.allocatedAmount;
    }
  });

  // Apply explicit category overrides (e.g. adding cash expense or resetting to 0)
  if (inputChanges.categoryOverrides) {
    Object.entries(inputChanges.categoryOverrides).forEach(([s, amt]) => {
      const slug = s as BudgetCategorySlug;
      if (amt !== undefined && amt !== null) {
        if (amt === 0) {
          delete locks[slug];
          const idx = lockedSlugs.indexOf(slug);
          if (idx >= 0) lockedSlugs.splice(idx, 1);
        } else {
          locks[slug] = Math.max(0, Math.round(amt));
          if (!lockedSlugs.includes(slug)) {
            lockedSlugs.push(slug);
          }
        }
      }
    });
  }

  // 3. Re-run deterministic allocation and backward scheduling with location tier
  const newPlan = allocateBudget(updatedProfile, {
    locks,
    overrideLocationTier: newLocTier
  });
  newPlan.version = currentPlan.version + 1;

  const newTasks = scheduleBackward(updatedProfile);
  const newVendors = generateVendorChecklist(updatedProfile, newPlan, newTasks);

  // 4. Compute Category Diffs
  const diffs: Diff[] = [];
  const oldCategoryMap = new Map(currentPlan.categories.map(c => [c.slug, c]));

  newPlan.categories.forEach(newCat => {
    const oldCat = oldCategoryMap.get(newCat.slug);
    if (!oldCat) return;

    const delta = newCat.allocatedAmount - oldCat.allocatedAmount;
    const deltaPct = oldCat.allocatedAmount > 0
      ? Number(((delta / oldCat.allocatedAmount) * 100).toFixed(1))
      : 0;

    let direction: Diff['direction'] = 'unchanged';
    if (delta > 0) direction = 'increase';
    if (delta < 0) direction = 'decrease';

    const isLocked = lockedSlugs.includes(newCat.slug) || newCat.isLocked;

    if (delta !== 0 || isLocked) {
      const severity: Diff['severity'] = Math.abs(deltaPct) > 25 ? 'warning' : 'info';
      diffs.push({
        category: newCat.slug,
        field: 'allocatedAmount',
        oldValue: oldCat.allocatedAmount,
        newValue: newCat.allocatedAmount,
        delta,
        deltaPercentage: deltaPct,
        direction,
        reason: generateDiffReason(
          newCat.slug,
          delta,
          inputChanges,
          profile,
          isLocked,
          oldCat.sourcingModeLabel,
          newCat.sourcingModeLabel,
          oldCat.allocatedAmount,
          newCat.allocatedAmount
        ),
        severity
      });
    }
  });

  // 5. Overall budget and contingency diffs
  if (newPlan.totalBudget !== currentPlan.totalBudget) {
    const budgetDelta = newPlan.totalBudget - currentPlan.totalBudget;
    diffs.unshift({
      category: 'overall',
      field: 'totalBudget',
      oldValue: currentPlan.totalBudget,
      newValue: newPlan.totalBudget,
      delta: budgetDelta,
      deltaPercentage: Number(((budgetDelta / currentPlan.totalBudget) * 100).toFixed(1)),
      direction: budgetDelta > 0 ? 'increase' : 'decrease',
      reason: `Overall event budget updated from ₹${currentPlan.totalBudget.toLocaleString('en-IN')} to ₹${newPlan.totalBudget.toLocaleString('en-IN')}.`,
      severity: 'info'
    });
  }

  // 6. Location tier diff
  if (newLocTier !== oldLocTier) {
    const oldConfig = LOCATION_TIERS[oldLocTier];
    const newConfig = LOCATION_TIERS[newLocTier];
    diffs.unshift({
      category: 'overall',
      field: 'locationTier',
      oldValue: oldConfig.label,
      newValue: newConfig.label,
      delta: null,
      deltaPercentage: null,
      direction: newConfig.baseMultiplier > oldConfig.baseMultiplier ? 'increase' : 'decrease',
      reason: `Location cost tier changed to ${newConfig.label} (${newConfig.baseMultiplier}x benchmark). Category minimum floors and baseline allocations adjusted accordingly.`,
      severity: 'info'
    });
  }

  // 7. Timeline diffs if rush status or dates changed
  if (newTasks.rushMode !== currentTasks.rushMode) {
    diffs.push({
      category: 'timeline',
      field: 'rushMode',
      oldValue: currentTasks.rushMode ? 'Active' : 'Normal',
      newValue: newTasks.rushMode ? 'Active' : 'Normal',
      delta: null,
      deltaPercentage: null,
      direction: newTasks.rushMode ? 'increase' : 'decrease',
      reason: newTasks.rushMode
        ? 'Compressed date entered Rush Mode: tasks auto-accelerated with faster alternatives.'
        : 'Extended date exited Rush Mode back to standard lead times.',
      severity: 'warning'
    });
  }

  return {
    newPlan,
    newTasks,
    newVendors,
    diffs
  };
}
