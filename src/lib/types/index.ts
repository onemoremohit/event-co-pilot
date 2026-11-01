// ============================================================================
// Event Co-pilot — Core Type Definitions
// ============================================================================

// ---------------------------------------------------------------------------
// Event Profile
// ---------------------------------------------------------------------------

export type EventSubType = 'festival' | 'cultural_night' | 'neighborhood';

export type ExperienceTier = 'premium' | 'normal';

export type IntakeStatus = 'in_progress' | 'complete';

export interface GuestMix {
  family: number;   // percentage 0-100
  elders: number;
  kids: number;
  colleagues: number;
  friends: number;
}

export interface Priorities {
  top2: [BudgetCategorySlug, BudgetCategorySlug] | [BudgetCategorySlug] | [];
  notes: string;
}

export interface Location {
  city: string;
  region?: string;
  tier?: 'metro' | 'tier2' | 'small_town' | 'village';
  clarificationAsked?: boolean;
  isUnknown?: boolean;
}

export interface EventProfile {
  id: string;
  eventType: 'community'; // MVP: community only
  eventSubType: EventSubType;
  eventName: string;
  eventDate: string; // ISO-8601 date
  planningStartDate: string; // ISO-8601 date (defaults to today)
  totalBudget: {
    amount: number; // positive integer (paise internally for precision)
    currency: string; // default: 'INR'
  };
  guestCount: number;
  guestMix: GuestMix;
  experienceTier: ExperienceTier;
  priorities: Priorities;
  location: Location;
  specialRequirements: string[];
  profileCompleteness: number; // 0-100, computed
  intakeStatus: IntakeStatus;
  createdAt: string; // ISO-8601 datetime
  updatedAt: string; // ISO-8601 datetime
}

// Partial profile for incremental intake updates
export type PartialEventProfile = Partial<Omit<EventProfile, 'id' | 'createdAt' | 'updatedAt' | 'profileCompleteness'>>;

// ---------------------------------------------------------------------------
// Budget Categories (cultural community events)
// ---------------------------------------------------------------------------

export type BudgetCategorySlug =
  | 'venue_permissions'
  | 'stage_sound'
  | 'decor'
  | 'food_prasad'
  | 'performers'
  | 'volunteers'
  | 'safety'
  | 'photography'
  | 'misc';

export type SourcingMode =
  | 'community_sourced'
  | 'minimal_paid'
  | 'standard_paid'
  | 'enhanced_paid'
  | 'premium_paid';

export interface BudgetSubItem {
  label: string;
  estimatedCost: number;
  notes: string;
}

export interface BudgetCategory {
  slug: BudgetCategorySlug;
  label: string;
  allocatedAmount: number;
  allocatedPercentage: number;
  floorAmount: number;
  weight: number; // 0-1, computed
  isLocked: boolean;
  lockedAmount: number | null;
  perHeadCost: number | null;
  why: string;
  subItems: BudgetSubItem[];
  sourcingMode?: SourcingMode;
  sourcingModeLabel?: string;
  deliverablesDescription?: string;
  communityTasks?: string[];
  sponsorOpportunities?: string[];
}

export interface FeasibilityResult {
  isViable: boolean;
  perHeadBudget: number;
  warnings: string[];
  suggestions: string[];
}

export interface ResourcefulnessToolkit {
  perHouseholdContribution: {
    targetAmount: number;
    householdCount: number;
    askPerHousehold: number;
    note: string;
  };
  sponsorTargets: {
    targetAmount: number;
    sponsorCount: number;
    askPerSponsor: number;
    description: string;
  };
  potluckRecommendation: string;
  nextTierUnlock: {
    requiredAdditionalAmount: number;
    unlockDescription: string;
    affectedCategory: string;
  };
}

export interface PlanVerification {
  isVerified: boolean;
  invariantsChecked: {
    noNegative: boolean;
    exactSum: boolean;
    normalizedPercentages: boolean;
    perGuestValid: boolean;
  };
  badgeText: string;
  details: string;
}

export interface BudgetPlan {
  eventId: string;
  totalBudget: number;
  contingencyReserve: {
    percentage: number; // default: 10
    amount: number;
  };
  allocatableBudget: number;
  categories: BudgetCategory[];
  totalAllocated: number;
  remainingBuffer: number;
  feasibility: FeasibilityResult;
  version: number;
  createdAt: string;
  resourcefulnessToolkit?: ResourcefulnessToolkit;
  verification?: PlanVerification;
}

