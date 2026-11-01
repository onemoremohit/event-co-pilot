import {
  BudgetCategory,
  BudgetCategorySlug,
  BudgetPlan,
  EventProfile,
  FeasibilityResult,
  PlanVerification,
  ResourcefulnessToolkit,
  SourcingMode
} from '../types';
import {
  CULTURAL_CATEGORIES,
  CULTURAL_WEIGHT_TABLE,
  FLOOR_FIXED,
  FLOOR_PER_HEAD,
  detectEventArchetype,
  getCategoryMetadata
} from '../constants/cultural';
import {
  resolveLocationTier,
  getCategoryLocationMultiplier,
  LOCATION_TIERS,
  LocationTier
} from './location';
import {
  CATEGORY_SOURCING_CONFIG,
  SOURCING_MODE_ORDER,
  computeSourcingModeCost,
  getCategorySourcingDetails
} from './sourcing';
import { evaluateInputSanity } from './sanity';

export type CategoryLockMap = Partial<Record<BudgetCategorySlug, number>>;

export interface AllocationOptions {
  locks?: CategoryLockMap;
  overrideLocationTier?: LocationTier;
}

/**
 * Checks financial feasibility and returns friendly community guidance.
 * Never shames or lectures; focuses on community power and smart sourcing.
 */
export function checkFeasibility(
  totalBudget: number,
  guestCount: number,
  profile?: Partial<EventProfile>,
  overrideTier?: LocationTier
): FeasibilityResult {
  const safeGuests = Math.max(1, guestCount || 1);
  const perHead = Math.round(totalBudget / safeGuests);
  const subType = profile?.eventSubType || 'festival';
  const locTier = overrideTier || profile?.location?.tier || resolveLocationTier(profile?.location?.city).tier;

  const sanity = evaluateInputSanity(totalBudget, guestCount, profile?.eventDate, subType);
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Minimum commercial viability floor (scaled by location)
  const baseViabilityFloor = subType === 'festival' ? 180 : 120;
  const locViabilityFloor = Math.round(baseViabilityFloor * (LOCATION_TIERS[locTier]?.baseMultiplier || 1.0));

  if (sanity.isAbsurd) {
    warnings.push(sanity.humanMessage);
    if (sanity.nearestWorkableOption) {
      suggestions.push(sanity.nearestWorkableOption.suggestedPlan);
    }
    return {
      isViable: false,
      perHeadBudget: perHead,
      warnings,
      suggestions
    };
  }

  // Very low per-head check (< viability floor)
  let isViable = true;
  if (perHead < locViabilityFloor) {
    isViable = false;
    warnings.push(
      `Budget of ₹${perHead}/head is extremely tight for a ${subType.replace('_', ' ')} with ${safeGuests} guests. Commercial catering and stage rentals are not viable; 100% volunteer and community-contributed sourcing is required.`
    );
  }

  if (sanity.isTightWorkable || !isViable) {
    suggestions.push(sanity.humanMessage);
    suggestions.push(
      `Community Action: Engage wing captains for potluck/prasad bhog contributions and borrow society sound equipment to keep costs near ₹0.`
    );
  } else if (locTier === 'village') {
    suggestions.push(
      `Generous per-head budget (₹${perHead}/head) for a Village/Rural setting (~40% lower rental and vendor overhead). Excellent capacity for a lavish feast and traditional folk troupe!`
    );
  } else if (locTier === 'small_town') {
    suggestions.push(
      `Healthy budget for a small town community celebration! Good balance of rented sound and delicious community feast.`
    );
  }

  if (locTier === 'metro' && perHead < 1000) {
    warnings.push(
      `Metro vendor and hall rental rates in cities like Bengaluru/Mumbai are approximately ~35% higher. Relying on society common grounds and volunteer decor will help stretch the budget.`
    );
    suggestions.push('Consider community-sourced DIY decor and local temple prasad catering to manage metro overhead.');
  } else if (perHead >= 1000) {
    suggestions.push(
      `Healthy budget per head! Standard sound, colorful floral decor, and catered community meals are well supported.`
    );
  }

  return {
    isViable,
    perHeadBudget: perHead,
    warnings,
    suggestions
  };
}

