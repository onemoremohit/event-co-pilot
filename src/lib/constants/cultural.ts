import { BudgetCategorySlug, EventSubType, PlanStyle } from '../types';

export interface CategoryMetadata {
  slug: BudgetCategorySlug;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  defaultSubItems: { label: string; ratio: number; notes: string }[];
}

export const CULTURAL_CATEGORIES: Record<BudgetCategorySlug, CategoryMetadata> = {
  venue_permissions: {
    slug: 'venue_permissions',
    label: 'Venue & Permissions',
    shortLabel: 'Venue',
    icon: '🏛️',
    description: 'Society clubhouse/ground rental, police loudspeaker NOC, fire safety permit, municipal approvals.',
    defaultSubItems: [
      { label: 'Ground / Hall Booking Fee', ratio: 0.6, notes: 'Society common premises or ground' },
      { label: 'Police & Loudspeaker NOC Permits', ratio: 0.25, notes: 'Local authority approvals' },
      { label: 'Generator & Power Backup', ratio: 0.15, notes: 'Continuous power supply for event' }
    ]
  },
  stage_sound: {
    slug: 'stage_sound',
    label: 'Stage & Sound',
    shortLabel: 'Stage/Sound',
    icon: '🎤',
    description: 'Elevated wooden stage, professional PA system, corded/cordless mics, stage lighting, technician.',
    defaultSubItems: [
      { label: 'Stage Platform & Backdrop Truss', ratio: 0.45, notes: 'Platform with carpet and steps' },
      { label: 'Sound System & Microphones', ratio: 0.35, notes: 'PA speakers, mixer, 4 cordless mics' },
      { label: 'Stage & Ambient Lighting', ratio: 0.20, notes: 'LED PAR cans, warm wash lights' }
    ]
  },
  decor: {
    slug: 'decor',
    label: 'Decor & Theme',
    shortLabel: 'Decor',
    icon: '✨',
    description: 'Traditional floral entrance arch, rangoli, fairy lights across campus, drapery, deity/stage backdrop.',
    defaultSubItems: [
      { label: 'Entrance Arch & Welcome Rangoli', ratio: 0.35, notes: 'Marigold flowers + ethnic rangoli' },
      { label: 'Campus Fairy Light Illumination', ratio: 0.40, notes: 'Tree wraps and boundary strings' },
      { label: 'Stage Backdrop & Pooja Decor', ratio: 0.25, notes: 'Traditional silk drapes + brass lamps' }
    ]
  },
  food_prasad: {
    slug: 'food_prasad',
    label: 'Food & Prasad',
    shortLabel: 'Food/Prasad',
    icon: '🍛',
    description: 'Traditional community buffet/dinner feast, sacred prasad distribution, high tea/snacks, mineral water.',
    defaultSubItems: [
      { label: 'Main Community Dinner Buffet', ratio: 0.65, notes: 'Multi-course regional festive meal' },
      { label: 'Special Prasad & Sweets (Mithai)', ratio: 0.20, notes: 'Fresh laddoos / kheer / pedas' },
      { label: 'Beverages, Chai & Water Dispensers', ratio: 0.15, notes: 'Tea, buttermilk, filtered water' }
    ]
  },
  performers: {
    slug: 'performers',
    label: 'Performers & Artists',
    shortLabel: 'Performers',
    icon: '🎭',
    description: 'Traditional folk troupe, anchor/emcee, live instrumentalist/dhol band, guest artist remuneration.',
    defaultSubItems: [
      { label: 'Live Folk Music Troupe / Dhol Tasha', ratio: 0.50, notes: 'High-energy cultural music performance' },
      { label: 'Emcee & Community Host', ratio: 0.30, notes: 'Bilingual crowd engagement & program flow' },
      { label: 'Honorarium & Green Room Hospitality', ratio: 0.20, notes: 'Refreshments & token gifts for artists' }
    ]
  },
  volunteers: {
    slug: 'volunteers',
    label: 'Volunteers & Coordination',
    shortLabel: 'Volunteers',
    icon: '🤝',
    description: 'Volunteer badges/t-shirts, walkie-talkies, food packets for helper crew, stage runners.',
    defaultSubItems: [
      { label: 'Volunteer Badges, T-Shirts & IDs', ratio: 0.40, notes: 'Visual identification for organizers' },
      { label: 'Crew Meals & Refreshments', ratio: 0.40, notes: 'Pre-event snacks and water for volunteers' },
      { label: 'Walkie-Talkie Rentals & Station Supplies', ratio: 0.20, notes: 'Floor communication kit' }
    ]
  },
  safety: {
    slug: 'safety',
    label: 'Safety & Crowd Management',
    shortLabel: 'Safety',
    icon: '🛡️',
    description: 'Security guards, fire extinguishers, first-aid booth, crowd queue stanchions, emergency signage.',
    defaultSubItems: [
      { label: 'Security Guard Deployment (4 Guards)', ratio: 0.50, notes: 'Gate control and parking oversight' },
      { label: 'Fire Safety & Extinguisher Rental', ratio: 0.25, notes: 'Mandatory fire compliance cylinders' },
      { label: 'First Aid Kit & Emergency Supplies', ratio: 0.25, notes: 'Trained first-aider on stand-by' }
    ]
  },
  photography: {
    slug: 'photography',
    label: 'Photography & Video',
    shortLabel: 'Photography',
    icon: '📸',
    description: 'Traditional event photographer + videographer, aerial drone highlights, community photo booth.',
    defaultSubItems: [
      { label: 'Event Candid Photography (1 Lead)', ratio: 0.55, notes: 'Full event documentation & portraits' },
      { label: 'Highlight Video Reel & Editing', ratio: 0.30, notes: '2-3 min festival celebration video' },
      { label: 'Festive Photo Booth with Props', ratio: 0.15, notes: 'Selfie frame + instant digital delivery' }
    ]
  },
  misc: {
    slug: 'misc',
    label: 'Miscellaneous & Contingency Support',
    shortLabel: 'Misc',
    icon: '📦',
    description: 'Stationery, printouts, flex banners, cleanup crew, unexpected last-mile logistical needs.',
    defaultSubItems: [
      { label: 'Banners, Signages & Standees', ratio: 0.40, notes: 'Welcome flex + schedule standees' },
      { label: 'Post-Event Waste Management & Cleaning', ratio: 0.40, notes: 'Eco-friendly disposal & sweepers' },
      { label: 'Stationery, Tape & Incidentals', ratio: 0.20, notes: 'Adhesives, scissors, pins, battery cells' }
    ]
  }
};

