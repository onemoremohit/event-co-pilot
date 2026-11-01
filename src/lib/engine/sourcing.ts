import { BudgetCategorySlug, EventSubType } from '../types';
import { LocationTier, getCategoryLocationMultiplier } from './location';

export type SourcingMode =
  | 'community_sourced'
  | 'minimal_paid'
  | 'standard_paid'
  | 'enhanced_paid'
  | 'premium_paid';

export type CategoryCriticality = 'essential' | 'important' | 'optional';

export interface SourcingModeDefinition {
  mode: SourcingMode;
  label: string;
  badgeColor: string;
  costModel: {
    fixedBase: number;
    perHeadBase: number;
  };
  deliverables: string;
  volunteerTasks: string[];
  sponsorAsks: string[];
}

export interface CategorySourcingConfig {
  slug: BudgetCategorySlug;
  label: string;
  shortLabel: string;
  criticality: Record<EventSubType, CategoryCriticality>;
  modes: Record<SourcingMode, SourcingModeDefinition>;
}

export const SOURCING_MODE_ORDER: SourcingMode[] = [
  'community_sourced',
  'minimal_paid',
  'standard_paid',
  'enhanced_paid',
  'premium_paid'
];

/**
 * Rich sourcing mode catalog for all 9 cultural celebration categories.
 * Each mode specifies cost in base Tier-2 INR (which is scaled by location multiplier and guests),
 * concrete deliverables in plain language, volunteer tasks, and sponsor asks.
 */
