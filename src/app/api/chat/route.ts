import { NextRequest, NextResponse } from 'next/server';
import { getLLMProvider } from '@/lib/llm';
import { checkFeasibility } from '@/lib/engine/budget';
import { resolveLocationTier } from '@/lib/engine/location';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [], context = {} } = body;

    const provider = getLLMProvider();
    const intakeResponse = await provider.chat(messages, context);

    // If city was extracted, resolve its location tier
    if (intakeResponse.profileUpdate?.city && !intakeResponse.profileUpdate.locationTier) {
      const locRes = resolveLocationTier(intakeResponse.profileUpdate.city);
      intakeResponse.profileUpdate.locationTier = locRes.tier;
    }

    // Compute feasibility check if budget and guest count are present
    const budgetAmount = intakeResponse.profileUpdate?.budgetAmount || context.currentProfile?.totalBudget?.amount;
    const guestCount = intakeResponse.profileUpdate?.guestCount || context.currentProfile?.guestCount;
    const city = intakeResponse.profileUpdate?.city || context.currentProfile?.location?.city;
    const locTier = intakeResponse.profileUpdate?.locationTier || context.currentProfile?.location?.tier || resolveLocationTier(city).tier;

    let feasibility = null;
    if (budgetAmount && guestCount) {
      feasibility = checkFeasibility(budgetAmount, guestCount, {
        ...context.currentProfile,
        location: { city: city || '', tier: locTier }
      }, locTier);
    }

    return NextResponse.json({
      success: true,
      data: intakeResponse,
      feasibility,
      provider: provider.name
    });
  } catch (err: any) {
    console.error('API /api/chat error:', err);
    // Graceful fallback response
    return NextResponse.json({
      success: true,
      data: {
        message: 'Could you tell me your target event date or planned budget in INR?',
        suggestedQuickReplies: ['₹4,00,000 budget', '200 guests', 'In 6 weeks'],
        isComplete: false
      },
      provider: 'MockFallback'
    });
  }
}
