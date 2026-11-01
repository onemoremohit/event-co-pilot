import {
  BudgetCategory,
  BudgetCategorySlug,
  BudgetPlan,
  EventProfile,
  FeasibilityResult
} from '../types';
import {
  CULTURAL_CATEGORIES,
  CULTURAL_WEIGHT_TABLE,
  FLOOR_FIXED,
  FLOOR_PER_HEAD
} from '../constants/cultural';
import {
  resolveLocationTier,
  getCategoryLocationMultiplier,
  LOCATION_TIERS,
  LocationTier
} from './location';

export type CategoryLockMap = Partial<Record<BudgetCategorySlug, number>>;

export interface AllocationOptions {
  locks?: CategoryLockMap;
  overrideLocationTier?: LocationTier;
}

/**
 * Computes minimum viable floor cost for all categories given event profile and location tier.
 * Floors scale deterministically based on location cost multipliers.
 */
export function computeCategoryFloors(
  profile: EventProfile,
  overrideTier?: LocationTier
): Record<BudgetCategorySlug, number> {
  const guests = Math.max(1, profile.guestCount || 1);
  const expTier = profile.experienceTier || 'normal';
  const locTier = overrideTier || profile.location?.tier || resolveLocationTier(profile.location?.city).tier;

  const floors = {} as Record<BudgetCategorySlug, number>;
  const slugs = Object.keys(CULTURAL_CATEGORIES) as BudgetCategorySlug[];

  for (const slug of slugs) {
    const locMultiplier = getCategoryLocationMultiplier(locTier, slug);

    if (FLOOR_PER_HEAD[slug]) {
      const basePerHead = FLOOR_PER_HEAD[slug][expTier] * guests;
      floors[slug] = Math.round(basePerHead * locMultiplier);
    } else if (FLOOR_FIXED[slug]) {
      const baseFixed = FLOOR_FIXED[slug][expTier];
      floors[slug] = Math.round(baseFixed * locMultiplier);
    } else {
      floors[slug] = Math.round(5000 * locMultiplier);
    }
  }

  return floors;
}

/**
 * Checks financial feasibility of the event before full plan allocation.
 * Takes into account the location tier cost benchmark.
 */
export function checkFeasibility(
  totalBudget: number,
  guestCount: number,
  profile?: Partial<EventProfile>,
  overrideTier?: LocationTier
): FeasibilityResult {
  const safeGuests = Math.max(1, guestCount);
  const perHead = Math.round(totalBudget / safeGuests);
  const expTier = profile?.experienceTier || 'normal';
  const locTier = overrideTier || profile?.location?.tier || resolveLocationTier(profile?.location?.city).tier;
  const locConfig = LOCATION_TIERS[locTier];

  // Base minimum floor sum scaled by location tier
  const foodMult = getCategoryLocationMultiplier(locTier, 'food_prasad');
  const safetyMult = getCategoryLocationMultiplier(locTier, 'safety');
  const volMult = getCategoryLocationMultiplier(locTier, 'volunteers');

  const minFoodPerHead = Math.round(FLOOR_PER_HEAD.food_prasad[expTier] * foodMult);
  const minSafetyPerHead = Math.round(FLOOR_PER_HEAD.safety[expTier] * safetyMult);
  const minVolunteerPerHead = Math.round(FLOOR_PER_HEAD.volunteers[expTier] * volMult);
  const minPerHead = minFoodPerHead + minSafetyPerHead + minVolunteerPerHead;

  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Contingency 10%
  const allocatable = totalBudget * 0.9;
  const allocatablePerHead = Math.round(allocatable / safeGuests);

  let isViable = true;

  // Location-adjusted minimum viability threshold
  const viabilityFloor = Math.round((minPerHead + 200) * (locConfig.baseMultiplier >= 1.0 ? 1.0 : 0.85));

  if (allocatablePerHead < viabilityFloor) {
    isViable = false;
    warnings.push(
      `Budget of ₹${totalBudget.toLocaleString('en-IN')} for ${safeGuests} guests (₹${perHead}/head) in a ${locConfig.label} is below the minimum viable floor (₹${viabilityFloor}/head).`
    );
    suggestions.push(
      `In a ${locConfig.label}, consider either adjusting guests to ~${Math.floor(allocatable / (viabilityFloor + 200))} or raising budget to at least ₹${Math.round((viabilityFloor + 200) * safeGuests / 0.9).toLocaleString('en-IN')}.`
    );
    suggestions.push('Alternatively, enable the "DIY-Max" plan style to rely on community volunteers and donated society premises.');
  } else if (locTier === 'metro' && allocatablePerHead < 1800) {
    warnings.push(
      `Tight per-head budget (₹${perHead}/head) for a Metro city (${locConfig.label} rates are ~35% above baseline). Decor, sound and photography rentals will be conservative.`
    );
    suggestions.push('Consider DIY-Max plan style to prioritize a grand prasad feast while using in-house society decor.');
  } else if (locTier === 'village') {
    if (allocatablePerHead >= 1200) {
      suggestions.push(
        `Generous per-head budget (₹${perHead}/head) for a Village/Rural setting (~40% lower rental and vendor overhead). Excellent capacity for a lavish feast and traditional folk troupe!`
      );
    } else {
      suggestions.push('Comfortable budget for a village celebration. Community volunteer engagement will stretch every rupee.');
    }
  } else if (locTier === 'small_town' && allocatablePerHead >= 2000) {
    suggestions.push('Very healthy budget for a small town community celebration! Premium stage lighting and multi-item feast supported.');
  } else if (allocatablePerHead > 4000) {
    suggestions.push('Healthy budget per head! Premium artists, drone videography, and multi-cuisine feasts are well supported.');
  }

  return {
    isViable,
    perHeadBudget: perHead,
    warnings,
    suggestions
  };
}

