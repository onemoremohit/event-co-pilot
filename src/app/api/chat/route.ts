import { NextRequest, NextResponse } from 'next/server';
import { getLLMProvider } from '@/lib/llm';
import { checkFeasibility } from '@/lib/engine/budget';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [], context = {} } = body;

    const provider = getLLMProvider();
    const intakeResponse = await provider.chat(messages, context);

    // Compute feasibility check if budget and guest count are present
    const budgetAmount = intakeResponse.profileUpdate?.budgetAmount || context.currentProfile?.totalBudget?.amount;
    const guestCount = intakeResponse.profileUpdate?.guestCount || context.currentProfile?.guestCount;

    let feasibility = null;
    if (budgetAmount && guestCount) {
      feasibility = checkFeasibility(budgetAmount, guestCount, context.currentProfile);
    }

    return NextResponse.json({
      success: true,
      data: intakeResponse,
      feasibility
    });
  } catch (err: any) {
    console.error('API /api/chat error:', err);
    // Graceful fallback response
    return NextResponse.json({
      success: true,
      data: {
        message: 'I am here to help you plan your community festival. Could you tell me your target event date or estimated guest count?',
        suggestedQuickReplies: ['Dec 15th', '200 guests', '₹4,00,000 budget'],
        isComplete: false
      }
    });
  }
}

