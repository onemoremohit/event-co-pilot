# Event Co-pilot — Master Plan (Cultural Community Events)

> **Version:** 2.0-approved  
> **Date:** 2026-10-31  
> **Status:** APPROVED — Phase 2 in active progress.

---

## Table of Contents

1. [Methodology & Milestones](#1-methodology--milestones)
2. [Architecture](#2-architecture)
3. [Data Models](#3-data-models)
4. [Algorithms](#4-algorithms)
5. [LLM Design & Provider Architecture](#5-llm-design--provider-architecture)
6. [Screens & User Flow](#6-screens--user-flow)
7. [Testing & Verification](#7-testing--verification)
8. [Deployment & Environment Setup](#8-deployment--environment-setup)
9. [Decision Log](#9-decision-log)

---

## 1. Methodology & Milestones

### Approach
Vertical-slice delivery deployed continuously to **Vercel** via GitHub.
- **Milestone 0 delivers a deployed skeleton** on Vercel immediately.
- Every subsequent milestone keeps all tests green and redeploys a working state.
- Deterministic logic (budget math, scheduling, diff) is isolated into pure, standalone modules with 100% test coverage and zero LLM dependencies.

### Milestone Roadmap

| # | Milestone | Scope | Deliverables & Verification |
|---|---|---|---|
| **M0** | **Project Scaffold & Vercel Deploy** | Next.js App Router, Tailwind CSS, TypeScript, Zod, Vitest, Lucide icons, GitHub repository & initial Vercel deployment. | Deployed working skeleton URL, clean build, base layout. |
| **M1** | **Deterministic Plan Engine** | `BudgetAllocator`, `TimelineScheduler`, `VendorChecklistEngine`. Floor costs, weights, contingency (10%), backward scheduling, rush mode. | 100% test coverage in Vitest. Pure functions, no LLM. |
| **M2** | **Scenario Engine & Diff Logic** | `ScenarioEngine.recompute()`, category locks, incremental diff computation, deterministic reason generator. | Automated unit tests covering all edge cases (budget spikes, guest count changes, date compression). |
| **M3** | **LLM Provider & Intake Layer** | Provider interface (`LLMProvider`) with `GeminiProvider` and `MockLLMProvider`. Structured schema outputs via Zod, feasibility checks, candidate plans ("Food-first", "Look-first", "Balanced", conditional "DIY-Max"). | Intake API route `/api/chat`, automatic fallback to Mock mode on error/timeout/rate-limit. |
| **M4** | **Chat Intake UI + Live Profile Panel** | Split-screen conversational intake, live updating event profile card, candidate plan style selection, "Play Demo" button. | Interactive intake flow, real-time reactive profile card, responsive drawer for mobile. |
| **M5** | **Event Dashboard** | Budget breakdown (donut chart + category table with "Why" lines and floors), backward timeline with rush indicators, vendor checklist with status badges. | Full visual inspection, keyboard navigation, clear empty & loading states. |
| **M6** | **What-If Scenario Panel & Visual Diff** | Slider controls (budget, guests, event date), category locks (🔒), side-by-side diff table with percentage deltas and human reasons. | Real-time recompute (<50ms), locked category preservation, commit to current plan. |
| **M7** | **Vendor Message Generator & Execution** | One-click tailored vendor enquiry messages (Caterer/Prasad, Stage/Sound, Decor, Security, etc.) with copy-to-clipboard and customizable templates. | Vendor enquiry modal with pre-filled event specs and budget ranges (±15%). |
| **M8** | **Task Board & Day-of Run Sheet** | Interactive task board with status transitions, and an auto-generated day-of run sheet with editable time slots (user-edited slots preserved across re-plans). | Printable run sheet, manual time-slot override, status tracking. |
| **M9** | **Priya Demo Script & Final Polish** | End-to-end "Play Demo" automated runner for Priya's Cultural Festival (200 guests, 4L, 6 weeks → +50 guests rebalance), accessibility audit, documentation. | Live demo passes end-to-end, README, verified Vercel production deployment. |

---

## 2. Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT BROWSER                                │
│                                                                         │
│   ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────┐   │
│   │   Intake Chat    │  │  Live Profile    │  │  "Play Demo" Auto   │   │
│   │   + Plan Styles  │  │  Summary Card    │  │  Scripted Runner    │   │
│   └────────┬─────────┘  └────────┬─────────┘  └──────────┬──────────┘   │
│            │                     │                       │              │
│   ┌────────┴─────────────────────┴───────────────────────┴──────────┐   │
│   │           React Event Context & State Management                │   │
│   └────────┬─────────────────────┬───────────────────────┬──────────┘   │
│            │                     │                       │              │
│   ┌────────┴─────────┐  ┌────────┴─────────┐  ┌──────────┴──────────┐   │
│   │    Dashboard     │  │  What-If Panel   │  │  Task Board & Run   │   │
│   │  (Budget/Time)   │  │  + Live Diff     │  │  Sheet (Override)   │   │
│   └──────────────────┘  └──────────────────┘  └─────────────────────┘   │
│                                  │                                      │
│                     ┌────────────┴────────────┐                         │
│                     │ Storage Repository      │                         │
│                     │ (localStorage Adapter)  │                         │
│                     └─────────────────────────┘                         │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │ HTTPS / Next.js API Routes
┌──────────────────────────────────┴──────────────────────────────────────┐
│                    NEXT.JS SERVER / API ROUTES                          │
│                                                                         │
│   /api/chat          — Intake chat & profile extraction                 │
│   /api/plan/generate — Full plan generation & explanation               │
│   /api/plan/recompute— Scenario engine recalculation & diff             │
│   /api/vendor/message— Tailored vendor enquiry generation               │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                   DETERMINISTIC PLAN ENGINE                     │   │
│   │                                                                 │   │
│   │   • BudgetAllocator (Weights x Sub-type x Tier x Priorities)   │   │
│   │   • TimelineScheduler (Backward DAG, Rush Mode, Compress)       │   │
│   │   • VendorChecklistEngine (Cultural Vendor Presets & Items)    │   │
│   │   • ScenarioEngine (Category Locks, Delta & Reason Diff)        │   │
│   └────────────────────────────────┬────────────────────────────────┘   │
│                                    │                                    │
│   ┌────────────────────────────────┴────────────────────────────────┐   │
│   │                    LLM PROVIDER ABSTRACTION                     │   │
│   │                                                                 │   │
│   │   ┌───────────────────────────┐   ┌─────────────────────────┐   │   │
│   │   │    GeminiProvider         │   │    MockLLMProvider      │   │   │
│   │   │    (Google Gemini API)    │   │    (Instant / Offline / │   │   │
│   │   │    JSON Schema Mode       │   │     Fallback / Tests)   │   │   │
│   │   └───────────────────────────┘   └─────────────────────────┘   │   │
│   │                                                                 │   │
│   │   * Zod Schema Validation & Automatic Fallback to Mock *        │   │
│   └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Strict Separation: LLM vs. Deterministic Code

| Responsibility | Component | Mechanism |
|---|---|---|
| User intake empathy & dialogue | LLM (`IntakeAgent`) | Natural language conversational flow |
| Event profile entity extraction | LLM + Zod | JSON schema structured response |
| Per-head feasibility & arithmetic | **Deterministic** | `budget ÷ guests >= floor` |
| Budget calculation & rebalancing | **Deterministic** | Base weights × Tier × Priority boost + Floors |
| Backward scheduling & rush mode | **Deterministic** | DAG topological backward sort from event date |
| Vendor requirements generation | **Deterministic** | Sub-type template generator |
| Scenario recomputation & delta diff | **Deterministic** | Pure function `recompute(plan, delta, locks)` |
| Decision "Why" justifications | LLM (`ExplainAgent`) | One-line natural explanation from pure facts |
| Vendor outreach message drafting | LLM (`VendorAgent`) | Contextual letter generator |
| Demo script chat messages | Scripted Driver | Pre-defined intake replies fed to engine |

---

## 3. Data Models

### 3.1 EventProfile (Cultural Community Scope)

```json
{
  "id": "uuid-v4",
  "eventType": "community",
  "eventSubType": "festival | cultural_night | neighborhood",
  "eventName": "Gokuldham Society Diwali Celebration 2026",
  "eventDate": "2026-12-15",
  "planningStartDate": "2026-11-01",
  "totalBudget": {
    "amount": 400000,
    "currency": "INR"
  },
  "guestCount": 200,
  "guestMix": {
    "family": 50,
    "elders": 25,
    "kids": 20,
    "colleagues": 0,
    "friends": 5
  },
  "experienceTier": "normal",
  "priorities": {
    "top2": ["food_prasad", "stage_sound"],
    "notes": "Great sound system for cultural programs and authentic prasad dinner."
  },
  "location": {
    "city": "Bengaluru",
    "region": "Karnataka"
  },
  "specialRequirements": ["Puja stage", "Senior citizen seating near stage"],
  "profileCompleteness": 100,
  "intakeStatus": "complete",
  "createdAt": "2026-10-31T17:00:00.000Z",
  "updatedAt": "2026-10-31T17:05:00.000Z"
}
```

### 3.2 BudgetPlan

```json
{
  "eventId": "uuid-v4",
  "totalBudget": 400000,
  "contingencyReserve": {
    "percentage": 10,
    "amount": 40000
  },
  "allocatableBudget": 360000,
  "categories": [
    {
      "slug": "food_prasad",
      "label": "Food & Prasad",
      "allocatedAmount": 105000,
      "allocatedPercentage": 29.17,
      "floorAmount": 50000,
      "weight": 0.28,
      "isLocked": false,
      "lockedAmount": null,
      "perHeadCost": 525,
      "why": "Top priority selection scaled for 200 community attendees.",
      "subItems": [
        { "label": "Community Dinner Feast", "estimatedCost": 80000, "notes": "Buffet setup" },
        { "label": "Prasad & Sweets", "estimatedCost": 25000, "notes": "Special traditional sweets" }
      ]
    }
  ],
  "totalAllocated": 360000,
  "remainingBuffer": 0,
  "feasibility": {
    "isViable": true,
    "perHeadBudget": 2000,
    "warnings": [],
    "suggestions": ["Budget is healthy for a high-quality community celebration."]
  },
  "version": 1,
  "createdAt": "2026-10-31T17:05:00.000Z"
}
```

### 3.3 Task & Dependency Graph

```json
{
  "eventId": "uuid-v4",
  "tasks": [
    {
      "id": "t-1",
      "eventId": "uuid-v4",
      "category": "venue_permissions",
      "title": "Secure Society Clubhouse & Police / Sound Permissions",
      "description": "File permission request for outdoor loudspeaker and society hall booking.",
      "status": "pending",
      "startDate": "2026-11-01",
      "deadline": "2026-11-10",
      "leadTimeDays": 42,
      "durationDays": 9,
      "dependsOn": [],
      "priority": "critical",
      "isRushFlagged": false,
      "rushAlternative": null,
      "assignee": "Society Secretary",
      "why": "Permissions dictate whether sound amplifiers and stage can be installed."
    }
  ],
  "criticalPath": ["t-1", "t-2", "t-5"],
  "rushMode": false,
  "rushThresholdDays": 45,
  "totalDaysAvailable": 44,
  "warnings": []
}
```

### 3.4 Day-of Run Sheet Entry

```json
{
  "id": "rs-1",
  "eventId": "uuid-v4",
  "time": "16:00",
  "activity": "Stage, AV and Sound Check with Performers",
  "responsible": "Sound Vendor + Cultural Lead",
  "notes": "Verify wireless microphones and monitor speakers",
  "isUserEdited": false,
  "status": "pending",
  "sourceTaskId": "t-sound-check"
}
```

---

## 4. Algorithms

### 4.1 Cultural Event Weight Tables

Base weights across the 3 cultural sub-types:

```typescript
export const CULTURAL_WEIGHT_TABLE = {
  festival: {
    venue_permissions: 0.12,
    stage_sound: 0.14,
    decor: 0.18,
    food_prasad: 0.25,
    performers: 0.10,
    volunteers: 0.05,
    safety: 0.06,
    photography: 0.06,
    misc: 0.04
  },
  cultural_night: {
    venue_permissions: 0.12,
    stage_sound: 0.22,
    decor: 0.12,
    food_prasad: 0.18,
    performers: 0.18,
    volunteers: 0.04,
    safety: 0.05,
    photography: 0.06,
    misc: 0.03
  },
  neighborhood: {
    venue_permissions: 0.10,
    stage_sound: 0.10,
    decor: 0.15,
    food_prasad: 0.30,
    performers: 0.08,
    volunteers: 0.08,
    safety: 0.07,
    photography: 0.06,
    misc: 0.06
  }
};
```

### 4.2 Floor Cost Thresholds (INR)

```typescript
export const FLOOR_PER_HEAD: Record<string, { normal: number; premium: number }> = {
  food_prasad: { normal: 250, premium: 500 },
  safety: { normal: 30, premium: 70 },
  volunteers: { normal: 20, premium: 40 }
};

export const FLOOR_FIXED: Record<string, { normal: number; premium: number }> = {
  venue_permissions: { normal: 15000, premium: 35000 },
  stage_sound: { normal: 25000, premium: 55000 },
  decor: { normal: 20000, premium: 50000 },
  performers: { normal: 15000, premium: 45000 },
  photography: { normal: 10000, premium: 25000 },
  misc: { normal: 5000, premium: 12000 }
};
```

### 4.3 Allocation Engine Pseudocode

```typescript
function allocateBudget(profile: EventProfile, locks: CategoryLockMap = {}): BudgetPlan {
  const total = profile.totalBudget.amount;
  const guests = profile.guestCount;
  const tier = profile.experienceTier;
  const subType = profile.eventSubType;

  // 1. Fixed 10% contingency off the top
  const contingencyAmount = Math.round(total * 0.10);
  const allocatable = total - contingencyAmount;

  // 2. Compute minimum floor cost for each category
  const categories = getCategoriesForSubType(subType);
  const floors: Record<BudgetCategorySlug, number> = {};
  for (const cat of categories) {
    if (FLOOR_PER_HEAD[cat]) {
      floors[cat] = FLOOR_PER_HEAD[cat][tier] * guests;
    } else {
      floors[cat] = FLOOR_FIXED[cat][tier];
    }
  }

  const totalFloor = Object.values(floors).reduce((a, b) => a + b, 0);
  if (totalFloor > allocatable) {
    return createInfeasiblePlan(total, totalFloor, allocatable, profile);
  }

  // 3. Base weights and priority boosting
  const weights = { ...CULTURAL_WEIGHT_TABLE[subType] };
  for (const p of profile.priorities.top2) {
    if (weights[p]) weights[p] *= 1.5;
  }

  // 4. Guest mix adjustments (e.g. elders -> safety/comfort, kids -> performers/decor)
  if (profile.guestMix.elders > 20) {
    weights.safety *= 1.25;
    weights.food_prasad *= 1.1;
  }
  if (profile.guestMix.kids > 20) {
    weights.performers *= 1.2;
    weights.decor *= 1.15;
  }

  // 5. Handle locked categories
  let lockedTotal = 0;
  let remainingWeights = 0;
  for (const cat of categories) {
    if (locks[cat] !== undefined) {
      lockedTotal += locks[cat];
    } else {
      remainingWeights += weights[cat];
    }
  }

  const poolAboveFloors = (allocatable - lockedTotal) - getUnlockedFloorsTotal(categories, locks, floors);

  // 6. Allocate exactly and round to integer
  // (Ensuring sum equals allocatable budget exactly)
  ...
}
```

### 4.4 Backward Scheduling & Rush Mode

```typescript
function scheduleBackward(profile: EventProfile, tasks: TaskTemplate[]): TaskGraph {
  const eventDate = parseISO(profile.eventDate);
  const today = parseISO(profile.planningStartDate);
  const daysAvailable = differenceInDays(eventDate, today);

  const maxLeadTime = Math.max(...tasks.map(t => t.leadTimeDays));
  const rushMode = daysAvailable < maxLeadTime;

  // Schedule backward from event date with topological dependency ordering
  // If task start falls before today, compress duration and assign rush alternative.
  ...
}
```

---

## 5. LLM Design & Provider Architecture

### 5.1 Provider Interface

```typescript
export interface LLMProvider {
  chat(messages: ChatMessage[], context: IntakeContext): Promise<IntakeResponse>;
  generateExplanations(plan: BudgetPlan, profile: EventProfile): Promise<ExplainResponse>;
  generateVendorMessage(request: VendorMessageRequest): Promise<VendorMessageResponse>;
}
```

### 5.2 MockLLMProvider & Resilience Strategy
- `GeminiProvider`: calls Google Gemini API with `gemini-2.0-flash` using structured JSON schemas.
- `MockLLMProvider`: deterministic responses matching the schemas identically. Used in automated tests, offline mode, and as an immediate fallback whenever Gemini API keys are missing, rate limits hit (429), or JSON validation fails after 1 retry.
- **The application never displays a raw LLM error to the user.**

### 5.3 Candidate Plan Styles
1. **Food-first**: boosts `food_prasad` priority to 1.7× (elevated community banquet).
2. **Look-first**: boosts `decor` and `stage_sound` priority (magnificent visual aesthetic).
3. **Balanced**: evenly weighted across all categories according to the sub-type preset.
4. **DIY-Max (Conditional)**: Only shown if per-head budget is < ₹1,200. Reallocates 35% of decor and event coordination into volunteer resources, community craft, and self-managed catering setups.

---

## 6. Screens & User Flow

1. **Intake & Profile Screen (`/`)**:
   - Left: conversational assistant with quick-reply buttons and candidate plan cards.
   - Right: live `EventProfileCard` displaying completion progress, per-head budget, and priority tags.
   - Top Bar: **"Play Demo"** button (Priya's 200-guest Diwali event).
2. **Dashboard View**:
   - Budget allocation pie/donut chart + category breakdown table with floors and "Why" justifications.
   - Backward timeline with critical path and rush warnings.
   - Cultural vendor checklist with status toggles.
3. **What-If Scenario Panel**:
   - Sliders for budget, guests, and date. Category lock toggles.
   - Side-by-side comparison table showing deltas, direction indicators, and generated reasons.
   - One-click "Apply to Current Plan" button.
4. **Vendor Message Generator**:
   - Modal generating tailored outreach messages with budget brackets.
5. **Day-of Run Sheet & Task Board**:
   - Hour-by-hour schedule with manual override protection (`isUserEdited`).
   - Kanban-style task status management.

---

## 7. Testing & Verification

1. **Deterministic Unit Tests (`vitest`)**:
   - Math invariants: total allocated + contingency = total budget.
   - Floor constraints: no unlocked category falls below floor cost.
   - Locked rebalance: locked categories remain fixed; remaining categories scale correctly.
   - Backward scheduling: deadlines respect task dependencies and lead times.
   - Rush compression: tasks starting in past are compressed with alternatives.
2. **Scenario Tests**:
   - Priya Demo rebalance: 200 guests → 250 guests; verify food increases, per-head adjusts, diff reasons generated accurately.
3. **LLM Provider Tests**:
   - Mock provider validates schema compatibility.
   - Fallback logic safely catches API failures.

---

## 8. Deployment & Environment Setup

### Environment Variables
- `GEMINI_API_KEY`: Google Gemini API key.
- Setup in local: `.env` file (gitignored). Placeholder provided in `.env.example`.
- Setup in Vercel: Project Dashboard → **Settings** → **Environment Variables** → Name: `GEMINI_API_KEY`, Value: `<your-api-key>`.

### GitHub & Vercel Continuous Deployment
- Repo connected to Vercel on hobby tier.
- Next.js API routes handle all backend requests without any separate infrastructure.

---

## 9. Decision Log

| # | Decision | Rationale |
|---|---|---|
| D1 | Focus exclusively on **Cultural Community Events** | Best alignment with hackathon theme; rich community dynamics (food/prasad, stage/sound, volunteers). |
| D2 | Next.js API routes on Vercel | Zero-cost serverless deployment; live link available immediately without billing setup. |
| D3 | `localStorage` + Repository interface | Fast client-side persistence, no database latency, offline compatible. |
| D4 | Deterministic-first math engine | LLM must never compute or balance numbers; guarantees zero arithmetic hallucinations. |
| D5 | Provider pattern for LLM with Mock fallback | Seamless local dev, rock-solid tests, and 100% demo uptime even under network or rate-limit issues. |
| D6 | Conditional "DIY-Max" plan style | Provides genuine pragmatic utility for tight community budgets by leveraging volunteer power. |

---

## 10. Budget Engine Redesign: Sourcing Modes & Invariant Architecture

### 10.1 Root Cause Analysis of the Negative Allocation Bug
In the previous implementation, fixed and per-head "floor costs" were unconditionally allocated to categories before distributing remaining funds. When a user inputted a tight community budget (e.g., ₹45,000 for 200 guests), the sum of arbitrary floor costs (₹78,000+) exceeded the net allocatable budget (₹40,500). Residual subtraction in the priority-boost phase resulted in negative numbers (Food & Prasad dropped to -₹39,960 / -98.67%), while the UI naively displayed "100% allocated without leakage".

### 10.2 Core Philosophy: The Reality of Volunteer Community Organizers
Real-world cultural and community events in India operate on modest cash budgets (₹10,000, ₹50,000, ₹1,00,000) supplemented by volunteer labor, temple/school spaces, borrowed AV systems, and in-kind food contributions.
- **The app must never shame the user or say "events cost a lot of money".**
- Its mission is to **make the event happen** with whatever resources exist.
- At low budgets, the engine shows the resourceful community way: borrowed sound systems, volunteer stage setup, potluck/prasad grain contributions, local shopkeeper sponsorships, and free community lawns.
- Money is spent strictly where cash is unavoidable, while everything else is powered by community effort with concrete assigned tasks.

### 10.3 Invariant Guarantees (Enforced by Automated Property Tests)
1. **Strict Non-Negativity:** Every category allocation is `≥ 0` in all cases.
2. **Exact Budget Sum:** `sum(category allocations) + contingency reserve === usable cash budget` to the exact integer rupee.
3. **Exact Percentage Normalization:** Category percentages are derived from final allocations and sum to `100.0%`.
4. **Safe Per-Guest Metrics:** Per-guest figures are never negative, `NaN`, or `Infinity`.
5. **Real Verification Gate:** The UI displays "Fully Allocated & Verified" only after an automated verification function evaluates invariants 1–3.
6. **Graceful Fault Tolerance:** The engine never throws exceptions on unexpected input; all failure paths return a structured result with an encouraging message.

### 10.4 Discrete Sourcing Modes per Category
Instead of rigid commercial cash floors, each category defines 5 discrete sourcing modes from zero-cash to luxury:
1. `community_sourced`: ₹0 to nominal cash. Relies on volunteers, borrowed sound gear, community halls, potluck/grain donations. Generates volunteer and donor tasks.
2. `minimal_paid`: Bare-bones local vendor rates (e.g. basic tentage, auto-rickshaw PA rental, wholesale dry prasad).
3. `standard_paid`: Standard community package (rented sound engineer, decorative floral backdrop, catered hot meal).
4. `enhanced_paid`: High quality setup (digital audio console, LED stage wash, drone video, multi-course feast).
5. `premium_paid`: Turnkey commercial production (concert-grade line arrays, celebrity artists, bespoke banquet).

### 10.5 Marginal Value Step-by-Step Upgrade Algorithm
1. **Contingency Locking:** Reserve `clamp(5% to 10%, min ₹500, max ₹2,00,000)` scaled for emergencies.
2. **Base Level Initialization:** Initialize all 9 cultural categories at `community_sourced` mode (cash = 0, volunteer tasks generated).
3. **Essential Category Guarantee:** If budget permits, upgrade `essential` categories (`venue_permissions`, `food_prasad`, `safety`) from `community_sourced` to `minimal_paid`.
4. **Priority-Driven Marginal Upgrades:**
   - Rank categories based on user priorities (`top2` boosted 1.6x) and event sub-type weights.
   - Iteratively evaluate the incremental cost to upgrade each candidate category to its next sourcing mode (`community` → `minimal` → `standard` → `enhanced` → `premium`).
   - Upgrade the highest-value category that fits within the remaining cash.
   - Repeat until no category can be upgraded.
5. **Surplus Distribution & Exact Rounding:** Distribute any unspent residual rupees into user priority categories (e.g. Food & Prasad portion upgrade or Stage lighting) ensuring exact budget closure down to the single rupee.

### 10.6 Resourcefulness Toolkit (Computed Deterministically)
When cash is tight, the engine computes actionable community remedies:
- **Per-Household Contribution Target:** `(Target Gap) / (Estimated Households)` rounded to friendly rupee increments (e.g. ₹250 or ₹500 per family).
- **Local Sponsor Targets:** `(Cost Gap) / 3` targeted at local grocers, cloth merchants, or society patrons.
- **Potluck / Contributed Raw Materials:** Converting food into raw grain / ghee contribution lists for community cooking.
- **"What the next ₹10,000 unlocks":** Computes the exact next sourcing mode transition that an extra ₹10k would achieve (e.g. "Upgrades Stage & Sound from borrowed PA to professional 2000W rented system").

### 10.7 Sanity & Human-Grade Boundary Handling
- **Plainly Absurd (< ₹2,000 or < ₹5/guest):** Warm, empathetic human reply. Asks clarifying question without crashing or rendering broken plans. Suggests achievable scope (e.g., intimate gathering of 15 members with potluck tea).
- **Tight but Workable (₹5,000 – ₹15,000):** Builds an authentic, volunteer-first community blueprint with full confidence.
- **Suspicious/Invalid Inputs (NaN, negative, past dates):** Sanitized deterministically with user-friendly confirmation flags.


