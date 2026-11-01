// ============================================================================
// Event Co-pilot — Location Cost Configuration & Engine
//
// NOTE: These tiers and multipliers are ESTIMATED planning assumptions based
// on regional Indian community event benchmarks, NOT contractual market quotes.
// ============================================================================

import { BudgetCategorySlug } from '../types';

export type LocationTier = 'metro' | 'tier2' | 'small_town' | 'village';

export interface LocationTierConfig {
  tier: LocationTier;
  label: string;
  description: string;
  baseMultiplier: number;
  examples: string[];
}

export const LOCATION_TIERS: Record<LocationTier, LocationTierConfig> = {
  metro: {
    tier: 'metro',
    label: 'Metro City',
    description: 'Tier-1 Metros (High venue rentals, commercial AV & premium vendor rates ~35% above baseline)',
    baseMultiplier: 1.35,
    examples: [
      'bengaluru', 'bangalore', 'mumbai', 'bombay', 'delhi', 'new delhi', 'ncr', 'gurgaon', 'gurugram',
      'noida', 'chennai', 'madras', 'hyderabad', 'kolkata', 'calcutta', 'pune', 'ahmedabad'
    ]
  },
  tier2: {
    tier: 'tier2',
    label: 'Tier-2 City (Baseline)',
    description: 'Major regional cities and district capitals (Standard benchmark rate 1.0x)',
    baseMultiplier: 1.0,
    examples: [
      'jaipur', 'lucknow', 'indore', 'bhopal', 'nagpur', 'coimbatore', 'chandigarh', 'surat', 'vadodara',
      'patna', 'visakhapatnam', 'vizag', 'kochi', 'cochin', 'thiruvananthapuram', 'mysuru', 'mysore',
      'guwahati', 'bhubaneswar', 'dehradun', 'varanasi', 'nashik', 'rajkot', 'agra', 'madurai'
    ]
  },
  small_town: {
    tier: 'small_town',
    label: 'Small Town',
    description: 'Taluk headquarters, sub-districts and smaller municipal towns (~20% below baseline)',
    baseMultiplier: 0.8,
    examples: [
      'town', 'taluk', 'kasba', 'district town', 'ujjain', 'satara', 'kolhapur', 'hassan', 'shimoga',
      'alwar', 'ajmer', 'solapur', 'haldwani', 'roorkee', 'anand', 'nadiad', 'tirupati', 'salem'
    ]
  },
  village: {
    tier: 'village',
    label: 'Village / Rural',
    description: 'Rural villages and gram panchayats with community-owned grounds and volunteer power (~40% below baseline)',
    baseMultiplier: 0.6,
    examples: [
      'village', 'rural', 'gram', 'gaon', 'panchayat', 'dehat', 'basti', 'mohalla', 'kheda', 'pada', 'wadi'
    ]
  }
};

/**
 * Category-specific sensitivity to location cost changes.
 * 1.0 = scales 100% with location tier.
 * 0.4 = scales minimally (e.g. volunteers, community permissions).
 */
export const CATEGORY_LOCATION_SENSITIVITY: Record<BudgetCategorySlug, number> = {
  decor: 1.0,           // Professional floral & lighting rentals scale heavily in metros
  stage_sound: 1.0,     // AV, truss, and technician rates scale heavily
  photography: 1.0,     // Freelance photographer day rates vary dramatically
  performers: 0.9,      // Artist travel and performance fees scale with city tier
  venue_permissions: 0.8,// Commercial hall fees scale high, society grounds scale low
  safety: 0.7,          // Private security agency wages scale moderately
  food_prasad: 0.6,     // Raw food grain costs are national; caterer labor/equipment scales moderately
  volunteers: 0.4,      // Local volunteer refreshments and supplies vary minimally
  misc: 0.5             // Banners, printing, and incidentals
};

export interface LocationResolution {
  tier: LocationTier;
  label: string;
  baseMultiplier: number;
  description: string;
  isEstimated: boolean;
  matchedName: string;
}

/**
 * Maps free-text location to a structured LocationTier.
 * If unmatched, safely defaults to 'tier2' (baseline 1.0x).
 */
export function resolveLocationTier(locationText?: string): LocationResolution {
  if (!locationText || !locationText.trim()) {
    return {
      tier: 'tier2',
      label: LOCATION_TIERS.tier2.label,
      baseMultiplier: LOCATION_TIERS.tier2.baseMultiplier,
      description: LOCATION_TIERS.tier2.description,
      isEstimated: true,
      matchedName: 'Tier-2 Baseline (Default)'
    };
  }

  const normalized = locationText.toLowerCase().trim();

  // 1. Direct check against village/rural keywords
  for (const keyword of LOCATION_TIERS.village.examples) {
    if (normalized.includes(keyword)) {
      return {
        tier: 'village',
        label: LOCATION_TIERS.village.label,
        baseMultiplier: LOCATION_TIERS.village.baseMultiplier,
        description: LOCATION_TIERS.village.description,
        isEstimated: false,
        matchedName: locationText
      };
    }
  }

  // 2. Direct check against small town keywords
  for (const keyword of LOCATION_TIERS.small_town.examples) {
    if (normalized.includes(keyword)) {
      return {
        tier: 'small_town',
        label: LOCATION_TIERS.small_town.label,
        baseMultiplier: LOCATION_TIERS.small_town.baseMultiplier,
        description: LOCATION_TIERS.small_town.description,
        isEstimated: false,
        matchedName: locationText
      };
    }
  }

  // 3. Direct check against metro cities
  for (const metro of LOCATION_TIERS.metro.examples) {
    if (normalized.includes(metro)) {
      return {
        tier: 'metro',
        label: LOCATION_TIERS.metro.label,
        baseMultiplier: LOCATION_TIERS.metro.baseMultiplier,
        description: LOCATION_TIERS.metro.description,
        isEstimated: false,
        matchedName: locationText
      };
    }
  }

  // 4. Direct check against tier-2 cities
  for (const city of LOCATION_TIERS.tier2.examples) {
    if (normalized.includes(city)) {
      return {
        tier: 'tier2',
        label: LOCATION_TIERS.tier2.label,
        baseMultiplier: LOCATION_TIERS.tier2.baseMultiplier,
        description: LOCATION_TIERS.tier2.description,
        isEstimated: false,
        matchedName: locationText
      };
    }
  }

  // Default to tier-2 benchmark if unknown
  return {
    tier: 'tier2',
    label: LOCATION_TIERS.tier2.label,
    baseMultiplier: LOCATION_TIERS.tier2.baseMultiplier,
    description: 'Standard benchmark rate applied (city tier not explicitly recognized)',
    isEstimated: true,
    matchedName: locationText
  };
}

/**
 * Computes effective category multiplier:
 * 1.0 + (baseMultiplier - 1.0) * sensitivity
 */
export function getCategoryLocationMultiplier(tier: LocationTier, category: BudgetCategorySlug): number {
  const baseMultiplier = LOCATION_TIERS[tier].baseMultiplier;
  const sensitivity = CATEGORY_LOCATION_SENSITIVITY[category] ?? 0.8;
  const effective = 1.0 + (baseMultiplier - 1.0) * sensitivity;
  return Number(effective.toFixed(3));
}

