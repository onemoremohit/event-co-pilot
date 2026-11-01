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