export const CATEGORY_SOURCING_CONFIG: Record<BudgetCategorySlug, CategorySourcingConfig> = {
  venue_permissions: {
    slug: 'venue_permissions',
    label: 'Venue & Permissions',
    shortLabel: 'Venue',
    criticality: {
      festival: 'essential',
      cultural_night: 'essential',
      neighborhood: 'essential'
    },
    modes: {
      community_sourced: {
        mode: 'community_sourced',
        label: 'Community Sourced (₹0 Cash)',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        costModel: { fixedBase: 0, perHeadBase: 0 },
        deliverables: 'Society central courtyard, colony park, or local temple sabha hall secured free of charge.',
        volunteerTasks: [
          'Society secretary draft permission letter for colony park use',
          'Volunteer team sweep and clean the ground 24 hours prior',
          'Mark entrance and exit pathways with chalk'
        ],
        sponsorAsks: [
          'Request local resident association for free electricity hookup'
        ]
      },
      minimal_paid: {
        mode: 'minimal_paid',
        label: 'Minimal Paid Permit / Cleaning',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        costModel: { fixedBase: 3500, perHeadBase: 5 },
        deliverables: 'Municipal park sanction fee, police NOC stamp duty, plus hired post-event sanitation crew.',
        volunteerTasks: [
          'Submit NOC application to local ward office 10 days before',
          'Coordinate waste disposal bins with municipal sanitation supervisor'
        ],
        sponsorAsks: [
          'Ward councillor discretionary sanction waiver'
        ]
      },
      standard_paid: {
        mode: 'standard_paid',
        label: 'Standard Community Hall',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
        costModel: { fixedBase: 12000, perHeadBase: 25 },
        deliverables: 'Rented community hall / school auditorium with generator power backup, ceiling fans, and formal washrooms.',
        volunteerTasks: [
          'Inspect hall electrical points and water supply 3 days prior',
          'Manage parking queue outside hall gate'
        ],
        sponsorAsks: [
          'Nearby hospital or bank branch banner sponsorship on boundary wall'
        ]
      },
      enhanced_paid: {
        mode: 'enhanced_paid',
        label: 'Enhanced AC Banquet / Covered Pandal',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        costModel: { fixedBase: 35000, perHeadBase: 60 },
        deliverables: 'Weatherproof German hanger pandal on society ground or air-conditioned community auditorium with dedicated green rooms.',
        volunteerTasks: [
          'Hall liaison team oversee setup timeline and AC controls'
        ],
        sponsorAsks: [
          'Main gate entry arch branding for prominent local business'
        ]
      },
      premium_paid: {
        mode: 'premium_paid',
        label: 'Premium Cultural Grounds',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        costModel: { fixedBase: 90000, perHeadBase: 120 },
        deliverables: 'Commercial festival ground / resort lawn with heavy-duty power generators, VIP lounge, and valet clearance.',
        volunteerTasks: ['VIP escort and hospitality coordination'],
        sponsorAsks: ['Title sponsor title rights on main stage backboard']
      }
    }
  },

  stage_sound: {
    slug: 'stage_sound',
    label: 'Stage & Sound',
    shortLabel: 'Sound & Stage',
    criticality: {
      festival: 'important',
      cultural_night: 'essential',
      neighborhood: 'optional'
    },
    modes: {
      community_sourced: {
        mode: 'community_sourced',
        label: 'Community Sourced (Borrowed AV)',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        costModel: { fixedBase: 0, perHeadBase: 0 },
        deliverables: 'Borrowed society speaker system, resident Bluetooth portable speakers, and a makeshift stage from sturdy tables.',
        volunteerTasks: [
          'Collect 2 large portable party speakers from resident families',
          'Curate and download festival MP3 playlist offline to 2 phones',
          'Assemble 6 society folding tables and clamp together with bedsheet coverings'
        ],
        sponsorAsks: [
          'Ask resident electrical engineer to configure speaker soundboard'
        ]
      },
      minimal_paid: {
        mode: 'minimal_paid',
        label: 'Minimal PA Rental',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        costModel: { fixedBase: 4500, perHeadBase: 10 },
        deliverables: 'Rented 1000W PA system, 2 corded microphones, 1 wireless mic, and basic elevated wooden platform.',
        volunteerTasks: [
          'Assign 1 youth volunteer to sit with technician and manage audio cues',
          'Keep spare 9V batteries for wireless mic'
        ],
        sponsorAsks: [
          'Local music store banner on speaker stands'
        ]
      },
      standard_paid: {
        mode: 'standard_paid',
        label: 'Standard 2000W Sound & Stage',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
        costModel: { fixedBase: 16000, perHeadBase: 25 },
        deliverables: '20x16 ft stage with carpet, backdrop truss, 4-mic digital mixer, monitor speakers, and professional audio operator.',
        volunteerTasks: [
          'Stage MC coordination team oversee performer mic handovers'
        ],
        sponsorAsks: [
          'Co-sponsor sound rig for stage logo placement'
        ]
      },
      enhanced_paid: {
        mode: 'enhanced_paid',
        label: 'Enhanced Concert Sound & Lighting',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        costModel: { fixedBase: 45000, perHeadBase: 50 },
        deliverables: 'Line-array acoustic speakers, digital sound engineer, PAR LED stage wash, spot beams, and haze machine.',
        volunteerTasks: ['Artist sound check timekeeper'],
        sponsorAsks: ['Audio partner co-branding']
      },
      premium_paid: {
        mode: 'premium_paid',
        label: 'Concert-Grade Truss & P3 LED Wall',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        costModel: { fixedBase: 110000, perHeadBase: 100 },
        deliverables: 'Heavy aluminum box truss, P3 HD live LED backdrop wall, 12 moving heads, front-of-house sound console, and sound engineer team.',
        volunteerTasks: ['Console hospitality and stage cue direction'],
        sponsorAsks: ['Principal sponsor video ads played between performance sets']
      }
    }
  },

  decor: {
    slug: 'decor',
    label: 'Decor & Theme',
    shortLabel: 'Decor',
    criticality: {
      festival: 'important',
      cultural_night: 'important',
      neighborhood: 'optional'
    },
    modes: {
      community_sourced: {
        mode: 'community_sourced',
        label: 'Community DIY Decor (₹0 Cash)',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        costModel: { fixedBase: 0, perHeadBase: 0 },
        deliverables: 'Resident-crafted origami, traditional fabric dupattas, rangoli contest by children & elders, and borrowed home fairy lights.',
        volunteerTasks: [
          'Organize children & youth rangoli competition at entrance',
          'Collect 10 strands of Diwali/festival fairy lights from residents',
          'Use colorful dupattas and sarees from society families for stage drapery'
        ],
        sponsorAsks: [
          'Ask local nursery for 10 potted plants on loan for stage decoration'
        ]
      },
      minimal_paid: {
        mode: 'minimal_paid',
        label: 'Minimal Fresh Flowers & Paper Decor',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        costModel: { fixedBase: 3500, perHeadBase: 12 },
        deliverables: 'Wholesale marigold flower garlands for stage & entrance, printed cloth welcome banner, and paper lanterns.',
        volunteerTasks: [
          'Send 2 volunteers to morning wholesale flower mandi to purchase at trade rate',
          'Hang flower strings and string paper lanterns'
        ],
        sponsorAsks: [
          'Local flower vendor discount in exchange for flyer distribution'
        ]
      },
      standard_paid: {
        mode: 'standard_paid',
        label: 'Standard Themed Backdrop & Lighting',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
        costModel: { fixedBase: 15000, perHeadBase: 30 },
        deliverables: 'Fabric-draped stage backdrop, entrance arch with fresh floral bunches, pathway fairy light canopy, and photo selfie point.',
        volunteerTasks: ['Ensure selfie point has good lighting and volunteer photographer'],
        sponsorAsks: ['Selfie photo booth frame branded with sponsor logo']
      },
      enhanced_paid: {
        mode: 'enhanced_paid',
        label: 'Enhanced Floral & Ambient Illumination',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        costModel: { fixedBase: 40000, perHeadBase: 65 },
        deliverables: 'Designer thematic stage setup, exotic floral installations, ambient uplighting across trees, and bespoke entrance tunnel.',
        volunteerTasks: ['Monitor decor integrity throughout event'],
        sponsorAsks: ['Entrance tunnel powered by partner sponsor']
      },
      premium_paid: {
        mode: 'premium_paid',
        label: 'Luxury Experiential Theme Production',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        costModel: { fixedBase: 100000, perHeadBase: 130 },
        deliverables: 'Turnkey architectural decor, custom 3D sculpted sets, floral chandeliers, kinetic ceiling hangings, and synchronized lighting.',
        volunteerTasks: ['VIP guest guided walkthrough'],
        sponsorAsks: ['High-value title sponsor VIP zone showcase']
      }
    }
  },

  food_prasad: {
    slug: 'food_prasad',
    label: 'Food & Prasad',
    shortLabel: 'Food/Prasad',
    criticality: {
      festival: 'essential',
      cultural_night: 'important',
      neighborhood: 'essential'
    },
    modes: {
      community_sourced: {
        mode: 'community_sourced',
        label: 'Community Bhog / Potluck (₹0 Cash)',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        costModel: { fixedBase: 0, perHeadBase: 0 },
        deliverables: 'Family-contributed sweets & snacks, potluck dinner dishes from participating wings, or raw grain collections for temple prasad.',
        volunteerTasks: [
          'Create a potluck registration sheet (Wing A brings sweet, Wing B savory, Wing C rice/pulao)',
          'Set up 4 food serving tables and arrange eco-friendly paper plates',
          'Recruit 6 volunteers for prasad distribution queue'
        ],
        sponsorAsks: [
          'Ask local sweet mart to donate 5kg laddoos for prasad in exchange for announcement'
        ]
      },
      minimal_paid: {
        mode: 'minimal_paid',
        label: 'Minimal Prasad & Hot Chai/Snack',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        costModel: { fixedBase: 2000, perHeadBase: 45 },
        deliverables: 'Bulk-prepared halwa/sheera prasad, hot masala chai, and samosa/kachori pack for every attendee.',
        volunteerTasks: [
          'Bulk buy dry ingredients (rava, sugar, ghee) at wholesale grocery depot',
          'Form community kitchen team or hire 1 local halwai for morning batch preparation'
        ],
        sponsorAsks: [
          'Local dairy dealer sponsor milk and ghee'
        ]
      },
      standard_paid: {
        mode: 'standard_paid',
        label: 'Standard Community Feast (Bhojan/Dinner)',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
        costModel: { fixedBase: 8000, perHeadBase: 175 },
        deliverables: 'Full vegetarian buffet feast: Puri/Roti, Paneer vegetable, Dal/Chhole, Pulao, Gulab Jamun, Salad, and consecrated Prasad box.',
        volunteerTasks: [
          'Buffet counter crowd control and elder seating assistance'
        ],
        sponsorAsks: [
          'Beverage / packaged water bottle partner'
        ]
      },
      enhanced_paid: {
        mode: 'enhanced_paid',
        label: 'Enhanced Grand Multi-Course Feast',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        costModel: { fixedBase: 20000, perHeadBase: 320 },
        deliverables: 'Lavish traditional thali/buffet: 2 starters, 3 main gravies, live jalebi/chaat counter, welcome drink, ice-cream, and prasad.',
        volunteerTasks: ['Guest hospitality and VIP dining coordinator'],
        sponsorAsks: ['Live counter branded naming rights']
      },
      premium_paid: {
        mode: 'premium_paid',
        label: 'Premium Royal Banquet & Live Counters',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        costModel: { fixedBase: 50000, perHeadBase: 550 },
        deliverables: 'Executive catering with 4 live interactive counters, artisanal regional desserts, gourmet mocktails, uniformed silver-service staff.',
        volunteerTasks: ['Menu curation sign-off and banquet manager liaison'],
        sponsorAsks: ['Corporate catering sponsor exclusive dining pavilion']
      }
    }
  },

  performers: {
    slug: 'performers',
    label: 'Performers & Artists',
    shortLabel: 'Performers',
    criticality: {
      festival: 'important',
      cultural_night: 'essential',
      neighborhood: 'optional'
    },
    modes: {
      community_sourced: {
        mode: 'community_sourced',
        label: 'Society In-House Talent (₹0 Cash)',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        costModel: { fixedBase: 0, perHeadBase: 0 },
        deliverables: 'Society resident performances: children dance troupes, elder devotional choir (bhajan mandali), youth skits, and volunteer MC.',
        volunteerTasks: [
          'Conduct rehearsal schedule for society kids & youth in clubhouse',
          'Recruit charismatic resident volunteer as Master of Ceremonies (MC)',
          'Collect audio tracks for all resident dance items 3 days before'
        ],
        sponsorAsks: [
          'Ask local bookstore or academy to gift trophies/certificates for child performers'
        ]
      },
      minimal_paid: {
        mode: 'minimal_paid',
        label: 'Minimal Traditional Dhol / Folk Troupes',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        costModel: { fixedBase: 6000, perHeadBase: 5 },
        deliverables: '2-piece live Dhol/Tasha or Shenai percussion troupe for grand ceremonial welcome, plus token gifts for child participants.',
        volunteerTasks: [
          'Coordinate arrival and staging for dhol players at entrance gate',
          'Prepare gift hampers for performing kids'
        ],
        sponsorAsks: [
          'Local stationery store sponsor performer medals'
        ]
      },
      standard_paid: {
        mode: 'standard_paid',
        label: 'Standard Professional Cultural Troupe',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
        costModel: { fixedBase: 18000, perHeadBase: 15 },
        deliverables: 'Professional 6-piece folk dance/music ensemble (e.g. Garba troupe, Qawwali, or Classical dance troupe) + professional anchor.',
        volunteerTasks: ['Artist green room refreshments and timeline liaison'],
        sponsorAsks: ['Cultural performance presented by sponsor co-brand']
      },
      enhanced_paid: {
        mode: 'enhanced_paid',
        label: 'Enhanced Regional Band & Choreography',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        costModel: { fixedBase: 48000, perHeadBase: 30 },
        deliverables: 'Acclaimed regional fusion band, professional choreographer who trains society performers, and veteran celebrity host.',
        volunteerTasks: ['Band technical rider compliance and artist logistics'],
        sponsorAsks: ['Concert headliner segment powered by brand']
      },
      premium_paid: {
        mode: 'premium_paid',
        label: 'Celebrity Headliner & Touring Troupe',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        costModel: { fixedBase: 140000, perHeadBase: 60 },
        deliverables: 'Recognized playback singer or renowned national cultural troupe, full backing orchestra, green room riders, and artist security.',
        volunteerTasks: ['VIP artist escort and green room protocol'],
        sponsorAsks: ['Headlining artist meet-and-greet passes for sponsor executives']
      }
    }
  },

  volunteers: {
    slug: 'volunteers',
    label: 'Volunteers & Coordination',
    shortLabel: 'Volunteers',
    criticality: {
      festival: 'important',
      cultural_night: 'important',
      neighborhood: 'essential'
    },
    modes: {
      community_sourced: {
        mode: 'community_sourced',
        label: 'Pure Resident Volunteers (₹0 Cash)',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        costModel: { fixedBase: 0, perHeadBase: 0 },
        deliverables: 'Dedicated resident committee: WhatsApp coordination group, printed paper badges, and volunteer task rotations.',
        volunteerTasks: [
          'Create WhatsApp volunteers group and assign Wing Captains',
          'Hold 30-minute volunteer briefing 48 hours before event',
          'Handwrite colored paper volunteer badges with safety pins'
        ],
        sponsorAsks: [
          'Local photocopy shop sponsor free printing of badges and schedules'
        ]
      },
      minimal_paid: {
        mode: 'minimal_paid',
        label: 'Minimal Caps, Badges & Refreshments',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        costModel: { fixedBase: 1200, perHeadBase: 12 },
        deliverables: 'Printed volunteer identification caps/sashes, clipboards, water bottles, and tea-snack packs for all 15-20 on-duty volunteers.',
        volunteerTasks: [
          'Distribute kit bags and maintain duty attendance register'
        ],
        sponsorAsks: [
          'Pharmacy sponsor energy drinks and glucose for volunteers'
        ]
      },
      standard_paid: {
        mode: 'standard_paid',
        label: 'Standard Branded Volunteer Gear & Food',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
        costModel: { fixedBase: 5000, perHeadBase: 25 },
        deliverables: 'Custom printed commemorative event T-shirts for volunteer corps, laminated all-access passes, walkie-talkie sets, and post-event dinner.',
        volunteerTasks: ['Walkie-talkie channel protocol and radio checks'],
        sponsorAsks: ['T-shirt sleeve sponsor logo from local builder or gym']
      },
      enhanced_paid: {
        mode: 'enhanced_paid',
        label: 'Enhanced Event Operations Management',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        costModel: { fixedBase: 15000, perHeadBase: 40 },
        deliverables: 'Professional operations coordinator assisting committee, digital volunteer app, event merchandise, and thank-you mementos.',
        volunteerTasks: ['Committee supervisory roles alongside professional manager'],
        sponsorAsks: ['Volunteer brigade presented by title brand']
      },
      premium_paid: {
        mode: 'premium_paid',
        label: 'Full Turnkey Event Crew',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        costModel: { fixedBase: 35000, perHeadBase: 70 },
        deliverables: 'Full-service event management floor team, backstage runners, professional ushering staff, and volunteer awards gala dinner.',
        volunteerTasks: ['Core executive committee oversight only'],
        sponsorAsks: ['Corporate volunteer apparel partnership']
      }
    }
  },

  safety: {
    slug: 'safety',
    label: 'Safety & Crowd Management',
    shortLabel: 'Safety & Crowd',
    criticality: {
      festival: 'essential',
      cultural_night: 'essential',
      neighborhood: 'essential'
    },
    modes: {
      community_sourced: {
        mode: 'community_sourced',
        label: 'Volunteer First-Aid & Society Guards (₹0 Cash)',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        costModel: { fixedBase: 0, perHeadBase: 0 },
        deliverables: 'Resident doctor volunteer first-aid desk, society main gate security guards on routine duty, and building fire extinguishers on standby.',
        volunteerTasks: [
          'Identify resident doctor or nurse willing to oversee the first-aid desk',
          'Inspect and relocate 3 society building ABC powder fire extinguishers to stage & food areas',
          'Designate emergency exit lane clear of any parked two-wheelers'
        ],
        sponsorAsks: [
          'Local pharmacy sponsor a comprehensive first-aid and burn kit'
        ]
      },
      minimal_paid: {
        mode: 'minimal_paid',
        label: 'Minimal Hired Security & Basic Barricades',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        costModel: { fixedBase: 2500, perHeadBase: 12 },
        deliverables: '2 extra hired security guards for crowd management, rope queue barricading, and commercial emergency torch lights.',
        volunteerTasks: [
          'Brief hired guards on resident vs guest visitor protocols'
        ],
        sponsorAsks: [
          'Security agency provide extra guard pro-bono in exchange for flyers'
        ]
      },
      standard_paid: {
        mode: 'standard_paid',
        label: 'Standard Security Guards & Metal Barricades',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
        costModel: { fixedBase: 8000, perHeadBase: 25 },
        deliverables: '4 uniformed security guards, metal queue barricades for stage & dining, stand-by certified paramedic with oxygen kit, and fire marshal check.',
        volunteerTasks: ['Oversee gate wristband or registration scanning'],
        sponsorAsks: ['Private hospital ambulance standby sponsorship']
      },
      enhanced_paid: {
        mode: 'enhanced_paid',
        label: 'Enhanced Crowd Flow & On-Site Ambulance',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        costModel: { fixedBase: 22000, perHeadBase: 45 },
        deliverables: 'Dedicated on-site standby ambulance with nurse, 8 security bouncers, CCTV surveillance on main gate, and hand-held metal detectors.',
        volunteerTasks: ['Security control room liaison'],
        sponsorAsks: ['Healthcare provider health checkup camp booth at entrance']
      },
      premium_paid: {
        mode: 'premium_paid',
        label: 'Comprehensive Emergency & Crowd Command',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        costModel: { fixedBase: 55000, perHeadBase: 80 },
        deliverables: 'Professional crowd control command team, rapid response medical emergency hub, full perimeter mojo barriers, and fire brigade standby tender.',
        volunteerTasks: ['Emergency crisis management executive sign-off'],
        sponsorAsks: ['Major insurer disaster & safety risk sponsorship']
      }
    }
  },

  photography: {
    slug: 'photography',
    label: 'Photography & Video',
    shortLabel: 'Photography',
    criticality: {
      festival: 'optional',
      cultural_night: 'important',
      neighborhood: 'optional'
    },
    modes: {
      community_sourced: {
        mode: 'community_sourced',
        label: 'Community Mobile & Amateur Photographers (₹0 Cash)',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        costModel: { fixedBase: 0, perHeadBase: 0 },
        deliverables: 'Resident DSLR camera enthusiasts, shared Google Drive photo upload link with QR code, and smartphone photo booth.',
        volunteerTasks: [
          'Recruit 2 resident hobbyist photographers with DSLR cameras',
          'Create shared Google Photos / Drive album and print QR code posters across the venue',
          'Create a 60-second highlight reel on Instagram Reels / WhatsApp Status within 24 hours'
        ],
        sponsorAsks: [
          'Local photo studio print 20 complimentary 4x6 highlight prints for winners'
        ]
      },
      minimal_paid: {
        mode: 'minimal_paid',
        label: 'Minimal Local Photographer Rental',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        costModel: { fixedBase: 4000, perHeadBase: 5 },
        deliverables: '1 hired local neighborhood studio photographer for 3 hours, capturing stage highlights, lamp lighting, and award ceremonies.',
        volunteerTasks: [
          'Provide shot checklist (MC, lighting of lamp, group family photo) to photographer'
        ],
        sponsorAsks: [
          'Studio watermark on shared community photo album'
        ]
      },
      standard_paid: {
        mode: 'standard_paid',
        label: 'Standard Photo + 1080p Video Coverage',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
        costModel: { fixedBase: 12000, perHeadBase: 15 },
        deliverables: '1 professional still photographer + 1 dedicated HD videographer, high-res edited event gallery, and a 3-minute cinematic highlight video.',
        volunteerTasks: ['Stage access escort for videographer during performances'],
        sponsorAsks: ['Cinematic video sponsor title card']
      },
      enhanced_paid: {
        mode: 'enhanced_paid',
        label: 'Enhanced Drone & Live Streaming',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        costModel: { fixedBase: 30000, perHeadBase: 30 },
        deliverables: 'Multi-camera team (2 photo + 1 video), drone aerial coverage, live YouTube/Facebook streaming for family members abroad, and same-night teaser.',
        volunteerTasks: ['Live stream monitor and chat moderating'],
        sponsorAsks: ['Live stream digital banner overlay']
      },
      premium_paid: {
        mode: 'premium_paid',
        label: 'Cinema-Grade Production & 360 Spin Booth',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        costModel: { fixedBase: 70000, perHeadBase: 60 },
        deliverables: '3-camera 4K cinema crew, jimmy jib crane over stage, interactive 360-degree video booth for guests with instant AirDrop, and archival hard drive.',
        volunteerTasks: ['Guest photo souvenir desk oversight'],
        sponsorAsks: ['360 video booth platform branded wrap']
      }
    }
  },

  misc: {
    slug: 'misc',
    label: 'Miscellaneous & Contingency Support',
    shortLabel: 'Misc & Buffer',
    criticality: {
      festival: 'optional',
      cultural_night: 'optional',
      neighborhood: 'optional'
    },
    modes: {
      community_sourced: {
        mode: 'community_sourced',
        label: 'Resident Supplies & Tape/Cables (₹0 Cash)',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        costModel: { fixedBase: 0, perHeadBase: 0 },
        deliverables: 'Borrowed extension cords, masking tape, scissors, trash bags, and safety pins collected from resident committee homes.',
        volunteerTasks: [
          'Collect 5 extension boards, 3 spike guards, and scissors into an emergency utility kit bag',
          'Bring 2 rolls of brown packing tape and garbage bags from society store room'
        ],
        sponsorAsks: [
          'Hardware store provide heavy duty duct tape and zip ties'
        ]
      },
      minimal_paid: {
        mode: 'minimal_paid',
        label: 'Minimal Hardware, Power & Waste Kit',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        costModel: { fixedBase: 1500, perHeadBase: 5 },
        deliverables: 'Heavy duty extension cables, waste disposal bin bags, stage zip ties, marker pens, and emergency LED rechargeable lanterns.',
        volunteerTasks: ['Utility station volunteer on standby with toolkit'],
        sponsorAsks: ['Local hardware dealer complimentary waste bins']
      },
      standard_paid: {
        mode: 'standard_paid',
        label: 'Standard Logistics & Backup Generator Fuel',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
        costModel: { fixedBase: 6000, perHeadBase: 12 },
        deliverables: 'Diesel fuel backup for generator (4 hours), walkie-talkie batteries, printing of schedules, emergency transport vehicle on standby.',
        volunteerTasks: ['Monitor generator diesel levels and switchover drills'],
        sponsorAsks: ['Auto/cab service partner emergency standby vehicle']
      },
      enhanced_paid: {
        mode: 'enhanced_paid',
        label: 'Enhanced Operations & Event Insurance',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        costModel: { fixedBase: 18000, perHeadBase: 25 },
        deliverables: 'Single-day public liability event insurance cover, dedicated utility pickup van, and backup electrical engineer on retainer.',
        volunteerTasks: ['Insurance documentation liaison'],
        sponsorAsks: ['Insurance broker co-sponsorship']
      },
      premium_paid: {
        mode: 'premium_paid',
        label: 'Comprehensive Contingency & Premium Insurance',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        costModel: { fixedBase: 40000, perHeadBase: 45 },
        deliverables: 'Comprehensive multi-risk event policy, dual redundant diesel silent generators, dedicated standby transport fleet, and executive hospitality suite.',
        volunteerTasks: ['Executive risk signoff and incident room'],
        sponsorAsks: ['Corporate risk underwriting partner']
      }
    }
  }
};