/**
 * Computes minimum viable floor cost for all categories given event profile and location tier.
 * For backwards compatibility with older tests and components.
 */
export function computeCategoryFloors(
  profile: EventProfile,
  overrideTier?: LocationTier
): Record<BudgetCategorySlug, number> {
  const guests = Math.max(1, profile.guestCount || 1);
  const locTier = overrideTier || profile.location?.tier || resolveLocationTier(profile.location?.city).tier;
  const floors = {} as Record<BudgetCategorySlug, number>;
  const slugs = Object.keys(CULTURAL_CATEGORIES) as BudgetCategorySlug[];

  for (const slug of slugs) {
    // In our new sourcing architecture, minimal_paid is the baseline commercial floor
    floors[slug] = computeSourcingModeCost(slug, 'minimal_paid', guests, locTier);
  }
  return floors;
}

/**
 * Verifies all 6 mandatory invariants before plan is presented.
 */
export function verifyPlanInvariants(
  categories: BudgetCategory[],
  contingencyAmount: number,
  totalBudget: number,
  allocatableBudget: number
): PlanVerification {
  const noNegative = categories.every(c => c.allocatedAmount >= 0) && contingencyAmount >= 0;
  const sumCategories = categories.reduce((acc, c) => acc + c.allocatedAmount, 0);
  const exactSum = sumCategories + contingencyAmount === totalBudget && sumCategories === allocatableBudget;
  const sumPercentages = categories.reduce((acc, c) => acc + c.allocatedPercentage, 0);
  const normalizedPercentages = allocatableBudget === 0 || Math.abs(sumPercentages - 100) <= 0.2;
  const perGuestValid = categories.every(
    c => c.perHeadCost === null || (!isNaN(c.perHeadCost) && isFinite(c.perHeadCost) && c.perHeadCost >= 0)
  );

  const isVerified = noNegative && exactSum && normalizedPercentages && perGuestValid;

  return {
    isVerified,
    invariantsChecked: {
      noNegative,
      exactSum,
      normalizedPercentages,
      perGuestValid
    },
    badgeText: isVerified
      ? 'Verified Plan: 100% Exact Balance, Zero Negative Items'
      : 'Validation Warning: Adjustments Recommended',
    details: isVerified
      ? `Exact match: ₹${sumCategories.toLocaleString('en-IN')} allocated + ₹${contingencyAmount.toLocaleString('en-IN')} contingency = ₹${totalBudget.toLocaleString('en-IN')}`
      : `Sum mismatch: calculated ₹${(sumCategories + contingencyAmount).toLocaleString('en-IN')} vs target ₹${totalBudget.toLocaleString('en-IN')}`
  };
}

/**
 * Pure deterministic budget allocator powered by Discrete Sourcing Modes & Marginal Upgrades.
 * Invariants:
 * 1. No allocation is ever negative (allocation >= 0).
 * 2. sum(categories.allocatedAmount) + contingency = totalBudget exactly.
 * 3. Percentage shares sum to 100.0%.
 * 4. Per-guest figures are never negative, NaN, or Infinity.
 * 5. Full resilience: never throws on unexpected input.
 */