/**
 * Deterministic explanation generator for budget line items.
 */
function generateCategoryWhy(
  slug: BudgetCategorySlug,
  allocated: number,
  floor: number,
  isPriority: boolean,
  isLocked: boolean,
  guestCount: number,
  locTier: LocationTier
): string {
  if (isLocked) {
    return 'Locked by user at exact designated amount.';
  }
  const locNote = locTier === 'metro'
    ? ' (calibrated for metro vendor rates)'
    : locTier === 'village'
    ? ' (calibrated for rural/village overhead)'
    : locTier === 'small_town'
    ? ' (calibrated for small town benchmark)'
    : '';

  if (allocated === floor) {
    return `Allocated at minimum viable floor cost to maintain safety and core quality${locNote}.`;
  }
  if (isPriority) {
    return `Top priority selection boosted to ensure standout ${CULTURAL_CATEGORIES[slug].shortLabel.toLowerCase()} experience for ${guestCount} attendees${locNote}.`;
  }
  if (slug === 'food_prasad') {
    return `Proportionately scaled to provide complete feast and consecrated prasad for all ${guestCount} guests${locNote}.`;
  }
  if (slug === 'safety') {
    return `Scaled for mandatory fire safety, crowd barricades, and security guard shifts${locNote}.`;
  }
  return `Balanced allocation based on community celebration benchmarks and society guidelines${locNote}.`;
}

/**
 * Pure deterministic budget allocator.
 * Invariant: sum(categories.allocatedAmount) + contingency = totalBudget exactly.
 */