/**
 * Computes cash cost in INR for a category given a sourcing mode, guest count, and location tier.
 * Community sourced mode is ALWAYS ₹0 cash cost.
 */
export function computeSourcingModeCost(
  slug: BudgetCategorySlug,
  mode: SourcingMode,
  guests: number,
  locTier: LocationTier
): number {
  if (mode === 'community_sourced') {
    return 0;
  }

  const def = CATEGORY_SOURCING_CONFIG[slug].modes[mode];
  const locMultiplier = getCategoryLocationMultiplier(locTier, slug);
  const rawCost = def.costModel.fixedBase + (def.costModel.perHeadBase * Math.max(1, guests));

  return Math.round(rawCost * locMultiplier);
}

import { EventArchetype } from '../constants/cultural';

export interface SourcingDetails {
  mode: SourcingMode;
  label: string;
  badgeColor: string;
  deliverables: string;
  volunteerTasks: string[];
  sponsorAsks: string[];
}

/**
 * Returns archetype-aware sourcing mode details.
 * Removes prasad references for Dandiya/Garba, Cultural Nights, and Neighborhood Gatherings.
 */
export function getCategorySourcingDetails(
  slug: BudgetCategorySlug,
  mode: SourcingMode,
  archetype: EventArchetype = 'pooja_religious'
): SourcingDetails {
  const baseMode = CATEGORY_SOURCING_CONFIG[slug].modes[mode];

  if (slug === 'food_prasad' && archetype === 'dandiya_garba') {
    if (mode === 'community_sourced') {
      return {
        ...baseMode,
        label: 'Community Potluck & Snacks (₹0 Cash)',
        deliverables: 'Participating families bring regional savory snacks (farsan, dhokla, samosas) and sweets; resident volunteer-managed distribution.',
        volunteerTasks: [
          'Create snack counter registration sheet (Wing A brings sweet, Wing B savory farsan)',
          'Set up 4 food serving tables and arrange eco-friendly paper plates',
          'Recruit 6 volunteers for dancer snack counter and queue coordination',
          'Manage continuous water hydration dispensers around dance circle'
        ],
        sponsorAsks: [
          'Ask local sweet mart to donate 5kg sweets in exchange for banner announcement'
        ]
      };
    }
    if (mode === 'minimal_paid') {
      return {
        ...baseMode,
        label: 'Chaat Stalls & Hot Chai/Snack Pack',
        deliverables: 'Live pav bhaji / chaat counters, hot tea/coffee, and boxed snacks for dancers.',
        volunteerTasks: [
          'Coordinate snack coupon distribution desk',
          'Ensure hydration points near dancing lawn are continuously replenished'
        ]
      };
    }
    if (mode === 'standard_paid') {
      return {
        ...baseMode,
        label: 'Standard Festive Dinner Buffet',
        deliverables: 'Full vegetarian buffet feast: Puri/Roti, Paneer vegetable, Dal/Chhole, Pulao, Gulab Jamun, and soft beverages.',
        volunteerTasks: [
          'Buffet counter crowd control and elder seating assistance'
        ]
      };
    }
    if (mode === 'enhanced_paid') {
      return {
        ...baseMode,
        label: 'Enhanced Multi-Cuisine Feast & Live Stalls',
        deliverables: 'Buffet feast plus 3 live counters (Chaat, Dosa, Jalebi-Fafda), welcome coolers, and dessert station.',
        volunteerTasks: ['Guest hospitality and VIP dining coordinator']
      };
    }
    if (mode === 'premium_paid') {
      return {
        ...baseMode,
        label: 'Premium Gourmet Feast & Mocktail Lounge',
        deliverables: 'Executive festive dining with 4 live stations, artisanal regional spread, mocktails, and uniformed banquet staff.',
        volunteerTasks: ['Menu curation sign-off and banquet manager liaison']
      };
    }
  }

  if (slug === 'food_prasad' && archetype === 'cultural_night') {
    if (mode === 'community_sourced') {
      return {
        ...baseMode,
        label: 'Resident Community Potluck (₹0 Cash)',
        deliverables: 'Resident-contributed dishes for post-event community dinner and artist green room hospitality.',
        volunteerTasks: [
          'Coordinate wing-wise dinner contribution sheet',
          'Stage crew & artist hospitality food liaison'
        ]
      };
    }
    if (mode === 'minimal_paid') {
      return {
        ...baseMode,
        label: 'High Tea & Intermission Snack Pack',
        deliverables: 'Fresh tea, coffee, samosas/cookies, and artist refreshment boxes.'
      };
    }
    if (mode === 'standard_paid') {
      return {
        ...baseMode,
        label: 'Standard Post-Event Dinner Buffet',
        deliverables: 'Full multi-course vegetarian dinner buffet after the performances conclude.'
      };
    }
  }

  if (slug === 'food_prasad' && archetype === 'neighborhood_gathering') {
    if (mode === 'community_sourced') {
      return {
        ...baseMode,
        label: 'Neighborhood Community Potluck (₹0 Cash)',
        deliverables: 'Shared neighborhood snacks, home-cooked dishes, and tea station organized by resident volunteers.'
      };
    }
    if (mode === 'minimal_paid') {
      return {
        ...baseMode,
        label: 'Community High Tea & Evening Snacks',
        deliverables: 'Masala chai, biscuits, samosas, and cold bottled water.'
      };
    }
  }

  return baseMode;
}
