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

export type CategoryLockMap = Partial<Record<BudgetCategorySlug, number>>;

export interface AllocationOptions {
  locks?: CategoryLockMap;
}

/**
 * Computes minimum viable floor cost for all categories given event profile.
 */
export function computeCategoryFloors(profile: EventProfile): Record<BudgetCategorySlug, number> {
  const guests = Math.max(1, profile.guestCount);
  const tier = profile.experienceTier || 'normal';
  const floors = {} as Record<BudgetCategorySlug, number>;

  const slugs = Object.keys(CULTURAL_CATEGORIES) as BudgetCategorySlug[];
  for (const slug of slugs) {
    if (FLOOR_PER_HEAD[slug]) {
      floors[slug] = Math.round(FLOOR_PER_HEAD[slug][tier] * guests);
    } else if (FLOOR_FIXED[slug]) {
      floors[slug] = Math.round(FLOOR_FIXED[slug][tier]);
    } else {
      floors[slug] = 5000;
    }
  }

  return floors;
}

/**
 * Checks financial feasibility of the event before full plan allocation.
 */
export function checkFeasibility(
  totalBudget: number,
  guestCount: number,
  profile?: Partial<EventProfile>
): FeasibilityResult {
  const safeGuests = Math.max(1, guestCount);
  const perHead = Math.round(totalBudget / safeGuests);
  const tier = profile?.experienceTier || 'normal';

  // Base minimum floor sum (100 guests standard baseline for quick check)
  const minFoodPerHead = FLOOR_PER_HEAD.food_prasad[tier];
  const minSafetyPerHead = FLOOR_PER_HEAD.safety[tier];
  const minVolunteerPerHead = FLOOR_PER_HEAD.volunteers[tier];
  const minPerHead = minFoodPerHead + minSafetyPerHead + minVolunteerPerHead;

  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Contingency 10%
  const allocatable = totalBudget * 0.9;
  const allocatablePerHead = Math.round(allocatable / safeGuests);

  let isViable = true;

  if (allocatablePerHead < minPerHead + 200) {
    isViable = false;
    warnings.push(
      `Budget of ₹${totalBudget.toLocaleString('en-IN')} for ${safeGuests} guests (₹${perHead}/head) is below minimum viable threshold of ₹${minPerHead + 200}/head.`
    );
    suggestions.push(
      `Consider either reducing guest count to ~${Math.floor(allocatable / (minPerHead + 400))} or increasing budget to at least ₹${Math.round((minPerHead + 400) * safeGuests / 0.9).toLocaleString('en-IN')}.`
    );
    suggestions.push('You can also enable the "DIY-Max" plan style to rely on community volunteers and donated society premises.');
  } else if (allocatablePerHead < 1200) {
    warnings.push(
      `Tight per-head budget (₹${perHead}/head). Decor and performer spending will be conservative.`
    );
    suggestions.push('Consider DIY-Max plan style to prioritize delicious prasad feast while keeping production simple.');
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
  guestCount: number
): string {
  if (isLocked) {
    return 'Locked by user at exact designated amount.';
  }
  if (allocated === floor) {
    return 'Allocated at minimum viable floor cost to maintain safety and core quality.';
  }
  if (isPriority) {
    return `Top priority selection boosted to ensure standout ${CULTURAL_CATEGORIES[slug].shortLabel.toLowerCase()} experience for ${guestCount} attendees.`;
  }
  if (slug === 'food_prasad') {
    return `Proportionately scaled to provide complete feast and consecrated prasad for all ${guestCount} guests.`;
  }
  if (slug === 'safety') {
    return 'Scaled for mandatory fire safety, crowd barricades, and security guard shifts.';
  }
  return `Balanced allocation based on community celebration benchmarks and society guidelines.`;
}

/**
 * Pure deterministic budget allocator.
 * Invariant: sum(categories.allocatedAmount) + contingency = totalBudget exactly.
 */
export function allocateBudget(profile: EventProfile, options: AllocationOptions = {}): BudgetPlan {
  const totalBudget = Math.max(10000, Math.round(profile.totalBudget.amount));
  const guests = Math.max(1, profile.guestCount);
  const subType = profile.eventSubType || 'festival';
  const locks = options.locks || {};

  // 1. Contingency reserve: exactly 10%
  const contingencyPercentage = 10;
  const contingencyAmount = Math.round((totalBudget * contingencyPercentage) / 100);
  const allocatableBudget = totalBudget - contingencyAmount;

  // 2. Minimum viable cost floors
  const floors = computeCategoryFloors(profile);
  const slugs = Object.keys(CULTURAL_CATEGORIES) as BudgetCategorySlug[];

  // 3. Feasibility validation
  const totalFloors = slugs.reduce((sum, s) => sum + floors[s], 0);
  const feasibility = checkFeasibility(totalBudget, guests, profile);

  // 4. Base weights
  const baseWeights = { ...(CULTURAL_WEIGHT_TABLE[subType] || CULTURAL_WEIGHT_TABLE.festival) };
  const effectiveWeights = { ...baseWeights };

  // Priority boost (1.5x)
  const topPriorities = profile.priorities?.top2 || [];
  for (const prio of topPriorities) {
    if (effectiveWeights[prio]) {
      effectiveWeights[prio] *= 1.5;
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
  let delta = allocatableBudget - runningAllocated;
  if (delta !== 0) {
    // Distribute remaining rounding difference to highest unlocked category
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
    const isPriority = (topPriorities as string[]).includes(slug);
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
      why: generateCategoryWhy(slug, allocated, floors[slug], isPriority, isLocked, guests),
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
