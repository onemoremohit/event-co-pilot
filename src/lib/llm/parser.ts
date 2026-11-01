import { BudgetCategorySlug, EventSubType, ExperienceTier } from '../types';
import { resolveLocationTier, detectLocationTierFromText, LOCATION_TIERS, LocationTier } from '../engine/location';

export interface ExtractedFields {
  eventName?: string;
  eventSubType?: EventSubType;
  eventDate?: string; // YYYY-MM-DD
  budgetAmount?: number;
  guestCount?: number;
  city?: string;
  locationTier?: LocationTier;
  isLocationUnknown?: boolean;
  experienceTier?: ExperienceTier;
  priorities?: BudgetCategorySlug[];
}

/**
 * Deterministic rule-based extractor for natural Indian event planning messages.
 * Only returns fields that are EXPLICITLY detected in the text, never fills defaults.
 */
export function extractFieldsFromText(text: string, baseDate = new Date()): ExtractedFields {
  const result: ExtractedFields = {};
  const lower = text.toLowerCase().trim();

  // 0. Negative & Zero budget checks
  const negativeMatch = lower.match(/(?:budget\s*(?:is|of)?\s*)?(-\s*\d[\d,]*|negative\s*\d+)/i);
  if (negativeMatch) {
    const rawVal = parseInt(negativeMatch[1].replace(/negative\s*/i, '-').replace(/[\s,]/g, ''), 10);
    if (!isNaN(rawVal) && rawVal < 0) {
      result.budgetAmount = rawVal;
    }
  }

  if (result.budgetAmount === undefined && (lower.includes('0 budget') || lower.includes('zero budget') || lower.match(/\bbudget\s*(?:is|of)?\s*0\b/))) {
    result.budgetAmount = 0;
  }

  // Written word numbers (e.g. "forty five thousand", "one lakh", "50k")
  if (result.budgetAmount === undefined) {
    const wordThousands = [
      { pattern: /\b(?:forty[- ]five)\s*thousand\b/i, val: 45000 },
      { pattern: /\b(?:twenty[- ]five)\s*thousand\b/i, val: 25000 },
      { pattern: /\b(?:thirty[- ]five)\s*thousand\b/i, val: 35000 },
      { pattern: /\b(?:seventy[- ]five)\s*thousand\b/i, val: 75000 },
      { pattern: /\b(?:ten)\s*thousand\b/i, val: 10000 },
      { pattern: /\b(?:fifteen)\s*thousand\b/i, val: 15000 },
      { pattern: /\b(?:twenty)\s*thousand\b/i, val: 20000 },
      { pattern: /\b(?:thirty)\s*thousand\b/i, val: 30000 },
      { pattern: /\b(?:forty)\s*thousand\b/i, val: 40000 },
      { pattern: /\b(?:fifty)\s*thousand\b/i, val: 50000 },
      { pattern: /\b(?:sixty)\s*thousand\b/i, val: 60000 },
      { pattern: /\b(?:seventy)\s*thousand\b/i, val: 70000 },
      { pattern: /\b(?:eighty)\s*thousand\b/i, val: 80000 },
      { pattern: /\b(?:ninety)\s*thousand\b/i, val: 90000 },
      { pattern: /\b(?:one|1)\s*lakh\b/i, val: 100000 },
      { pattern: /\b(?:two|2)\s*lakhs?\b/i, val: 200000 },
      { pattern: /\b(?:three|3)\s*lakhs?\b/i, val: 300000 },
      { pattern: /\b(?:four|4)\s*lakhs?\b/i, val: 400000 },
      { pattern: /\b(?:five|5)\s*lakhs?\b/i, val: 500000 },
      { pattern: /\b(?:ten|10)\s*lakhs?\b/i, val: 1000000 },
      { pattern: /\b(?:twenty[- ]five|25)\s*lakhs?\b/i, val: 2500000 },
    ];

    for (const item of wordThousands) {
      if (item.pattern.test(lower)) {
        result.budgetAmount = item.val;
        break;
      }
    }
  }

  // 1. Budget extraction (Lakhs, Crores, Thousands, Raw Numbers)
  // e.g. "4 lakh", "4.5 lakhs", "4L", "1.5L", "₹4,00,000", "50k", "50,000", "INR 400000"
  const lakhMatch = lower.match(/(?:(?:₹|rs\.?|inr|budget(?: of)?)\s*)?(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|l\b)/i);
  if (lakhMatch) {
    const val = parseFloat(lakhMatch[1]);
    if (!isNaN(val) && val > 0) {
      result.budgetAmount = Math.round(val * 100000);
    }
  }

  if (!result.budgetAmount) {
    const croreMatch = lower.match(/(?:(?:₹|rs\.?|inr|budget(?: of)?)\s*)?(\d+(?:\.\d+)?)\s*(?:crores?|cr\b)/i);
    if (croreMatch) {
      const val = parseFloat(croreMatch[1]);
      if (!isNaN(val) && val > 0) {
        result.budgetAmount = Math.round(val * 10000000);
      }
    }
  }

  if (!result.budgetAmount) {
    const kMatch = lower.match(/(?:(?:₹|rs\.?|inr|budget(?: of)?)\s*)?(\d+(?:\.\d+)?)\s*(?:k\b|thousands?)/i);
    if (kMatch) {
      const val = parseFloat(kMatch[1]);
      if (!isNaN(val) && val > 0) {
        result.budgetAmount = Math.round(val * 1000);
      }
    }
  }

  if (!result.budgetAmount) {
    const formattedMatch = lower.match(/(?:₹|rs\.?|inr)\s*([\d,]+)/i);
    if (formattedMatch) {
      const cleanNum = parseInt(formattedMatch[1].replace(/,/g, ''), 10);
      if (!isNaN(cleanNum) && cleanNum >= 5000) {
        result.budgetAmount = cleanNum;
      }
    }
  }

  if (!result.budgetAmount) {
    // Plain number like "budget is 400000" or "400000"
    const plainNumMatch = lower.match(/(?:budget\s*(?:is|of)?\s*)?(\b[1-9]\d{4,7}\b)/i);
    if (plainNumMatch) {
      const cleanNum = parseInt(plainNumMatch[1], 10);
      if (!isNaN(cleanNum)) {
        result.budgetAmount = cleanNum;
      }
    }
  }

  // 2. Guest Count extraction
  // e.g. "200 guests", "around 150 people", "60 attendees", "250 members", "make it 150 guests"
  if (lower.match(/\b(?:0|zero)\s*(?:guests?|people|attendees?|members?|pax)\b/i)) {
    result.guestCount = 0;
  }
  const guestMatch = lower.match(/(?:(?:around|approx|approximately|about|for|it)\s*)?(\d{1,4})\s*(?:guests?|people|attendees?|members?|residents?|persons?|pax)\b/i);
  if (guestMatch) {
    const count = parseInt(guestMatch[1], 10);
    if (!isNaN(count) && count > 0) {
      result.guestCount = count;
    }
  }

  if (!result.guestCount) {
    // Direct question answer: user just types a number like "200" or "60" or "150"
    const standaloneCount = lower.match(/^\s*(\d{2,4})\s*$/);
    if (standaloneCount) {
      const num = parseInt(standaloneCount[1], 10);
      if (!isNaN(num) && num >= 10 && num <= 5000) {
        // If budget is already known, a standalone 2-4 digit number is usually guest count
        result.guestCount = num;
      }
    }
  }

  // 3. Event Subtype & Event Name
  if (
    lower.includes('diwali') ||
    lower.includes('navratri') ||
    lower.includes('dandiya') ||
    lower.includes('garba') ||
    lower.includes('durga puja') ||
    lower.includes('puja') ||
    lower.includes('festival') ||
    lower.includes('mela') ||
    lower.includes('utsav')
  ) {
    result.eventSubType = 'festival';
    if (lower.includes('diwali')) result.eventName = 'Diwali Festival Celebration';
    else if (lower.includes('dandiya') || lower.includes('garba') || lower.includes('navratri')) result.eventName = 'Dandiya & Garba Night Festival';
    else if (lower.includes('durga puja')) result.eventName = 'Durga Puja Cultural Celebration';
    else result.eventName = 'Community Festival Celebration';
  } else if (
    lower.includes('cultural night') ||
    lower.includes('performance') ||
    lower.includes('dance') ||
    lower.includes('drama') ||
    lower.includes('talent show') ||
    lower.includes('musical')
  ) {
    result.eventSubType = 'cultural_night';
    result.eventName = 'Society Cultural Performance Night';
  } else if (
    lower.includes('neighborhood') ||
    lower.includes('society gathering') ||
    lower.includes('resident') ||
    lower.includes('annual day') ||
    lower.includes('get together') ||
    lower.includes('community gathering') ||
    lower.includes('society celebration')
  ) {
    result.eventSubType = 'neighborhood';
    result.eventName = 'Neighborhood Community Gathering';
  }

  // 4. Date and Relative Timeframes
  if (lower.includes('yesterday')) {
    const yesterday = new Date(baseDate.getTime() - 86400000);
    result.eventDate = yesterday.toISOString().split('T')[0];
  } else if (lower.includes('last week')) {
    const lastWeek = new Date(baseDate.getTime() - 7 * 86400000);
    result.eventDate = lastWeek.toISOString().split('T')[0];
  } else {
    const isoDateMatch = lower.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (isoDateMatch) {
      result.eventDate = isoDateMatch[1];
    }
  }

  if (!result.eventDate) {
    // Relative weeks: "in 6 weeks", "6 weeks", "3 weeks"
    const weeksMatch = lower.match(/(?:in\s*)?(\d+)\s*weeks?/i);
    if (weeksMatch) {
      const weeks = parseInt(weeksMatch[1], 10);
      const target = new Date(baseDate.getTime());
      target.setUTCDate(target.getUTCDate() + (weeks * 7));
      result.eventDate = target.toISOString().split('T')[0];
    }

    // Relative days: "in 20 days", "45 days"
    const daysMatch = lower.match(/(?:in\s*)?(\d+)\s*days?/i);
    if (!result.eventDate && daysMatch) {
      const days = parseInt(daysMatch[1], 10);
      const target = new Date(baseDate.getTime());
      target.setUTCDate(target.getUTCDate() + days);
      result.eventDate = target.toISOString().split('T')[0];
    }

    // Natural month-day: "15 December", "15th Dec", "December 15"
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    if (!result.eventDate) {
      // Format 1: "11th of Nov", "11 Nov", "15 December 2026"
      const dayMonthMatch = lower.match(/(\d{1,2})(?:st|nd|rd|th)?(?:\s+of)?\s+([a-z]+)(?:\s*,?\s*(\d{4}))?/i);
      // Format 2: "Nov 11", "November 11th", "Dec 15 2026"
      const monthDayMatch = lower.match(/([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?/i);

      let day: number | null = null;
      let mStr: string | null = null;
      let explicitYear: number | null = null;

      if (dayMonthMatch) {
        day = parseInt(dayMonthMatch[1], 10);
        mStr = dayMonthMatch[2].toLowerCase();
        if (dayMonthMatch[3]) explicitYear = parseInt(dayMonthMatch[3], 10);
      } else if (monthDayMatch) {
        mStr = monthDayMatch[1].toLowerCase();
        day = parseInt(monthDayMatch[2], 10);
        if (monthDayMatch[3]) explicitYear = parseInt(monthDayMatch[3], 10);
      }

      if (day && mStr) {
        let mIdx = months.indexOf(mStr);
        if (mIdx === -1) mIdx = shortMonths.indexOf(mStr);
        if (mIdx !== -1) {
          const year = explicitYear || baseDate.getUTCFullYear();
          const target = new Date(Date.UTC(year, mIdx, day));
          // If no explicit year was given and date has already passed in current year, roll over to next year
          if (!explicitYear && target < baseDate) {
            target.setUTCFullYear(year + 1);
          }
          result.eventDate = target.toISOString().split('T')[0];
        }
      }
    }
  }

  // 5. Location Extraction
  // 5a. Direct tier choice (typed or clicked, e.g. "Big metro", "Large city", "Small town", "Village")
  const detectedTier = detectLocationTierFromText(lower);
  if (detectedTier) {
    result.locationTier = detectedTier;
    const tierMeta = LOCATION_TIERS[detectedTier];
    result.city = tierMeta.label;
    result.isLocationUnknown = false;
  }

  // 5b. Search all cities in built-in comprehensive dictionary
  if (!result.city) {
    const allTiers = ['metro', 'tier2', 'small_town', 'village'] as const;
    outerLoop: for (const t of allTiers) {
      for (const ex of LOCATION_TIERS[t].examples) {
        // match whole word or phrase with word boundaries
        const regex = new RegExp(`\\b${ex.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lower)) {
          const capitalized = ex.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          result.city = capitalized;
          result.locationTier = t;
          result.isLocationUnknown = false;
          break outerLoop;
        }
      }
    }
  }

  // 5c. Match prefix pattern (e.g. "in Meerut", "at Ghaziabad", "location is Xyzpur")
  // OR standalone short city message (e.g. "Meerut", "Ghaziabad", "Noida", "Xyzpur")
  if (!result.city) {
    const locationPrefixMatch = lower.match(/(?:in|at|near|location\s*(?:is|:)?)\s+([a-z0-9\s,-]+?)(?:(?:\s+(?:for|on|with|budget|guests))|$)/i);
    let locationCandidate = locationPrefixMatch ? locationPrefixMatch[1].trim() : '';

    if (!locationCandidate && !result.budgetAmount && !result.guestCount && !result.eventDate && !result.eventSubType) {
      // Standalone user message answering "Which city are we planning in?"
      const words = lower.replace(/[.,!?]/g, '').trim().split(/\s+/);
      if (words.length >= 1 && words.length <= 4) {
        const candidateRaw = words.filter(w => !['city', 'in', 'at', 'near', 'the', 'is', 'it'].includes(w)).join(' ');
        if (candidateRaw.length >= 2 && !['yes', 'no', 'food', 'look', 'balanced', 'generate', 'plan'].includes(candidateRaw)) {
          locationCandidate = candidateRaw;
        }
      }
    }

    if (locationCandidate) {
      const cleaned = locationCandidate.split(/,|\band\b|\bwith\b/)[0].trim();
      if (cleaned.length >= 2 && !['december', 'weeks', 'days', 'lakh', 'guests', 'festival'].includes(cleaned)) {
        const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        result.city = capitalized;
        const res = resolveLocationTier(cleaned);
        result.locationTier = res.isUnknown ? undefined : res.tier;
        result.isLocationUnknown = res.isUnknown;
      }
    }
  }

  // 6. Experience Tier
  if (lower.includes('premium') || lower.includes('luxury') || lower.includes('grand') || lower.includes('high end')) {
    result.experienceTier = 'premium';
  } else if (lower.includes('normal') || lower.includes('standard') || lower.includes('budget') || lower.includes('simple')) {
    result.experienceTier = 'normal';
  }

  // 7. Priorities
  const detectedPriorities: BudgetCategorySlug[] = [];
  if (lower.includes('food') || lower.includes('prasad') || lower.includes('feast') || lower.includes('dinner')) {
    detectedPriorities.push('food_prasad');
  }
  if (lower.includes('sound') || lower.includes('stage') || lower.includes('audio') || lower.includes('mic')) {
    detectedPriorities.push('stage_sound');
  }
  if (lower.includes('decor') || lower.includes('lighting') || lower.includes('lights') || lower.includes('rangoli') || lower.includes('look')) {
    detectedPriorities.push('decor');
  }
  if (lower.includes('performer') || lower.includes('artist') || lower.includes('troupe') || lower.includes('dhol') || lower.includes('music')) {
    detectedPriorities.push('performers');
  }
  if (lower.includes('photo') || lower.includes('video') || lower.includes('camera')) {
    detectedPriorities.push('photography');
  }
  if (lower.includes('safety') || lower.includes('guard') || lower.includes('security')) {
    detectedPriorities.push('safety');
  }
  if (lower.includes('volunteer')) {
    detectedPriorities.push('volunteers');
  }

  if (detectedPriorities.length > 0) {
    result.priorities = detectedPriorities.slice(0, 2);
  }

  return result;
}

