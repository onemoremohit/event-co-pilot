import { BudgetCategorySlug, EventSubType, ExperienceTier } from '../types';
import { resolveLocationTier, LocationTier } from '../engine/location';

export interface ExtractedFields {
  eventName?: string;
  eventSubType?: EventSubType;
  eventDate?: string; // YYYY-MM-DD
  budgetAmount?: number;
  guestCount?: number;
  city?: string;
  locationTier?: LocationTier;
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
    lower.includes('durga puja') ||
    lower.includes('puja') ||
    lower.includes('festival') ||
    lower.includes('mela') ||
    lower.includes('utsav')
  ) {
    result.eventSubType = 'festival';
    if (lower.includes('diwali')) result.eventName = 'Diwali Festival Celebration';
    else if (lower.includes('navratri')) result.eventName = 'Navratri Garba & Dandiya Festival';
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
  // e.g. "2026-12-15", "15 December", "15th Dec", "in 6 weeks", "in 3 weeks", "in 20 days"
  const isoDateMatch = lower.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoDateMatch) {
    result.eventDate = isoDateMatch[1];
  } else {
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
      const dayMonthMatch = lower.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)/i);
      if (dayMonthMatch) {
        const day = parseInt(dayMonthMatch[1], 10);
        const mStr = dayMonthMatch[2].toLowerCase();
        let mIdx = months.indexOf(mStr);
        if (mIdx === -1) mIdx = shortMonths.indexOf(mStr);
        if (mIdx !== -1) {
          const year = baseDate.getUTCFullYear();
          const target = new Date(Date.UTC(year, mIdx, day));
          if (target < baseDate) {
            target.setUTCFullYear(year + 1);
          }
          result.eventDate = target.toISOString().split('T')[0];
        }
      }
    }
  }

  // 5. Location Extraction
  // Look for "in [City]", "at [City]", "location [City]", or known city/village words
  const locationPrefixMatch = lower.match(/(?:in|at|location\s*(?:is|:)?)\s+([a-z0-9\s,-]+?)(?:(?:\s+(?:for|on|with|budget|guests))|$)/i);
  let locationCandidate = locationPrefixMatch ? locationPrefixMatch[1].trim() : '';

  // Direct check for village / rural / small town in text
  if (lower.includes('village') || lower.includes('rural') || lower.includes('gaon') || lower.includes('gram')) {
    result.city = 'Village Community Ground';
    result.locationTier = 'village';
  } else if (lower.includes('small town') || lower.includes('town')) {
    result.city = 'Town Community Center';
    result.locationTier = 'small_town';
  } else if (locationCandidate) {
    // Clean up candidate
    const cleaned = locationCandidate.split(/,|\band\b|\bwith\b/)[0].trim();
    if (cleaned.length >= 3 && !['december', 'weeks', 'days', 'lakh', 'guests', 'festival'].includes(cleaned)) {
      result.city = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      const res = resolveLocationTier(cleaned);
      result.locationTier = res.tier;
    }
  } else {
    // Check known city names in text
    const knownCities = [
      'bengaluru', 'bangalore', 'mumbai', 'delhi', 'pune', 'chennai', 'hyderabad', 'kolkata',
      'jaipur', 'lucknow', 'indore', 'nagpur', 'coimbatore', 'chandigarh', 'ahmedabad', 'surat'
    ];
    for (const city of knownCities) {
      if (lower.includes(city)) {
        result.city = city.charAt(0).toUpperCase() + city.slice(1);
        result.locationTier = resolveLocationTier(city).tier;
        break;
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
