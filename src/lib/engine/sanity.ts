import { EventSubType } from '../types';

export interface SanityCheckResult {
  status: 'absurd' | 'suspicious' | 'tight_workable' | 'comfortable' | 'generous';
  isAbsurd: boolean;
  isTightWorkable: boolean;
  humanMessage: string;
  nearestWorkableOption?: {
    maxFeasibleGuests: number;
    suggestedPlan: string;
    estimatedMinBudget: number;
  };
  flags: string[];
}

export const SANITY_CONFIG = {
  MIN_ABSOLUTE_BUDGET: 2000,       // Below ₹2,000 is plainly absurd for any organized celebration
  MIN_PER_GUEST_BUDGET: 5,         // Below ₹5 per guest cannot even cover basic drinking water & waste bags
  TIGHT_WORKABLE_MIN: 5000,        // ₹5,000 - ₹15,000: tight but completely workable through community power
  TIGHT_WORKABLE_MAX: 15000,
  COMFORTABLE_PER_HEAD_BASELINE: 250, // Per-head baseline for modest community dinner
  MAX_GUESTS_BOUND: 10000,         // Above 10,000 guests requires civic municipal disaster clearance
  DEFAULT_CONTRIBUTION_HOUSEHOLD: 250 // Typical community contribution per family
};

/**
 * Evaluates inputs with empathy, realism, and kindness like an experienced community elder.
 * Never shames, never lectures, and never crashes on absurd data.
 */
export function evaluateInputSanity(
  budgetAmount: number | undefined | null,
  guestCount: number | undefined | null,
  eventDate?: string | null,
  subType: EventSubType = 'festival'
): SanityCheckResult {
  const flags: string[] = [];
  const rawBudget = budgetAmount ?? 0;
  const rawGuests = guestCount ?? 0;

  // Check 1: Zero or Negative budget
  if (budgetAmount !== undefined && budgetAmount !== null && rawBudget <= 0) {
    flags.push('zero_or_negative_budget');
    return {
      status: 'absurd',
      isAbsurd: true,
      isTightWorkable: false,
      humanMessage:
        "It looks like the budget amount entered is zero or negative. Even a purely volunteer-powered community celebration needs a tiny starting amount (or ₹0 cash with raw grain contributions). Could you confirm how much starting cash your committee has?",
      flags
    };
  }

  // Check 2: Zero or Negative guests
  if (guestCount !== undefined && guestCount !== null && rawGuests <= 0) {
    flags.push('zero_or_negative_guests');
    return {
      status: 'absurd',
      isAbsurd: true,
      isTightWorkable: false,
      humanMessage:
        "We need at least a small group of attendees to organize an event! How many families or neighbors do you anticipate joining the celebration?",
      flags
    };
  }

  // Check 3: Date in the past
  if (eventDate) {
    const parsedDate = new Date(eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!isNaN(parsedDate.getTime()) && parsedDate < today) {
      flags.push('past_date');
      return {
        status: 'suspicious',
        isAbsurd: false,
        isTightWorkable: false,
        humanMessage:
          `The date you entered (${eventDate}) appears to be in the past. Are you planning for an upcoming date, or perhaps recording notes for a past gathering?`,
        flags
      };
    }
  }

  // Check 4: Unreasonably massive gathering (> 10,000 guests)
  if (rawGuests > SANITY_CONFIG.MAX_GUESTS_BOUND) {
    flags.push('massive_crowd');
    return {
      status: 'suspicious',
      isAbsurd: false,
      isTightWorkable: false,
      humanMessage:
        `An event for ${rawGuests.toLocaleString('en-IN')} attendees is at the scale of a major municipal district rally requiring civic police permits, transit diversions, and formal disaster response teams. Could you verify if ${rawGuests} is the intended guest count?`,
      flags
    };
  }

  // Check 5: Plainly Absurd budget (< ₹2,000 absolute, OR < ₹5 per guest)
  // e.g. ₹800 for 100 guests = ₹8/guest, or ₹1,500 for 500 guests
  const perHead = rawGuests > 0 ? rawBudget / rawGuests : rawBudget;
  const isAbsurdlyLowBudget = rawBudget > 0 && rawBudget < SANITY_CONFIG.MIN_ABSOLUTE_BUDGET;
  const isAbsurdlyLowPerHead = rawBudget > 0 && rawGuests > 20 && perHead < SANITY_CONFIG.MIN_PER_GUEST_BUDGET;

  if (isAbsurdlyLowBudget || isAbsurdlyLowPerHead) {
    flags.push('absurd_budget_ratio');
    // Calculate nearest workable option
    // For rawBudget, how many guests could be hosted at ₹50/head for simple tea + biscuit + volunteer hall?
    const maxFeasible = Math.max(5, Math.floor(rawBudget / 40));
    return {
      status: 'absurd',
      isAbsurd: true,
      isTightWorkable: false,
      humanMessage:
        `₹${rawBudget.toLocaleString('en-IN')} is really not enough to host an event for ${rawGuests || 'a group of'} people, even a very simple one. Could you check the amount? Or tell me whether this is only a small starting amount and there is more coming from donations or families, and I'll help you plan around it.`,
      nearestWorkableOption: {
        maxFeasibleGuests: maxFeasible,
        suggestedPlan: `Intimate society tea gathering of ~${maxFeasible} neighbors with home-made snacks and borrowed bluetooth speaker.`,
        estimatedMinBudget: Math.max(5000, Math.round(rawGuests * 45))
      },
      flags
    };
  }

  // Check 6: Very Tight but Workable (₹5,000 to ₹15,000 or per head between ₹20 and ₹100)
  if (
    (rawBudget >= SANITY_CONFIG.TIGHT_WORKABLE_MIN && rawBudget <= SANITY_CONFIG.TIGHT_WORKABLE_MAX) ||
    (rawGuests > 0 && perHead < 120)
  ) {
    flags.push('tight_workable');
    return {
      status: 'tight_workable',
      isAbsurd: false,
      isTightWorkable: true,
      humanMessage:
        `This is tight, and it can still work wonderfully if the community pitches in! We will design a full volunteer-powered, community-sourced blueprint where borrowed gear, volunteer talent, and potluck/prasad contributions stretch every rupee.`,
      flags
    };
  }

  // Check 7: Generous or Comfortable
  if (perHead >= 1000) {
    return {
      status: 'generous',
      isAbsurd: false,
      isTightWorkable: false,
      humanMessage:
        `With ₹${rawBudget.toLocaleString('en-IN')} for ${rawGuests} guests (₹${Math.round(perHead)}/head), your committee has ample financial flexibility to support high quality sound, catered dining, and professional performances.`,
      flags
    };
  }

  return {
    status: 'comfortable',
    isAbsurd: false,
    isTightWorkable: false,
    humanMessage:
      `Balanced and practical budget of ₹${rawBudget.toLocaleString('en-IN')} for ${rawGuests} guests. Perfectly suited for a memorable celebration with standard sound, decor, and delicious community prasad.`,
    flags
  };
}