export function allocateBudget(profile: EventProfile, options: AllocationOptions = {}): BudgetPlan {
  const totalBudget = Math.max(1000, Math.round(profile.totalBudget?.amount || 100000));
  const guests = Math.max(1, profile.guestCount || 50);
  const subType = profile.eventSubType || 'festival';
  const locks = options.locks || {};
  const locTier = options.overrideLocationTier || profile.location?.tier || resolveLocationTier(profile.location?.city).tier;

  // 1. Contingency reserve: exactly 10%
  const contingencyPercentage = 10;
  const contingencyAmount = Math.round((totalBudget * contingencyPercentage) / 100);
  const allocatableBudget = totalBudget - contingencyAmount;

  // 2. Minimum viable cost floors (location-aware)
  const floors = computeCategoryFloors(profile, locTier);
  const slugs = Object.keys(CULTURAL_CATEGORIES) as BudgetCategorySlug[];

  // 3. Feasibility validation
  const feasibility = checkFeasibility(totalBudget, guests, profile, locTier);

  // 4. Base weights adapted for event subtype & location nuances
  const baseWeights = { ...(CULTURAL_WEIGHT_TABLE[subType] || CULTURAL_WEIGHT_TABLE.festival) };
  const effectiveWeights = { ...baseWeights };

  // Location tier nuances on distribution weights:
  // In a village, venue rental is minimal, food and volunteers are central
  if (locTier === 'village') {
    effectiveWeights.venue_permissions *= 0.6;
    effectiveWeights.food_prasad *= 1.2;
    effectiveWeights.volunteers *= 1.25;
  } else if (locTier === 'metro') {
    // In metros, stage/sound, venue/security require more budget
    effectiveWeights.stage_sound *= 1.15;
    effectiveWeights.venue_permissions *= 1.2;
    effectiveWeights.safety *= 1.15;
  }

  // Priority boost (1.5x)
  const topPriorities = (profile.priorities?.top2 || []) as string[];
  for (const prio of topPriorities) {
    const slug = prio as BudgetCategorySlug;
    if (effectiveWeights[slug]) {
      effectiveWeights[slug] *= 1.5;
    }
  }

  // Demographic modifiers
  const mix = profile.guestMix || { family: 50, elders: 20, kids: 20, colleagues: 5, friends: 5 };
  if (mix.elders > 20) {
    effectiveWeights.safety *= 1.25;
    effectiveWeights.food_prasad *= 1.1;
  }
  if (mix.kids > 20) {
    effectiveWeights.performers *= 1.2;
    effectiveWeights.decor *= 1.15;
  }

  // 5. Account for locked categories
  let lockedSum = 0;
  let unlockedFloorsSum = 0;
  let unlockedWeightSum = 0;

  for (const slug of slugs) {
    if (locks[slug] !== undefined && locks[slug] !== null) {
      lockedSum += Math.max(0, Math.round(locks[slug]!));
    } else {
      unlockedFloorsSum += floors[slug];
      unlockedWeightSum += effectiveWeights[slug];
    }
  }

  // Pool remaining for unlocked categories above their floors
  const remainingForUnlocked = allocatableBudget - lockedSum;
  const aboveFloorPool = Math.max(0, remainingForUnlocked - unlockedFloorsSum);

  // Normalize weights of unlocked categories
  const normalizedWeights: Record<BudgetCategorySlug, number> = {} as any;
  for (const slug of slugs) {
    if (locks[slug] !== undefined && locks[slug] !== null) {
      normalizedWeights[slug] = 0;
    } else {
      normalizedWeights[slug] = unlockedWeightSum > 0 ? effectiveWeights[slug] / unlockedWeightSum : 1 / slugs.length;
    }
  }

  // 6. Allocate amounts to each category
  const allocations: Record<BudgetCategorySlug, number> = {} as any;
  let runningAllocated = 0;

  for (const slug of slugs) {
    if (locks[slug] !== undefined && locks[slug] !== null) {
      allocations[slug] = Math.round(locks[slug]!);
    } else {
      const share = Math.round(aboveFloorPool * normalizedWeights[slug]);
      allocations[slug] = floors[slug] + share;
    }
    runningAllocated += allocations[slug];
  }

  // 7. Exact rounding adjustment to match allocatableBudget to the single rupee
  const delta = allocatableBudget - runningAllocated;
  if (delta !== 0) {
    const unlockedSlugs = slugs.filter(s => locks[s] === undefined || locks[s] === null);
    if (unlockedSlugs.length > 0) {
      const targetSlug = unlockedSlugs.includes('food_prasad') ? 'food_prasad' : unlockedSlugs[0];
      allocations[targetSlug] += delta;
      runningAllocated += delta;
    }
  }

  // 8. Construct structured BudgetCategory objects
  const categories: BudgetCategory[] = slugs.map(slug => {
    const meta = CULTURAL_CATEGORIES[slug];
    const allocated = allocations[slug];
    const isLocked = locks[slug] !== undefined && locks[slug] !== null;
    const isPriority = topPriorities.includes(slug);
    const perHead = FLOOR_PER_HEAD[slug] ? Math.round(allocated / guests) : null;

    // Generate proportional sub-items
    const subItems = meta.defaultSubItems.map(item => ({
      label: item.label,
      estimatedCost: Math.round(allocated * item.ratio),
      notes: item.notes
    }));

    return {
      slug,
      label: meta.label,
      allocatedAmount: allocated,
      allocatedPercentage: Number(((allocated / allocatableBudget) * 100).toFixed(2)),
      floorAmount: floors[slug],
      weight: Number((effectiveWeights[slug] || 0.1).toFixed(3)),
      isLocked,
      lockedAmount: isLocked ? locks[slug]! : null,
      perHeadCost: perHead,
      why: generateCategoryWhy(slug, allocated, floors[slug], isPriority, isLocked, guests, locTier),
      subItems
    };
  });

  return {
    eventId: profile.id,
    totalBudget,
    contingencyReserve: {
      percentage: contingencyPercentage,
      amount: contingencyAmount
    },
    allocatableBudget,
    categories,
    totalAllocated: runningAllocated,
    remainingBuffer: allocatableBudget - runningAllocated,
    feasibility,
    version: 1,
    createdAt: new Date().toISOString()
  };
}