export const CULTURAL_WEIGHT_TABLE: Record<EventSubType, Record<BudgetCategorySlug, number>> = {
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

export const FLOOR_PER_HEAD: Record<string, { normal: number; premium: number }> = {
  food_prasad: { normal: 220, premium: 450 },
  safety: { normal: 25, premium: 60 },
  volunteers: { normal: 15, premium: 35 }
};

export const FLOOR_FIXED: Record<string, { normal: number; premium: number }> = {
  venue_permissions: { normal: 15000, premium: 35000 },
  stage_sound: { normal: 25000, premium: 50000 },
  decor: { normal: 20000, premium: 45000 },
  performers: { normal: 15000, premium: 40000 },
  photography: { normal: 10000, premium: 25000 },
  misc: { normal: 5000, premium: 12000 }
};

export const PLAN_STYLES: PlanStyle[] = [
  {
    id: 'food_first',
    name: 'Food & Prasad First',
    description: 'Prioritizes an authentic grand festive feast and sacred prasad offering for all guests.',
    priorityCategories: ['food_prasad', 'venue_permissions']
  },
  {
    id: 'look_first',
    name: 'Look & Spectacle First',
    description: 'Invests heavily in mesmerizing lighting, traditional floral decor, and high-impact stage setup.',
    priorityCategories: ['decor', 'stage_sound']
  },
  {
    id: 'balanced',
    name: 'Balanced Community Harmony',
    description: 'Evenly balanced across hospitality, audio-visual performance, safety, and photography.',
    priorityCategories: ['food_prasad', 'stage_sound']
  },
  {
    id: 'diy_max',
    name: 'DIY-Max (Volunteer Driven)',
    description: 'Maximizes value on a tighter budget using community volunteer power, handmade decor, and society grounds.',
    priorityCategories: ['food_prasad', 'volunteers'],
    perHeadThreshold: 1200
  }
];

export interface TaskTemplate {
  title: string;
  category: BudgetCategorySlug;
  leadTimeDays: number;
  durationDays: number;
  dependsOn: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  defaultAssignee: string;
  rushAlternative: string;
}

export const CULTURAL_TASK_TEMPLATES: TaskTemplate[] = [
  {
    title: 'Book Society Venue & Apply for Police/Sound NOC',
    category: 'venue_permissions',
    leadTimeDays: 42,
    durationDays: 7,
    dependsOn: [],
    priority: 'critical',
    description: 'Secure society clubhouse/grounds and file municipal & police NOC for loudspeakers up to 10 PM.',
    defaultAssignee: 'Management Committee Secretary',
    rushAlternative: 'Apply for expedited online single-window clearance or shift program strictly indoors.'
  },
  {
    title: 'Recruit Community Volunteer Core Team',
    category: 'volunteers',
    leadTimeDays: 38,
    durationDays: 5,
    dependsOn: [],
    priority: 'high',
    description: 'Assemble society youth and active residents for stage, crowd control, and hospitality teams.',
    defaultAssignee: 'Volunteer Lead',
    rushAlternative: 'Form emergency WhatsApp volunteer broadcast group with pre-assigned roles.'
  },
  {
    title: 'Contract Stage, Sound & AV Vendor',
    category: 'stage_sound',
    leadTimeDays: 32,
    durationDays: 5,
    dependsOn: ['Book Society Venue & Apply for Police/Sound NOC'],
    priority: 'critical',
    description: 'Finalize audio vendor with stage dimensions, mixer, cordless mics, and lighting truss setup.',
    defaultAssignee: 'Cultural Committee AV Lead',
    rushAlternative: 'Book in-house society PA system supplemented with rented portable active speakers.'
  },
  {
    title: 'Finalize Feast Caterer & Prasad Menu',
    category: 'food_prasad',
    leadTimeDays: 28,
    durationDays: 6,
    dependsOn: ['Book Society Venue & Apply for Police/Sound NOC'],
    priority: 'critical',
    description: 'Conduct food tasting, fix per-plate rate, finalize traditional menu items, and order special sweets.',
    defaultAssignee: 'Food Committee Head',
    rushAlternative: 'Partner with local established sweet mart/bhojanalaya for standardized festive thali/box.'
  },
  {
    title: 'Book Cultural Performers / Folk Artists & Emcee',
    category: 'performers',
    leadTimeDays: 25,
    durationDays: 5,
    dependsOn: ['Contract Stage, Sound & AV Vendor'],
    priority: 'high',
    description: 'Confirm live musical troupe/dhol tasha group and engage bilingual master of ceremonies.',
    defaultAssignee: 'Cultural Secretary',
    rushAlternative: 'Organize high-energy resident talent show & society kids performance with curated music playlist.'
  },
  {
    title: 'Approve Decor Concept & Campus Illumination Plan',
    category: 'decor',
    leadTimeDays: 20,
    durationDays: 4,
    dependsOn: ['Contract Stage, Sound & AV Vendor'],
    priority: 'medium',
    description: 'Finalize floral arch theme, fairy lights layout across trees, and traditional pooja backdrop.',
    defaultAssignee: 'Decor Coordinator',
    rushAlternative: 'Utilize reusable society LED series lights and enlist volunteer committee for eco-friendly paper/fabric decor.'
  },
  {
    title: 'Engage Event Photographer & Videographer',
    category: 'photography',
    leadTimeDays: 18,
    durationDays: 4,
    dependsOn: [],
    priority: 'medium',
    description: 'Book photographer for stage performances, guest candids, and family festive portrait booth.',
    defaultAssignee: 'Media Lead',
    rushAlternative: 'Designate 2 amateur photographer residents with semi-pro DSLR cameras and shared cloud upload folder.'
  },
  {
    title: 'Complete Crowd Safety, Fire & Medical Protocol',
    category: 'safety',
    leadTimeDays: 14,
    durationDays: 3,
    dependsOn: ['Book Society Venue & Apply for Police/Sound NOC'],
    priority: 'high',
    description: 'Place 4 fire extinguishers near stage & food area, designate emergency medical booth, brief security.',
    defaultAssignee: 'Security & Safety Officer',
    rushAlternative: 'Reassign regular society security staff with written emergency checklist.'
  },
  {
    title: 'Issue Community Circular & Collect RSVPs',
    category: 'misc',
    leadTimeDays: 12,
    durationDays: 4,
    dependsOn: ['Finalize Feast Caterer & Prasad Menu'],
    priority: 'medium',
    description: 'Send festival circular on society app/WhatsApp group with schedule and headcount confirmation link.',
    defaultAssignee: 'Communications Lead',
    rushAlternative: 'Send instant WhatsApp poll with immediate confirmation deadline.'
  },
  {
    title: 'Dry Run Rehearsal & Sound Acoustic Check',
    category: 'stage_sound',
    leadTimeDays: 2,
    durationDays: 1,
    dependsOn: [
      'Contract Stage, Sound & AV Vendor',
      'Book Cultural Performers / Folk Artists & Emcee'
    ],
    priority: 'critical',
    description: 'Test all microphones, sequence audio tracks for performances, and walk through stage transition cues.',
    defaultAssignee: 'Stage Director',
    rushAlternative: 'Perform accelerated 45-minute sound check 3 hours before start time.'
  },
  {
    title: 'Execute Day-of Event Coordination & Run Sheet',
    category: 'volunteers',
    leadTimeDays: 0,
    durationDays: 1,
    dependsOn: [
      'Dry Run Rehearsal & Sound Acoustic Check',
      'Complete Crowd Safety, Fire & Medical Protocol'
    ],
    priority: 'critical',
    description: 'Oversee setup arrival, manage green room hospitality, coordinate dinner buffet opening, and conduct closing cleanup.',
    defaultAssignee: 'Overall Event Convener',
    rushAlternative: 'Strictly follow the auto-generated hourly run sheet with assigned sub-leads.'
  }
];

export interface VendorTemplate {
  vendorType: string;
  category: BudgetCategorySlug;
  leadTimeDays: number;
  description: string;
  suggestedQuestions: string[];
}

export const CULTURAL_VENDOR_TEMPLATES: VendorTemplate[] = [
  {
    vendorType: 'Community Caterer & Prasad Cook',
    category: 'food_prasad',
    leadTimeDays: 28,
    description: 'Prepares traditional buffet meal and consecrated festival sweets.',
    suggestedQuestions: [
      'Can you handle live buffet counter for 200+ guests simultaneously?',
      'Do you provide warmers, uniformed servers, and eco-friendly leaf plates/cutlery?',
      'What is your minimum notice for a +50 guest increase?'
    ]
  },
  {
    vendorType: 'Stage, Sound & Truss Provider',
    category: 'stage_sound',
    leadTimeDays: 32,
    description: 'Supplies acoustic sound reinforcement, audio mixer, microphones, and stage platform.',
    suggestedQuestions: [
      'Does the quote include an on-site sound technician throughout the evening?',
      'Are wireless microphones protected against frequency interference?',
      'Do you provide backup generator or UPS for uninterrupted audio?'
    ]
  },
  {
    vendorType: 'Festival Decorator & Campus Florist',
    category: 'decor',
    leadTimeDays: 20,
    description: 'Installs floral entrance, campus ambient lighting, and traditional backdrop.',
    suggestedQuestions: [
      'Will fresh flowers be delivered and assembled morning of the event?',
      'Are the fairy lights industrial outdoor-grade with waterproof junctions?',
      'Does the teardown happen the same night or following morning?'
    ]
  },
  {
    vendorType: 'Folk Troupe / Cultural Performers',
    category: 'performers',
    leadTimeDays: 25,
    description: 'Live musical artists, dhol group, or traditional dance performers.',
    suggestedQuestions: [
      'How long is your performance set and are breaks included?',
      'Do you require specific audio inputs or DI boxes for your instruments?',
      'What are your green room and technical rider requirements?'
    ]
  },
  {
    vendorType: 'Event Photographer & Videographer',
    category: 'photography',
    leadTimeDays: 18,
    description: 'Documents cultural rituals, candid moments, and edits a highlight reel.',
    suggestedQuestions: [
      'What is the turnaround time for high-resolution edited photos?',
      'Will you capture a dedicated group photo of all society residents?',
      'Can you deliver a 60-second social media reel within 48 hours?'
    ]
  },
  {
    vendorType: 'Event Security & Fire Safety Agency',
    category: 'safety',
    leadTimeDays: 14,
    description: 'Provides trained security guards and rented fire safety gear.',
    suggestedQuestions: [
      'Can guards assist with traffic circulation and parking outside the gates?',
      'Are staff certified in basic first-aid and fire extinguisher deployment?',
      'Do they come with uniform and badges?'
    ]
  }
];

// ============================================================================
// Event Archetype & Contextual Category Engine
// ============================================================================

export type EventArchetype = 'dandiya_garba' | 'pooja_religious' | 'cultural_night' | 'neighborhood_gathering';

/**
 * Detects the specific cultural archetype from event name and sub-type.
 * e.g. Dandiya/Garba Night vs Pooja/Temple vs Cultural Night vs Neighborhood.
 */
export function detectEventArchetype(profile?: { eventName?: string; eventSubType?: string }): EventArchetype {
  const name = (profile?.eventName || '').toLowerCase();
  const subType = (profile?.eventSubType || '').toLowerCase();
  const text = `${name} ${subType}`;

  // 1. Dandiya / Garba / Dance Celebrations (NO prasad; food is dinner buffet, snacks, hydration)
  if (
    text.includes('dandiya') ||
    text.includes('garba') ||
    text.includes('raas') ||
    text.includes('sangeet') ||
    text.includes('bhangra') ||
    text.includes('dance night') ||
    text.includes('holi') ||
    text.includes('rangotsav')
  ) {
    return 'dandiya_garba';
  }

  // 2. Pooja / Devotional Events (Has sacred prasad, bhog, aarti)
  if (
    text.includes('pooja') ||
    text.includes('puja') ||
    text.includes('havan') ||
    text.includes('jagran') ||
    text.includes('bhajan') ||
    text.includes('kirtan') ||
    text.includes('mata ki chowki') ||
    text.includes('aarti') ||
    text.includes('durga puja') ||
    text.includes('ganesh') ||
    text.includes('satsang') ||
    text.includes('prasad') ||
    text.includes('langar')
  ) {
    return 'pooja_religious';
  }

  // 3. Cultural Performance Night
  if (
    subType === 'cultural_night' ||
    text.includes('performance') ||
    text.includes('cultural night') ||
    text.includes('talent show') ||
    text.includes('drama') ||
    text.includes('theatre') ||
    text.includes('annual day') ||
    text.includes('musical night')
  ) {
    return 'cultural_night';
  }

  // 4. Neighborhood / Community Gathering
  if (
    subType === 'neighborhood' ||
    text.includes('neighborhood') ||
    text.includes('society gathering') ||
    text.includes('community meet') ||
    text.includes('sports') ||
    text.includes('picnic') ||
    text.includes('republic') ||
    text.includes('independence')
  ) {
    return 'neighborhood_gathering';
  }

  return 'pooja_religious';
}

/**
 * Returns tailored category metadata matching the event archetype.
 * Specifically distinguishes food for Dandiya/Garba (Refreshments/Snacks) vs Pooja (Prasad) vs Cultural Night (Dinner).
 */
export function getCategoryMetadata(slug: BudgetCategorySlug, archetype: EventArchetype = 'pooja_religious'): CategoryMetadata {
  const base = CULTURAL_CATEGORIES[slug];

  if (slug === 'food_prasad') {
    if (archetype === 'dandiya_garba') {
      return {
        slug: 'food_prasad',
        label: 'Food & Refreshments',
        shortLabel: 'Food/Snacks',
        icon: '🍢',
        description: 'Festive dinner buffet, live chaat & snack stalls, hydration counters, masala chaas & water for dancers.',
        defaultSubItems: [
          { label: 'Festive Dinner Buffet & Pulao Stalls', ratio: 0.60, notes: 'Hot vegetarian dinner spread for dancers' },
          { label: 'Live Chaat, Snack Stalls & Sweets', ratio: 0.25, notes: 'Pav bhaji, chaat, and festive sweets' },
          { label: 'Hydration, Masala Chaas & Mineral Water', ratio: 0.15, notes: 'Essential chilled water and beverages for dancers' }
        ]
      };
    }

    if (archetype === 'cultural_night') {
      return {
        slug: 'food_prasad',
        label: 'Dinner Buffet & Hospitality',
        shortLabel: 'Dinner/Food',
        icon: '🍽️',
        description: 'Post-performance community dinner buffet, green room artist hospitality, and audience intermission high tea.',
        defaultSubItems: [
          { label: 'Post-Performance Dinner Buffet', ratio: 0.65, notes: 'Multi-course community dinner after the show' },
          { label: 'Artist Green Room & VIP Hospitality', ratio: 0.20, notes: 'Hospitality and meals for performers and guest speakers' },
          { label: 'Intermission Tea, Coffee & Water', ratio: 0.15, notes: 'High tea and bottled water during break' }
        ]
      };
    }

    if (archetype === 'neighborhood_gathering') {
      return {
        slug: 'food_prasad',
        label: 'Community High Tea & Refreshments',
        shortLabel: 'Food/Snacks',
        icon: '☕',
        description: 'Community high tea, evening snacks, light dinner or potluck dishes for neighborhood families.',
        defaultSubItems: [
          { label: 'Community High Tea & Evening Snacks', ratio: 0.50, notes: 'Samosas, dhokla, biscuits & masala chai' },
          { label: 'Light Dinner / Potluck Buffet Supplement', ratio: 0.35, notes: 'Pulao, curry, and sweets' },
          { label: 'Beverages & Drinking Water Dispensers', ratio: 0.15, notes: 'Juices, water, and cold drinks' }
        ]
      };
    }

    // Default Pooja / Religious
    return {
      slug: 'food_prasad',
      label: 'Food & Sacred Prasad',
      shortLabel: 'Food/Prasad',
      icon: '🍛',
      description: 'Traditional community buffet/dinner feast, sacred prasad distribution, high tea/snacks, mineral water.',
      defaultSubItems: [
        { label: 'Main Community Bhojan Feast', ratio: 0.65, notes: 'Multi-course regional festive meal' },
        { label: 'Special Prasad & Sweets (Mithai)', ratio: 0.20, notes: 'Fresh laddoos / kheer / pedas' },
        { label: 'Beverages, Chai & Water Dispensers', ratio: 0.15, notes: 'Tea, buttermilk, filtered water' }
      ]
    };
  }

  if (slug === 'stage_sound' && archetype === 'dandiya_garba') {
    return {
      slug: 'stage_sound',
      label: 'Sound System & DJ Setup',
      shortLabel: 'DJ/Sound',
      icon: '🎵',
      description: 'High-bass surround audio for open ground, wireless mics for live singers/anchors, and LED flood stage wash.',
      defaultSubItems: [
        { label: 'High-Bass Ground PA & Line Arrays', ratio: 0.50, notes: 'Sound coverage across entire dancing lawn' },
        { label: 'DJ Console, Mixers & Wireless Microphones', ratio: 0.30, notes: 'DJ deck, monitor speakers & cordless mics' },
        { label: 'Pandal Dance Floor LED Flood Wash', ratio: 0.20, notes: 'Dynamic color-changing LED wash on ground' }
      ]
    };
  }

  if (slug === 'decor' && archetype === 'dandiya_garba') {
    return {
      slug: 'decor',
      label: 'Dandiya Theme & Pandal Decor',
      shortLabel: 'Decor',
      icon: '✨',
      description: 'Colorful ethnic fabric drapes, illuminated entrance arch, selfie booth with traditional props, and perimeter fairy lights.',
      defaultSubItems: [
        { label: 'Ethnic Pandal Draping & Fairy Light Canopy', ratio: 0.45, notes: 'Vibrant Gujarati/Rajasthani color canopy' },
        { label: 'Festive Selfie Point & Traditional Props Booth', ratio: 0.30, notes: 'Photo booth with festive umbrellas & cutouts' },
        { label: 'Grand Entrance Toran & Pathway Illumination', ratio: 0.25, notes: 'Floral arch and illuminated pathway' }
      ]
    };
  }

  if (slug === 'performers' && archetype === 'dandiya_garba') {
    return {
      slug: 'performers',
      label: 'Live Dhol Players, Singer & DJ Troupe',
      shortLabel: 'Dhol/Artists',
      icon: '🥁',
      description: 'High-energy live dhol tasha, folk singers, traditional garba troupe, and engaging bilingual emcee.',
      defaultSubItems: [
        { label: 'Live Dhol Tasha & Folk Singer Troupe', ratio: 0.50, notes: 'Authentic rhythmic live dhol & vocalists' },
        { label: 'Professional Garba DJ & Sound Master', ratio: 0.30, notes: 'Curated traditional & modern fusion Garba tracks' },
        { label: 'Anchor / Emcee & Dance Coordinator', ratio: 0.20, notes: 'Crowd coordination, steps instruction & competitions' }
      ]
    };
  }

  return base;
}

/**
 * Returns contextual candidate plan styles customized for the celebration.
 */
export function getCandidatePlanStyles(archetype: EventArchetype = 'pooja_religious'): PlanStyle[] {
  if (archetype === 'dandiya_garba') {
    return [
      {
        id: 'food_first',
        name: 'Food & Refreshments First',
        description: 'Prioritizes an authentic festive dinner buffet, live snack stalls, and cold beverages for all dancers.',
        priorityCategories: ['food_prasad', 'venue_permissions']
      },
      {
        id: 'look_first',
        name: 'Music & Pandal Spectacle First',
        description: 'Invests heavily in high-bass DJ sound, vibrant ethnic pandal draping, and perimeter fairy lights.',
        priorityCategories: ['decor', 'stage_sound']
      },
      {
        id: 'balanced',
        name: 'Balanced Dandiya Celebration',
        description: 'Evenly balanced across live dhol music, sound system, festive dining, and safety.',
        priorityCategories: ['food_prasad', 'stage_sound']
      },
      {
        id: 'diy_max',
        name: 'DIY-Max (Volunteer Driven)',
        description: 'Volunteer-powered celebration with resident potluck snacks, borrowed sound, and handmade pandal decor.',
        priorityCategories: ['food_prasad', 'volunteers'],
        perHeadThreshold: 1200
      }
    ];
  }

  if (archetype === 'cultural_night') {
    return [
      {
        id: 'food_first',
        name: 'Dinner & Hospitality First',
        description: 'Prioritizes post-performance community dinner and artist green room hospitality.',
        priorityCategories: ['food_prasad', 'venue_permissions']
      },
      {
        id: 'look_first',
        name: 'Stage AV & Lighting First',
        description: 'Invests heavily in acoustic line arrays, theater stage wash, and theatrical backdrop.',
        priorityCategories: ['decor', 'stage_sound']
      },
      {
        id: 'balanced',
        name: 'Balanced Cultural Night',
        description: 'Balanced between stage production, performing artists, dinner, and safety.',
        priorityCategories: ['food_prasad', 'stage_sound']
      },
      {
        id: 'diy_max',
        name: 'DIY-Max (Volunteer Driven)',
        description: 'Society resident talent show with in-house PA and potluck dinner.',
        priorityCategories: ['food_prasad', 'volunteers'],
        perHeadThreshold: 1200
      }
    ];
  }

  return PLAN_STYLES;
}

/**
 * Returns tailored task templates for the event archetype.
 */
export function getCulturalTaskTemplates(archetype: EventArchetype = 'pooja_religious'): TaskTemplate[] {
  const isDandiya = archetype === 'dandiya_garba';
  const isCulturalNight = archetype === 'cultural_night';
  const isNeighborhood = archetype === 'neighborhood_gathering';

  const foodTaskTitle = isDandiya
    ? 'Finalize Dinner Caterer & Food Stalls Menu'
    : isCulturalNight
    ? 'Finalize Post-Show Dinner & Green Room Hospitality'
    : isNeighborhood
    ? 'Finalize Community Snacks & High Tea Menu'
    : 'Finalize Feast Caterer & Prasad Menu';

  const foodTaskDesc = isDandiya
    ? 'Conduct food tasting, fix per-plate rate, finalize festive snacks, live stalls, and cold beverages for attendees.'
    : isCulturalNight
    ? 'Confirm dinner buffet caterer, green room artist meals, and intermission tea/coffee setup.'
    : isNeighborhood
    ? 'Confirm high tea snack boxes, tea/coffee dispensers, and community potluck coordination.'
    : 'Conduct food tasting, fix per-plate rate, finalize traditional menu items, and order special sweets.';

  const decorTaskTitle = isDandiya
    ? 'Finalize Dandiya Theme Decor & Pandal Draping'
    : 'Approve Decor Concept & Campus Illumination Plan';

  const decorTaskDesc = isDandiya
    ? 'Select ethnic colorful drapery, fairy lights canopy across lawn, and traditional selfie props booth.'
    : 'Finalize floral arch theme, fairy lights layout across trees, and traditional pooja backdrop.';

  const performersTaskTitle = isDandiya
    ? 'Book Live Dhol Tasha, Singer & DJ Troupe'
    : isCulturalNight
    ? 'Book Cultural Performers, Dance Troupe & Emcee'
    : 'Book Cultural Performers / Folk Artists & Emcee';

  const venueTaskTitle = isDandiya
    ? 'Book Society Dance Ground Venue & Apply for Loudspeaker NOC'
    : 'Book Society Venue & Apply for Police/Sound NOC';

  return [
    {
      title: venueTaskTitle,
      category: 'venue_permissions',
      leadTimeDays: 42,
      durationDays: 7,
      dependsOn: [],
      priority: 'critical',
      description: isDandiya
        ? 'Confirm open lawn/ground booking, apply for police loudspeaker sound NOC, and inspect ground levelness for dancing.'
        : 'Book society community hall/ground and submit police loudspeaker and fire safety notifications.',
      defaultAssignee: 'Venue & Permissions Lead',
      rushAlternative: 'Utilize society central lawn/courtyard with pre-existing society permissions.'
    },
    {
      title: isDandiya ? 'Contract Ground Sound System, Bass Speakers & AV' : 'Contract Stage, Sound & AV Vendor',
      category: 'stage_sound',
      leadTimeDays: 32,
      durationDays: 5,
      dependsOn: [venueTaskTitle],
      priority: 'critical',
      description: isDandiya
        ? 'Finalize heavy-bass sound system, wireless mics for singers, and dance lawn LED wash floodlights.'
        : 'Finalize audio vendor with stage dimensions, mixer, cordless mics, and lighting truss setup.',
      defaultAssignee: 'Cultural Committee AV Lead',
      rushAlternative: 'Book in-house society PA system supplemented with rented portable active speakers.'
    },
    {
      title: foodTaskTitle,
      category: 'food_prasad',
      leadTimeDays: 28,
      durationDays: 6,
      dependsOn: [venueTaskTitle],
      priority: 'critical',
      description: foodTaskDesc,
      defaultAssignee: 'Food Committee Head',
      rushAlternative: isDandiya
        ? 'Partner with local established sweet mart/restaurant for packaged festive snack boxes.'
        : 'Partner with local established sweet mart/bhojanalaya for standardized festive thali/box.'
    },
    {
      title: performersTaskTitle,
      category: 'performers',
      leadTimeDays: 25,
      durationDays: 5,
      dependsOn: [isDandiya ? 'Contract Ground Sound System, Bass Speakers & AV' : 'Contract Stage, Sound & AV Vendor'],
      priority: 'high',
      description: isDandiya
        ? 'Confirm live dhol tasha group, traditional folk singer, and experienced Garba sound DJ.'
        : 'Confirm live musical troupe/dhol tasha group and engage bilingual master of ceremonies.',
      defaultAssignee: 'Cultural Secretary',
      rushAlternative: 'Organize high-energy resident talent show & society kids performance with curated music playlist.'
    },
    {
      title: decorTaskTitle,
      category: 'decor',
      leadTimeDays: 20,
      durationDays: 4,
      dependsOn: [isDandiya ? 'Contract Ground Sound System, Bass Speakers & AV' : 'Contract Stage, Sound & AV Vendor'],
      priority: 'medium',
      description: decorTaskDesc,
      defaultAssignee: 'Decor Coordinator',
      rushAlternative: 'Utilize reusable society LED series lights and enlist volunteer committee for eco-friendly paper/fabric decor.'
    },
    {
      title: 'Engage Event Photographer & Videographer',
      category: 'photography',
      leadTimeDays: 18,
      durationDays: 4,
      dependsOn: [],
      priority: 'medium',
      description: isDandiya
        ? 'Book photographer for candid dancer portraits, selfie booth, and dynamic 4K video reel.'
        : 'Book photographer for stage performances, guest candids, and family festive portrait booth.',
      defaultAssignee: 'Media Lead',
      rushAlternative: 'Designate 2 amateur photographer residents with semi-pro DSLR cameras and shared cloud upload folder.'
    },
    {
      title: 'Complete Crowd Safety, Fire & Medical Protocol',
      category: 'safety',
      leadTimeDays: 14,
      durationDays: 3,
      dependsOn: [venueTaskTitle],
      priority: 'high',
      description: 'Place 4 fire extinguishers near stage & food area, designate emergency medical booth, brief security.',
      defaultAssignee: 'Security & Safety Officer',
      rushAlternative: 'Reassign regular society security staff with written emergency checklist.'
    },
    {
      title: 'Issue Community Circular & Collect RSVPs',
      category: 'misc',
      leadTimeDays: 12,
      durationDays: 4,
      dependsOn: [foodTaskTitle],
      priority: 'medium',
      description: 'Send festival circular on society app/WhatsApp group with schedule and headcount confirmation link.',
      defaultAssignee: 'Communications Lead',
      rushAlternative: 'Send instant WhatsApp poll with immediate confirmation deadline.'
    },
    {
      title: 'Dry Run Rehearsal & Sound Acoustic Check',
      category: 'stage_sound',
      leadTimeDays: 2,
      durationDays: 1,
      dependsOn: [
        isDandiya ? 'Contract Ground Sound System, Bass Speakers & AV' : 'Contract Stage, Sound & AV Vendor',
        performersTaskTitle
      ],
      priority: 'critical',
      description: 'Conduct full acoustic check, mic balancing, MC announcements flow, and lighting cues.',
      defaultAssignee: 'Stage Manager & Cultural Secretary',
      rushAlternative: 'Perform a 30-minute quick mic check and speaker volume test 2 hours prior to start.'
    },
    {
      title: 'Deploy Volunteer Corps & Operational Run Sheet Walkthrough',
      category: 'volunteers',
      leadTimeDays: 1,
      durationDays: 1,
      dependsOn: ['Issue Community Circular & Collect RSVPs'],
      priority: 'high',
      description: 'Assign wing-wise responsibilities: welcome desk, food line, safety patrol, and waste management.',
      defaultAssignee: 'Volunteer Convener',
      rushAlternative: 'Strictly follow the auto-generated hourly run sheet with assigned sub-leads.'
    }
  ];
}

/**
 * Returns tailored vendor templates for the event archetype.
 */
export function getCulturalVendorTemplates(archetype: EventArchetype = 'pooja_religious'): VendorTemplate[] {
  const isDandiya = archetype === 'dandiya_garba';
  const isCulturalNight = archetype === 'cultural_night';

  const foodVendorType = isDandiya
    ? 'Festive Caterer & Food Stalls Provider'
    : isCulturalNight
    ? 'Banquet Caterer & Event Hospitality'
    : 'Community Caterer & Prasad Cook';

  const foodVendorDesc = isDandiya
    ? 'Prepares festive dinner buffet, live snack stalls, and dancer hydration counters.'
    : isCulturalNight
    ? 'Provides multi-course dinner buffet, intermission tea/coffee, and green room hospitality.'
    : 'Prepares traditional buffet meal and consecrated festival sweets.';

  const performerVendorType = isDandiya
    ? 'Live Dhol Players, Singer & DJ Troupe'
    : isCulturalNight
    ? 'Stage Artists & Theatrical Performers'
    : 'Folk Troupe / Cultural Performers';

  const performerVendorDesc = isDandiya
    ? 'Provides live dhol tasha, traditional garba vocalists, and sound track mixing.'
    : isCulturalNight
    ? 'Live theatrical/musical artists, choreographer, and bilingual anchor.'
    : 'Live musical artists, dhol group, or traditional dance performers.';

  return [
    {
      vendorType: foodVendorType,
      category: 'food_prasad',
      leadTimeDays: 28,
      description: foodVendorDesc,
      suggestedQuestions: [
        'Can you handle live buffet counter for 200+ guests simultaneously?',
        'Do you provide warmers, uniformed servers, and eco-friendly leaf plates/cutlery?',
        'What is your minimum notice for a +50 guest increase?'
      ]
    },
    {
      vendorType: isDandiya ? 'Garba Sound System & Open-Ground Audio Provider' : 'Stage, Sound & Truss Provider',
      category: 'stage_sound',
      leadTimeDays: 32,
      description: isDandiya
        ? 'Supplies open-ground high-bass speakers, audio console, wireless microphones, and floodlights.'
        : 'Supplies acoustic sound reinforcement, audio mixer, microphones, and stage platform.',
      suggestedQuestions: [
        'Does the quote include an on-site sound technician throughout the evening?',
        'Are wireless microphones protected against frequency interference?',
        'Do you provide backup generator or UPS for uninterrupted audio?'
      ]
    },
    {
      vendorType: isDandiya ? 'Dandiya Theme Pandal & Lighting Decorator' : 'Festive Floral & Lighting Decorator',
      category: 'decor',
      leadTimeDays: 20,
      description: isDandiya
        ? 'Constructs ethnic colorful pandal draping, fairy lights canopy, and traditional selfie props booth.'
        : 'Builds welcome arch, stage backdrop, deity floral decorations, and campus fairy lights.',
      suggestedQuestions: [
        'Will fresh flowers and drapery be delivered and assembled morning of the event?',
        'Are the fairy lights industrial outdoor-grade with waterproof junctions?',
        'Does the teardown happen the same night or following morning?'
      ]
    },
    {
      vendorType: performerVendorType,
      category: 'performers',
      leadTimeDays: 25,
      description: performerVendorDesc,
      suggestedQuestions: [
        'How long is your performance set and are breaks included?',
        'Do you require specific audio inputs or DI boxes for your instruments?',
        'What are your green room and technical rider requirements?'
      ]
    },
    {
      vendorType: 'Event Photographer & Videographer',
      category: 'photography',
      leadTimeDays: 18,
      description: 'Documents cultural rituals, candid moments, and edits a highlight reel.',
      suggestedQuestions: [
        'What is the turnaround time for high-resolution edited photos?',
        'Will you capture a dedicated group photo of all society residents?',
        'Can you deliver a 60-second social media reel within 48 hours?'
      ]
    },
    {
      vendorType: 'Event Security & Fire Safety Agency',
      category: 'safety',
      leadTimeDays: 14,
      description: 'Provides trained security guards and rented fire safety gear.',
      suggestedQuestions: [
        'Can guards assist with traffic circulation and parking outside the gates?',
        'Are staff certified in basic first-aid and fire extinguisher deployment?',
        'Do they come with uniform and badges?'
      ]
    }
  ];
}


