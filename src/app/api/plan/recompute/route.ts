import { NextRequest, NextResponse } from 'next/server';
import { recomputeScenario } from '@/lib/engine/scenario';
import { BudgetPlan, TaskGraph, EventProfile, ScenarioInput } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      currentPlan,
      currentTasks,
      profile,
      inputChanges
    }: {
      currentPlan: BudgetPlan;
      currentTasks: TaskGraph;
      profile: EventProfile;
      inputChanges: ScenarioInput;
    } = body;

    const result = recomputeScenario(currentPlan, currentTasks, profile, inputChanges);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (err: any) {
    console.error('API /api/plan/recompute error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