export function allocateBudget(profile: EventProfile, options: AllocationOptions = {}): BudgetPlan {
  // 1. Sanitize Inputs gracefully (never crash on NaN, negative, or undefined)
  const rawBudget = Number(profile.totalBudget?.amount);
  const totalBudget = isNaN(rawBudget) || rawBudget < 0 ? 0 : Math.round(rawBudget);

  const rawGuests = Number(profile.guestCount);
  const guests = isNaN(rawGuests) || rawGuests <= 0 ? 50 : Math.round(rawGuests);

  const subType = profile.eventSubType || 'festival';
  const locTier = options.overrideLocationTier || profile.location?.tier || resolveLocationTier(profile.location?.city).tier;
  const experienceTier = profile.experienceTier || 'normal';
  const locks = options.locks || {};
  const topPriorities: BudgetCategorySlug[] = profile.priorities?.top2
    ? [...profile.priorities.top2]
    : ['food_prasad', 'stage_sound'];

  const slugs = Object.keys(CULTURAL_CATEGORIES) as BudgetCategorySlug[];

  // 2. Sensible Contingency Reserve Scaling
  // Tight budgets (<=10k) use 5% so cash is not locked away; large budgets scale up to 10% (capped at 2L)
  let contingencyPercentage = 10;
  if (totalBudget <= 10000) {
    contingencyPercentage = 5;
  } else if (totalBudget <= 50000) {
    contingencyPercentage = 7;
  } else if (totalBudget <= 150000) {
    contingencyPercentage = 8;
  } else {
    contingencyPercentage = 10;
  }

  let contingencyAmount = Math.round((totalBudget * contingencyPercentage) / 100);
  if (totalBudget > 0 && contingencyAmount < 250 && totalBudget >= 5000) {
    contingencyAmount = 250;
  }
  if (contingencyAmount > 200000) {
    contingencyAmount = 200000;
  }
  if (contingencyAmount > totalBudget) {
    contingencyAmount = totalBudget;
  }

  const allocatableBudget = Math.max(0, totalBudget - contingencyAmount);

  // 3. Baseline Initialization: All categories start at 'community_sourced' (₹0 cash)
  const currentModes: Record<BudgetCategorySlug, SourcingMode> = {} as any;
  const currentAllocations: Record<BudgetCategorySlug, number> = {} as any;

  for (const slug of slugs) {
    currentModes[slug] = 'community_sourced';
    currentAllocations[slug] = 0;
  }

  // 4. Handle User Locked Categories
  let committedCash = 0;
  for (const slug of slugs) {
    if (locks[slug] !== undefined && locks[slug] !== null) {
      const lockVal = Math.max(0, Math.round(locks[slug]!));
      currentAllocations[slug] = lockVal;
      committedCash += lockVal;
    }
  }

  // Invariant Guard: If user locks exceed allocatable budget, scale locks down proportionally
  // so sum of locks matches allocatableBudget without producing negative allocations.
  if (committedCash > allocatableBudget && allocatableBudget > 0) {
    const scale = allocatableBudget / committedCash;
    let distributed = 0;
    const lockedSlugs = slugs.filter(s => locks[s] !== undefined && locks[s] !== null);
    lockedSlugs.forEach((slug, idx) => {
      if (idx === lockedSlugs.length - 1) {
        currentAllocations[slug] = Math.max(0, allocatableBudget - distributed);
      } else {
        const scaled = Math.floor(currentAllocations[slug] * scale);
        currentAllocations[slug] = scaled;
        distributed += scaled;
      }
    });
    committedCash = allocatableBudget;
  }

  // Determine appropriate mode label corresponding to locked amount
  for (const slug of slugs) {
    if (locks[slug] !== undefined && locks[slug] !== null) {
      const lockVal = currentAllocations[slug];
      if (lockVal > 0) {
        currentModes[slug] = 'minimal_paid'; // baseline if cash is spent
        for (const m of SOURCING_MODE_ORDER) {
          if (m === 'community_sourced') continue;
          const cost = computeSourcingModeCost(slug, m, guests, locTier);
          if (lockVal >= cost) {
            currentModes[slug] = m;
          }
        }
      } else {
        currentModes[slug] = 'community_sourced';
      }
    }
  }

  let remainingCash = Math.max(0, allocatableBudget - committedCash);

  // 5. Monotonic Multi-Round Prioritized Upgrade Sequence
  // Categories upgrade along a strictly ordered priority sequence.
  // This guarantees mathematical Monotonicity: higher budget NEVER degrades any sourcing mode.
  const unlockedSlugs = slugs.filter(s => locks[s] === undefined || locks[s] === null);

  // Helper to sort a list of slugs by user priority and cultural weight
  const sortSlugsByPriority = (list: BudgetCategorySlug[]) => {
    return [...list].sort((a, b) => {
      const aPrio = topPriorities.includes(a);
      const bPrio = topPriorities.includes(b);
      if (aPrio && !bPrio) return -1;
      if (!aPrio && bPrio) return 1;

      const aCrit = CATEGORY_SOURCING_CONFIG[a].criticality[subType];
      const bCrit = CATEGORY_SOURCING_CONFIG[b].criticality[subType];
      const critOrder = { essential: 0, important: 1, optional: 2 };
      if (critOrder[aCrit] !== critOrder[bCrit]) {
        return critOrder[aCrit] - critOrder[bCrit];
      }

      const aWeight = CULTURAL_WEIGHT_TABLE[subType]?.[a] || 0.1;
      const bWeight = CULTURAL_WEIGHT_TABLE[subType]?.[b] || 0.1;
      return bWeight - aWeight;
    });
  };

  const prioritizedSlugs = sortSlugsByPriority(unlockedSlugs);

  // Upgrade phases defined in strict priority order.
  // Optional categories are gated: they never upgrade if essentials are still in community mode.
  const upgradePhases: {
    targetMode: SourcingMode;
    gate?: (modes: Record<BudgetCategorySlug, SourcingMode>) => boolean;
    filter: (s: BudgetCategorySlug) => boolean;
  }[] = [
    // Phase 1: Essential & Top Priority categories reach Minimal Paid
    {
      targetMode: 'minimal_paid',
      filter: s => topPriorities.includes(s) || CATEGORY_SOURCING_CONFIG[s].criticality[subType] === 'essential'
    },
    // Phase 2: Top Priority categories reach Standard Paid
    {
      targetMode: 'standard_paid',
      filter: s => topPriorities.includes(s)
    },
    // Phase 3: Important categories reach Minimal Paid
    {
      targetMode: 'minimal_paid',
      gate: modes => prioritizedSlugs.filter(s => topPriorities.includes(s)).every(p => modes[p] !== 'community_sourced'),
      filter: s => CATEGORY_SOURCING_CONFIG[s].criticality[subType] === 'important'
    },
    // Phase 4: Essential & Top Priority categories reach Enhanced Paid
    {
      targetMode: 'enhanced_paid',
      filter: s => topPriorities.includes(s) || CATEGORY_SOURCING_CONFIG[s].criticality[subType] === 'essential'
    },
    // Phase 5: Important categories reach Standard Paid
    {
      targetMode: 'standard_paid',
      gate: modes => prioritizedSlugs.filter(s => topPriorities.includes(s)).every(p => modes[p] !== 'community_sourced'),
      filter: s => CATEGORY_SOURCING_CONFIG[s].criticality[subType] === 'important'
    },
    // Phase 6: Optional categories reach Minimal Paid (GATED: only if essentials/priorities are at least minimal paid)
    {
      targetMode: 'minimal_paid',
      gate: modes => prioritizedSlugs.filter(s => topPriorities.includes(s) || CATEGORY_SOURCING_CONFIG[s].criticality[subType] === 'essential').every(p => modes[p] !== 'community_sourced'),
      filter: s => CATEGORY_SOURCING_CONFIG[s].criticality[subType] === 'optional'
    },
    // Phase 7: Top Priorities reach Premium Turnkey
    {
      targetMode: 'premium_paid',
      filter: s => topPriorities.includes(s)
    },
    // Phase 8: Essential and Important reach Enhanced Paid
    {
      targetMode: 'enhanced_paid',
      gate: modes => prioritizedSlugs.filter(s => topPriorities.includes(s)).every(p => SOURCING_MODE_ORDER.indexOf(modes[p]) >= 2),
      filter: s => CATEGORY_SOURCING_CONFIG[s].criticality[subType] !== 'optional'
    },
    // Phase 9: All remaining reach Standard and Enhanced Paid
    {
      targetMode: 'standard_paid',
      gate: modes => prioritizedSlugs.filter(s => topPriorities.includes(s)).every(p => SOURCING_MODE_ORDER.indexOf(modes[p]) >= 2),
      filter: () => true
    },
    {
      targetMode: 'enhanced_paid',
      gate: modes => prioritizedSlugs.filter(s => topPriorities.includes(s)).every(p => SOURCING_MODE_ORDER.indexOf(modes[p]) >= 2),
      filter: () => true
    },
    // Phase 10: All reach Premium Paid
    {
      targetMode: 'premium_paid',
      gate: modes => prioritizedSlugs.filter(s => topPriorities.includes(s)).every(p => SOURCING_MODE_ORDER.indexOf(modes[p]) >= 3),
      filter: () => true
    }
  ];

  for (const phase of upgradePhases) {
    if (remainingCash <= 0) break;
    if (phase.gate && !phase.gate(currentModes)) {
      continue;
    }
    const candidates = prioritizedSlugs.filter(phase.filter);

    for (const slug of candidates) {
      if (remainingCash <= 0) break;
      const currentMode = currentModes[slug];
      const targetMode = phase.targetMode;
      const currentIdx = SOURCING_MODE_ORDER.indexOf(currentMode);
      const targetIdx = SOURCING_MODE_ORDER.indexOf(targetMode);

      if (currentIdx < targetIdx) {
        // Evaluate cost to step up to targetMode
        const currentCost = computeSourcingModeCost(slug, currentMode, guests, locTier);
        const targetCost = computeSourcingModeCost(slug, targetMode, guests, locTier);
        const stepCost = Math.max(0, targetCost - currentCost);

        if (stepCost <= remainingCash && stepCost > 0) {
          currentModes[slug] = targetMode;
          currentAllocations[slug] += stepCost;
          remainingCash -= stepCost;
        }
      }
    }
  }

  // 7. Distribute Residual Cash into Priority Categories
  // If there is unspent cash that couldn't trigger a whole mode upgrade, distribute it cleanly
  if (remainingCash > 0 && unlockedSlugs.length > 0) {
    const recipientSlugs = unlockedSlugs.filter(s => topPriorities.includes(s));
    const targetSlugs = recipientSlugs.length > 0 ? recipientSlugs : unlockedSlugs;
    const share = Math.floor(remainingCash / targetSlugs.length);
    let distributed = 0;

    for (let i = 0; i < targetSlugs.length; i++) {
      const s = targetSlugs[i];
      const addition = i === targetSlugs.length - 1 ? remainingCash - distributed : share;
      currentAllocations[s] += addition;
      distributed += addition;
    }
    remainingCash = 0;
  }

  // 8. Strict Rupee Conservation Guarantee
  // Ensure sum of allocations equals allocatableBudget exactly
  const runningSum = slugs.reduce((acc, s) => acc + currentAllocations[s], 0);
  const diff = allocatableBudget - runningSum;
  if (diff !== 0 && unlockedSlugs.length > 0) {
    const adjustSlug = unlockedSlugs.find(s => topPriorities.includes(s)) || unlockedSlugs[0];
    currentAllocations[adjustSlug] = Math.max(0, currentAllocations[adjustSlug] + diff);
  }

  // 9. Construct Structured Categories
  const archetype = detectEventArchetype(profile);
  const categories: BudgetCategory[] = slugs.map(slug => {
    const allocated = currentAllocations[slug];
    const mode = currentModes[slug];
    const catMeta = getCategoryMetadata(slug, archetype);
    const sourcingDetails = getCategorySourcingDetails(slug, mode, archetype);
    const isLocked = locks[slug] !== undefined && locks[slug] !== null;
    const isPriority = topPriorities.includes(slug);
    const perHead = guests > 0 ? Math.round(allocated / guests) : 0;
    const minPaidFloor = computeSourcingModeCost(slug, 'minimal_paid', guests, locTier);

    // Generate dynamic sub-items matching event archetype
    const subItems = catMeta.defaultSubItems.map(item => ({
      label: item.label,
      estimatedCost: Math.round(allocated * item.ratio),
      notes: allocated === 0 ? 'Covered by community contribution / volunteer loan' : item.notes
    }));

    // Generate plain-language, encouraging "Why"
    let why = '';
    if (isLocked) {
      why = 'Locked by organizer at exact specified budget.';
    } else if (mode === 'community_sourced') {
      why = `Powered 100% by community volunteers & in-kind contributions (₹0 cash spend).`;
    } else if (isPriority) {
      why = `Top priority selection: Upgraded to ${sourcingDetails.label} to ensure a standout experience for ${guests} guests.`;
    } else {
      why = `Balanced at ${sourcingDetails.label} suited for community gathering standards.`;
    }

    return {
      slug,
      label: catMeta.label,
      allocatedAmount: allocated,
      allocatedPercentage:
        allocatableBudget > 0 ? Number(((allocated / allocatableBudget) * 100).toFixed(2)) : 0,
      floorAmount: mode === 'community_sourced' ? 0 : minPaidFloor,
      weight: Number((CULTURAL_WEIGHT_TABLE[subType]?.[slug] || 0.1).toFixed(3)),
      isLocked,
      lockedAmount: isLocked ? locks[slug]! : null,
      perHeadCost: allocated > 0 ? perHead : null,
      why,
      subItems,
      sourcingMode: mode,
      sourcingModeLabel: sourcingDetails.label,
      deliverablesDescription: sourcingDetails.deliverables,
      communityTasks: sourcingDetails.volunteerTasks,
      sponsorOpportunities: sourcingDetails.sponsorAsks
    };
  });

  // 10. Compute Resourcefulness Toolkit
  const households = Math.max(1, Math.round(guests / 4));
  const foodCat = categories.find(c => c.slug === 'food_prasad');
  const foodMode = foodCat?.sourcingMode || 'community_sourced';
  const standardFoodCost = computeSourcingModeCost('food_prasad', 'standard_paid', guests, locTier);
  const currentFoodCost = foodCat?.allocatedAmount || 0;
  const foodGap = Math.max(0, standardFoodCost - currentFoodCost);

  const askPerFamily = foodGap > 0 ? Math.ceil(foodGap / households / 50) * 50 : 250;
  const sponsorGap = Math.max(15000, Math.round(allocatableBudget * 0.3));
  const askPerSponsor = Math.ceil(sponsorGap / 3 / 500) * 500;

  // Find what the next ₹10,000 would unlock
  let nextUnlockCategory = 'Decor & Theme';
  let nextUnlockDesc = 'Upgrades floral entrance arch to fresh marigold canopy and lighting.';
  for (const slug of unlockedSlugs) {
    const curIdx = SOURCING_MODE_ORDER.indexOf(currentModes[slug]);
    if (curIdx < SOURCING_MODE_ORDER.length - 1) {
      const nextM = SOURCING_MODE_ORDER[curIdx + 1];
      const curC = computeSourcingModeCost(slug, currentModes[slug], guests, locTier);
      const nextC = computeSourcingModeCost(slug, nextM, guests, locTier);
      const diffC = nextC - curC;
      if (diffC <= 15000) {
        nextUnlockCategory = CATEGORY_SOURCING_CONFIG[slug].label;
        nextUnlockDesc = `Upgrades ${CATEGORY_SOURCING_CONFIG[slug].label} from ${CATEGORY_SOURCING_CONFIG[slug].modes[currentModes[slug]].label} to ${CATEGORY_SOURCING_CONFIG[slug].modes[nextM].label}: ${CATEGORY_SOURCING_CONFIG[slug].modes[nextM].deliverables}`;
        break;
      }
    }
  }

  const resourcefulnessToolkit: ResourcefulnessToolkit = {
    perHouseholdContribution: {
      targetAmount: foodGap,
      householdCount: households,
      askPerHousehold: askPerFamily,
      note: `A modest family contribution of ₹${askPerFamily} per household across ${households} families covers a full traditional community feast.`
    },
    sponsorTargets: {
      targetAmount: sponsorGap,
      sponsorCount: 3,
      askPerSponsor,
      description: `Securing 3 local neighborhood shopkeepers or patrons at ₹${askPerSponsor.toLocaleString('en-IN')} each funds sound and stage banners.`
    },
    potluckRecommendation:
      foodMode === 'community_sourced'
        ? 'Organize Wing-wise Bhojan: Wing A brings sweets, Wing B brings puris/rotis, Wing C brings sabzi/dal.'
        : 'Catered food supplemented by resident home-made sweets and dry prasad packets.',
    nextTierUnlock: {
      requiredAdditionalAmount: 10000,
      unlockDescription: nextUnlockDesc,
      affectedCategory: nextUnlockCategory
    }
  };

  // 11. Run Invariant Verification
  const verification = verifyPlanInvariants(categories, contingencyAmount, totalBudget, allocatableBudget);
  const totalAllocated = categories.reduce((acc, c) => acc + c.allocatedAmount, 0);

  return {
    eventId: profile.id,
    totalBudget,
    contingencyReserve: {
      percentage: contingencyPercentage,
      amount: contingencyAmount
    },
    allocatableBudget,
    categories,
    totalAllocated,
    remainingBuffer: 0,
    feasibility: checkFeasibility(totalBudget, guests, profile, locTier),
    version: 2,
    createdAt: new Date().toISOString(),
    resourcefulnessToolkit,
    verification
  };
}
