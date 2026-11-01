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
    label: 'Big Metro',
    description: 'Tier-1 Metros & NCR Satellites (High venue rentals, commercial AV & premium vendor rates ~35% above baseline)',
    baseMultiplier: 1.35,
    examples: [
      // Top Metros
      'bengaluru', 'bangalore', 'mumbai', 'bombay', 'navi mumbai', 'thane', 'kalyan', 'dombivli', 'vasai', 'virar',
      'delhi', 'new delhi', 'delhi ncr', 'ncr', 'central delhi', 'south delhi', 'north delhi', 'east delhi', 'west delhi',
      'chennai', 'madras', 'hyderabad', 'secunderabad', 'cyberabad',
      'kolkata', 'calcutta', 'howrah',
      'pune', 'pimpri', 'chinchwad', 'pimpri-chinchwad',
      'ahmedabad', 'gandhinagar',
      // Explicit NCR Satellite Cities (always Metro tier)
      'ghaziabad', 'noida', 'greater noida', 'gurgaon', 'gurugram', 'faridabad', 'manesar', 'sahibabad'
    ]
  },
  tier2: {
    tier: 'tier2',
    label: 'Large City',
    description: 'Major regional cities and district capitals (Standard benchmark rate 1.0x baseline)',
    baseMultiplier: 1.0,
    examples: [
      // Uttar Pradesh (including Meerut explicitly)
      'meerut', 'lucknow', 'kanpur', 'agra', 'varanasi', 'prayagraj', 'allahabad', 'bareilly',
      'aligarh', 'moradabad', 'saharanpur', 'gorakhpur', 'jhansi', 'mathura', 'firozabad', 'muzaffarnagar', 'ayodhya', 'faizabad',
      // Rajasthan
      'jaipur', 'jodhpur', 'kota', 'bikaner', 'udaipur', 'ajmer', 'bhilwara', 'alwar', 'sikar', 'pali', 'sri ganganagar',
      // Madhya Pradesh
      'indore', 'bhopal', 'jabalpur', 'gwalior', 'ujjain', 'sagar', 'dewas', 'satna', 'ratlam', 'rewa',
      // Maharashtra
      'nagpur', 'nashik', 'aurangabad', 'chhatrapati sambhajinagar', 'solapur', 'amravati', 'kolhapur',
      'akola', 'latur', 'dhule', 'ahmednagar', 'chandrapur', 'jalgaon', 'nanded', 'sangli',
      // Gujarat
      'surat', 'vadodara', 'baroda', 'rajkot', 'bhavnagar', 'jamnagar', 'junagadh',
      // Punjab, Haryana, Chandigarh
      'chandigarh', 'ludhiana', 'amritsar', 'jalandhar', 'patiala', 'bathinda', 'panipat', 'ambala',
      'yamunanagar', 'rohtak', 'hisar', 'karnal', 'sonipat', 'panchkula', 'mohali',
      // Tamil Nadu
      'coimbatore', 'madurai', 'tiruchirappalli', 'trichy', 'salem', 'tirunelveli', 'erode', 'vellore',
      'thoothukudi', 'tuticorin', 'dindigul', 'thanjavur', 'tiruppur',
      // Kerala
      'kochi', 'cochin', 'thiruvananthapuram', 'trivandrum', 'kozhikode', 'calicut', 'thrissur', 'kollam',
      'palakkad', 'alappuzha', 'alleppey', 'kannur', 'kottayam',
      // Andhra Pradesh & Telangana
      'visakhapatnam', 'vizag', 'vijayawada', 'guntur', 'nellore', 'kurnool', 'rajahmundry',
      'tirupati', 'kakinada', 'warangal', 'nizamabad', 'karimnagar',
      // Karnataka
      'mysuru', 'mysore', 'hubli', 'dharwad', 'hubli-dharwad', 'mangaluru', 'mangalore',
      'belgaum', 'belagavi', 'davanagere', 'bellary', 'ballari', 'gulbarga', 'kalaburagi', 'shivamogga', 'shimoga', 'tumkur',
      // Bihar & Jharkhand
      'patna', 'gaya', 'bhagalpur', 'muzaffarpur', 'purnia', 'darbhanga',
      'ranchi', 'jamshedpur', 'dhanbad', 'bokaro', 'deoghar', 'hazaribagh',
      // Odisha
      'bhubaneswar', 'cuttack', 'rourkela', 'berhampur', 'sambalpur', 'puri',
      // Chhattisgarh
      'raipur', 'bhilai', 'bilaspur', 'korba', 'durg',
      // Uttarakhand, Himachal & J&K
      'dehradun', 'haridwar', 'roorkee', 'haldwani', 'rudrapur', 'rishikesh', 'shimla', 'dharamshala', 'jammu', 'srinagar',
      // Assam & North East
      'guwahati', 'silchar', 'dibrugarh', 'jorhat', 'agartala', 'shillong', 'imphal', 'aizawl',
      // Goa & Others
      'panaji', 'margao', 'vasco', 'pondicherry', 'puducherry'
    ]
  },
  small_town: {
    tier: 'small_town',
    label: 'Smaller City / Town',
    description: 'Taluk headquarters, sub-districts and smaller municipal towns (~20% below baseline)',
    baseMultiplier: 0.8,
    examples: [
      // Generic Keywords
      'small town', 'smaller city', 'town', 'taluk', 'kasba', 'tehsil', 'mandi', 'district town', 'sub-district',
      // Specific towns
      'anand', 'nadiad', 'valsad', 'navsari', 'vapi', 'bharuch', 'mehsana', 'palanpur', 'morbi', 'surendranagar', 'godhra', 'dahod',
      'beawar', 'churu', 'jhunjhunu', 'tonk', 'kishangarh', 'sawai madhopur', 'hanumangarh', 'baran', 'banswara',
      'hapur', 'bulandshahr', 'sambhal', 'amroha', 'badaun', 'shahjahanpur', 'sitapur', 'lakhimpur', 'hardoi', 'unnao',
      'rae bareli', 'sultanpur', 'basti', 'deoria', 'ballia', 'ghazipur', 'jaunpur', 'mirzapur', 'banda', 'shamli',
      'rewari', 'sirsa', 'fatehabad', 'jind', 'kaithal', 'palwal', 'bahadurgarh',
      'satara', 'ratnagiri', 'sindhudurg', 'parbhani', 'jalna', 'wardha', 'gondia', 'yavatmal', 'osmanabad', 'beed',
      'hassan', 'udupi', 'mandya', 'chikkamagaluru', 'chikmagalur', 'karwar', 'bidar', 'raichur', 'koppal', 'gadag', 'bagalkot', 'bijapur',
      'kasaragod', 'idukki', 'pathanamthitta', 'wayanad', 'malappuram',
      'cuddalore', 'kanchipuram', 'tiruvannamalai', 'kumbakonam', 'rajapalayam', 'nagapattinam', 'karur',
      'anantapur', 'eluru', 'ongole', 'chittoor', 'machilipatnam', 'srikakulam', 'vizianagaram',
      'rajnandgaon', 'jagdalpur', 'ambikapur', 'dhamtari',
      'giridih', 'ramgarh', 'medininagar', 'chaibasa',
      'balasore', 'baripada', 'bhadrak', 'angul', 'jharsuguda',
      'tezpur', 'nagaon', 'tinsukia', 'bongaigaon',
      'solan', 'mandi', 'kullu', 'manali', 'bilaspur hp', 'chamba',
      'nainital', 'almora', 'pithoragarh', 'kashipur', 'chamoli'
    ]
  },
  village: {
    tier: 'village',
    label: 'Village / Rural Area',
    description: 'Rural villages and gram panchayats with community grounds and volunteer power (~40% below baseline)',
    baseMultiplier: 0.6,
    examples: [
      'village', 'rural', 'gram', 'gaon', 'panchayat', 'dehat', 'basti', 'mohalla', 'kheda', 'pada',
      'wadi', 'purva', 'tola', 'dhani', 'majra', 'hamlet', 'countryside', 'ancestral village', 'rural ground'
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
  isUnknown: boolean; // True when input city name could not be resolved against built-in dictionary
}

/**
 * Normalizes input text and detects if user selected or typed a location tier directly.
 */
export function detectLocationTierFromText(text: string): LocationTier | null {
  const lower = text.toLowerCase().trim();

  // 1. Direct button / option text matches
  if (
    lower.includes('big metro') ||
    lower.includes('delhi ncr, mumbai') ||
    lower.includes('option a') ||
    lower.match(/\b(?:big\s*)?metro\b/i) ||
    lower.match(/\btier[- ]?1\b/i)
  ) {
    return 'metro';
  }

  if (
    lower.includes('large city') ||
    lower.includes('jaipur, lucknow') ||
    lower.includes('option b') ||
    lower.match(/\blarge\s*city\b/i) ||
    lower.match(/\btier[- ]?2\b/i)
  ) {
    return 'tier2';
  }

  if (
    lower.includes('smaller city') ||
    lower.includes('small town') ||
    lower.includes('option c') ||
    lower.match(/\bsmaller\s*city\b/i) ||
    lower.match(/\bsmall\s*town\b/i) ||
    lower.match(/\btier[- ]?3\b/i)
  ) {
    return 'small_town';
  }

  if (
    lower.includes('village') ||
    lower.includes('rural area') ||
    lower.includes('option d') ||
    lower.match(/\bvillage\b/i) ||
    lower.match(/\brural\b/i) ||
    lower.match(/\bgaon\b/i) ||
    lower.match(/\bgram\b/i)
  ) {
    return 'village';
  }

  return null;
}

/**
 * Maps free-text location to a structured LocationTier.
 * If unmatched, returns isUnknown: true and defaults to 'tier2' (baseline 1.0x).
 */
export function resolveLocationTier(locationText?: string): LocationResolution {
  if (!locationText || !locationText.trim()) {
    return {
      tier: 'tier2',
      label: LOCATION_TIERS.tier2.label,
      baseMultiplier: LOCATION_TIERS.tier2.baseMultiplier,
      description: LOCATION_TIERS.tier2.description,
      isEstimated: true,
      matchedName: 'Tier-2 Baseline (Default)',
      isUnknown: true
    };
  }

  // 0. Direct tier check (e.g. if user clicked quick-reply or typed "small town")
  const directTier = detectLocationTierFromText(locationText);
  if (directTier) {
    return {
      tier: directTier,
      label: LOCATION_TIERS[directTier].label,
      baseMultiplier: LOCATION_TIERS[directTier].baseMultiplier,
      description: LOCATION_TIERS[directTier].description,
      isEstimated: false,
      matchedName: locationText,
      isUnknown: false
    };
  }

  const normalized = locationText.toLowerCase().trim().replace(/^(in|at|near|location\s*(?:is|:)?)\s+/i, '').trim();

  const isWordMatch = (target: string, pattern: string): boolean => {
    if (target === pattern) return true;
    const regex = new RegExp(`\\b${pattern.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    return regex.test(target);
  };

  // 1. Check against metro cities & NCR satellites (Ghaziabad, Noida, Gurgaon, Gurugram, etc.) FIRST
  for (const metro of LOCATION_TIERS.metro.examples) {
    if (isWordMatch(normalized, metro)) {
      return {
        tier: 'metro',
        label: LOCATION_TIERS.metro.label,
        baseMultiplier: LOCATION_TIERS.metro.baseMultiplier,
        description: LOCATION_TIERS.metro.description,
        isEstimated: false,
        matchedName: locationText,
        isUnknown: false
      };
    }
  }

  // 2. Check against large tier-2 cities (Meerut, Jaipur, Lucknow, etc.)
  for (const city of LOCATION_TIERS.tier2.examples) {
    if (isWordMatch(normalized, city)) {
      return {
        tier: 'tier2',
        label: LOCATION_TIERS.tier2.label,
        baseMultiplier: LOCATION_TIERS.tier2.baseMultiplier,
        description: LOCATION_TIERS.tier2.description,
        isEstimated: false,
        matchedName: locationText,
        isUnknown: false
      };
    }
  }

  // 3. Check against small town list
  for (const town of LOCATION_TIERS.small_town.examples) {
    if (isWordMatch(normalized, town)) {
      return {
        tier: 'small_town',
        label: LOCATION_TIERS.small_town.label,
        baseMultiplier: LOCATION_TIERS.small_town.baseMultiplier,
        description: LOCATION_TIERS.small_town.description,
        isEstimated: false,
        matchedName: locationText,
        isUnknown: false
      };
    }
  }

  // 4. Check against village/rural keywords
  for (const keyword of LOCATION_TIERS.village.examples) {
    if (isWordMatch(normalized, keyword)) {
      return {
        tier: 'village',
        label: LOCATION_TIERS.village.label,
        baseMultiplier: LOCATION_TIERS.village.baseMultiplier,
        description: LOCATION_TIERS.village.description,
        isEstimated: false,
        matchedName: locationText,
        isUnknown: false
      };
    }
  }

  // Unmatched / Unknown city
  return {
    tier: 'tier2',
    label: LOCATION_TIERS.tier2.label,
    baseMultiplier: LOCATION_TIERS.tier2.baseMultiplier,
    description: 'City not in local database; standard benchmark applied',
    isEstimated: true,
    matchedName: locationText,
    isUnknown: true
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