// ---------------------------------------------------------------------------
// Tasks & Dependency Graph
// ---------------------------------------------------------------------------

export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'at_risk' | 'skipped';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  eventId: string;
  category: BudgetCategorySlug;
  title: string;
  description: string;
  status: TaskStatus;
  deadline: string; // ISO-8601 date
  startDate: string; // ISO-8601 date
  leadTimeDays: number;
  durationDays: number;
  dependsOn: string[]; // task titles (resolved to IDs during scheduling)
  priority: TaskPriority;
  isRushFlagged: boolean;
  rushAlternative: string | null;
  assignee: string;
  why: string;
  createdAt: string;
}

export interface TaskGraph {
  eventId: string;
  tasks: Task[];
  criticalPath: string[]; // task IDs in order
  rushMode: boolean;
  rushThresholdDays: number;
  totalDaysAvailable: number;
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Vendor Checklist
// ---------------------------------------------------------------------------

export type VendorStatus = 'not_started' | 'enquiry_sent' | 'quote_received' | 'booked' | 'cancelled';

export interface VendorChecklistItem {
  id: string;
  eventId: string;
  category: BudgetCategorySlug;
  vendorType: string;
  status: VendorStatus;
  vendorName: string | null;
  estimatedBudget: number;
  quotedPrice: number | null;
  contactInfo: string | null;
  enquiryMessage: string | null;
  deadline: string; // ISO-8601 date
  notes: string;
  why: string;
}

// ---------------------------------------------------------------------------
// Scenario & Diff
// ---------------------------------------------------------------------------

export type DiffDirection = 'increase' | 'decrease' | 'unchanged';
export type DiffSeverity = 'info' | 'warning' | 'critical';

export interface Diff {
  category: string; // budget category slug, 'timeline', or 'overall'
  field: string;
  oldValue: number | string;
  newValue: number | string;
  delta: number | null;
  deltaPercentage: number | null;
  direction: DiffDirection;
  reason: string;
  severity: DiffSeverity;
}

export interface ScenarioInput {
  budget?: number | null;
  guestCount?: number | null;
  eventDate?: string | null;
  locationTier?: 'metro' | 'tier2' | 'small_town' | 'village' | null;
  lockedCategories: BudgetCategorySlug[];
  categoryOverrides?: Partial<Record<BudgetCategorySlug, number>>;
}

export interface Scenario {
  id: string;
  eventId: string;
  label: string;
  inputChanges: ScenarioInput;
  resultingPlan: BudgetPlan;
  resultingTasks: TaskGraph;
  diffs: Diff[];
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Chat Messages
// ---------------------------------------------------------------------------

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  eventId: string;
  role: ChatRole;
  content: string;
  structuredData?: Record<string, unknown> | null;
  timestamp: string;
  meta?: {
    provider?: string;
    model?: string;
    extractedSummary?: string | null;
  };
}

// ---------------------------------------------------------------------------
// Plan Style
// ---------------------------------------------------------------------------

export type PlanStyleId = 'food_first' | 'look_first' | 'balanced' | 'diy_max';

export interface PlanStyle {
  id: PlanStyleId;
  name: string;
  description: string;
  priorityCategories: BudgetCategorySlug[];
  /** DIY-Max is only offered when per-head budget is below this threshold */
  perHeadThreshold?: number;
}

// ---------------------------------------------------------------------------
// Run Sheet
// ---------------------------------------------------------------------------

export interface RunSheetEntry {
  id: string;
  eventId: string;
  time: string; // HH:MM format
  activity: string;
  responsible: string;
  notes: string;
  isUserEdited: boolean; // true = user manually edited, skip on re-plan
  status: 'pending' | 'done';
  sourceTaskId: string | null; // link to originating task
}

// ---------------------------------------------------------------------------
// Complete Event Plan (aggregate root)
// ---------------------------------------------------------------------------

export interface EventPlan {
  profile: EventProfile;
  budget: BudgetPlan;
  tasks: TaskGraph;
  vendors: VendorChecklistItem[];
  runSheet: RunSheetEntry[];
  chatHistory: ChatMessage[];
  scenarios: Scenario[];
}

