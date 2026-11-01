import { NextRequest, NextResponse } from 'next/server';
import { EventProfile, EventPlan, RunSheetEntry } from '@/lib/types';
import { allocateBudget } from '@/lib/engine/budget';
import { scheduleBackward } from '@/lib/engine/timeline';
import { generateVendorChecklist } from '@/lib/engine/vendor';
import { detectEventArchetype } from '@/lib/constants/cultural';
import { getLLMProvider } from '@/lib/llm';

export async function POST(req: NextRequest) {
  try {
    const profile: EventProfile = await req.json();

    // 1. Deterministic allocation and scheduling
    const budget = allocateBudget(profile);
    const tasks = scheduleBackward(profile);
    const vendors = generateVendorChecklist(profile, budget, tasks);

    // 2. Generate initial Day-of run sheet matching the specific event archetype
    const archetype = detectEventArchetype(profile);
    const isDandiya = archetype === 'dandiya_garba';
    const isCultural = archetype === 'cultural_night';

    const runSheet: RunSheetEntry[] = [
      {
        id: 'rs-1',
        eventId: profile.id,
        time: '14:00',
        activity: isDandiya
          ? 'Dance Lawn Platform, Truss & Generator Setup'
          : 'Stage, Truss & Power Generator Setup',
        responsible: 'Stage Vendor + Electrical Volunteer',
        notes: isDandiya
          ? 'Inspect lawn dance floor safety, ground levelness, and cable covers.'
          : 'Inspect main stage platform stability and ground cables safely.',
        isUserEdited: false,
        status: 'pending',
        sourceTaskId: null
      },
      {
        id: 'rs-2',
        eventId: profile.id,
        time: '15:30',
        activity: isDandiya
          ? 'High-Bass Sound System & DJ Acoustic Check'
          : 'Sound System Acoustic Sound Check',
        responsible: 'Sound Vendor + Cultural Lead',
        notes: isDandiya
          ? 'Test heavy-bass audio coverage across open dance circle and wireless mics.'
          : 'Check all cordless microphones and audio balance.',
        isUserEdited: false,
        status: 'pending',
        sourceTaskId: null
      },
      {
        id: 'rs-3',
        eventId: profile.id,
        time: '16:30',
        activity: isDandiya
          ? 'Ethnic Pandal Decor, Fairy Light Canopy & Selfie Booth Ready'
          : 'Floral Entrance & Rangoli Decor Completion',
        responsible: 'Decor Vendor + Welcome Volunteer Team',
        notes: isDandiya
          ? 'Inspect vibrant canopy, photo booth props, and pathway fairy lights.'
          : 'Light traditional brass lamps and prepare deity altar.',
        isUserEdited: false,
        status: 'pending',
        sourceTaskId: null
      },
      {
        id: 'rs-4',
        eventId: profile.id,
        time: '17:30',
        activity: 'Security Guard Briefing & Volunteer Check-in',
        responsible: 'Safety Head & Volunteer Convener',
        notes: 'Distribute badges, flashlights, and first-aid kits.',
        isUserEdited: false,
        status: 'pending',
        sourceTaskId: null
      },
      {
        id: 'rs-5',
        eventId: profile.id,
        time: '18:00',
        activity: isDandiya
          ? 'Resident Arrival, Wristband Check-in & Dandiya Sticks Distribution'
          : isCultural
          ? 'Guest Arrival, Auditorium Seating & Welcome Drinks'
          : 'Resident Arrival, Welcome Tilak & Consecrated Prasad Distribution',
        responsible: 'Hospitality Committee',
        notes: isDandiya
          ? 'Hand out wooden Dandiya sticks, check entry tokens, and guide dancers to lawn.'
          : 'Elderly seating assistance near stage.',
        isUserEdited: false,
        status: 'pending',
        sourceTaskId: null
      },
      {
        id: 'rs-6',
        eventId: profile.id,
        time: '18:45',
        activity: isDandiya
          ? 'Opening Traditional Aarti & Live Dhol High-Energy Garba Rounds'
          : 'Cultural Performances & Live Folk Music Troupe',
        responsible: isDandiya ? 'Dhol Troupe, Singer & Emcee' : 'Emcee & Artists',
        notes: isDandiya
          ? 'Traditional 2-clapping garba circles progressing into high-tempo live dhol beats.'
          : 'Society kids performance followed by main folk troupe.',
        isUserEdited: false,
        status: 'pending',
        sourceTaskId: null
      },
      {
        id: 'rs-7',
        eventId: profile.id,
        time: '20:15',
        activity: isDandiya
          ? 'Dinner Buffet & Festive Snack Counters Open'
          : 'Grand Community Festive Dinner Buffet Opens',
        responsible: 'Caterer & Food Volunteers',
        notes: 'Manage 2 simultaneous buffet lines for 200+ guests.',
        isUserEdited: false,
        status: 'pending',
        sourceTaskId: null
      },
      {
        id: 'rs-8',
        eventId: profile.id,
        time: '22:00',
        activity: isDandiya
          ? 'Best Attire & Dancer Awards, Sanedo Finale & Teardown'
          : 'Event Conclusion, Eco-friendly Cleanup & Vendor Teardown',
        responsible: 'Youth Volunteer Brigade',
        notes: 'Loudspeaker shut-off strictly adhering to municipal 10 PM rule.',
        isUserEdited: false,
        status: 'pending',
        sourceTaskId: null
      }
    ];

    // 3. Request LLM explanations for budget categories
    try {
      const provider = getLLMProvider();
      const explainRes = await provider.generateExplanations(budget, profile);
      const explainMap = new Map(explainRes.explanations.map(e => [e.targetId, e.why]));

      budget.categories.forEach(cat => {
        const customWhy = explainMap.get(cat.slug);
        if (customWhy) {
          cat.why = customWhy;
        }
      });
    } catch (err) {
      console.warn('Explain Agent non-fatal error:', err);
    }

    const fullPlan: EventPlan = {
      profile,
      budget,
      tasks,
      vendors,
      runSheet,
      chatHistory: [],
      scenarios: []
    };

    return NextResponse.json({
      success: true,
      data: fullPlan
    });
  } catch (err: any) {
    console.error('API /api/plan/generate error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

