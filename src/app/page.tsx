'use client';

import React, { useState } from 'react';
import { EventProvider, useEvent } from '@/context/EventContext';
import { Navbar } from '@/components/layout/Navbar';
import { IntakeChat } from '@/components/chat/IntakeChat';
import { LiveProfileCard } from '@/components/chat/LiveProfileCard';
import { BudgetBreakdown } from '@/components/dashboard/BudgetBreakdown';
import { TimelineView } from '@/components/dashboard/TimelineView';
import { WhatIfSimulator } from '@/components/what-if/WhatIfSimulator';
import { VendorChecklist } from '@/components/vendors/VendorChecklist';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import { DayOfRunSheet } from '@/components/tasks/DayOfRunSheet';
import { EventProfile, EventPlan, BudgetCategorySlug } from '@/lib/types';
import confetti from 'canvas-confetti';

function AppContent() {
  const {
    plan,
    activeTab,
    setActiveTab,
    commitGeneratedPlan,
    applyWhatIfScenario,
    updateTaskStatus,
    updateVendorStatus,
    updateRunSheetEntry,
    startPriyaDemo,
    isDemoRunning
  } = useEvent();

  // Temporary local state for intake draft if no plan exists yet
  const [draftProfile, setDraftProfile] = useState<Partial<EventProfile>>({
    eventType: 'community',
    eventSubType: 'festival',
    eventName: 'Society Festival Celebration 2026',
    planningStartDate: '2026-11-01',
    totalBudget: { amount: 400000, currency: 'INR' },
    guestCount: 200,
    guestMix: { family: 50, elders: 20, kids: 20, colleagues: 5, friends: 5 },
    experienceTier: 'normal',
    priorities: { top2: ['food_prasad', 'stage_sound'], notes: '' },
    location: { city: 'Bengaluru' },
    specialRequirements: [],
    profileCompleteness: 60,
    intakeStatus: 'in_progress'
  });

  const [isGenerating, setIsGenerating] = useState(false);

  // Compute completeness
  const completeness = React.useMemo(() => {
    let score = 20;
    if (draftProfile.eventSubType) score += 20;
    if (draftProfile.eventDate) score += 20;
    if (draftProfile.totalBudget?.amount) score += 20;
    if (draftProfile.guestCount) score += 20;
    return Math.min(100, score);
  }, [draftProfile]);

  const handleProfileUpdate = (update: Partial<EventProfile>) => {
    setDraftProfile(prev => ({
      ...prev,
      ...update,
      totalBudget: update.totalBudget || prev.totalBudget,
      priorities: update.priorities || prev.priorities,
      location: update.location || prev.location
    }));
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);

    const fullProfile: EventProfile = {
      id: `event-${Date.now()}`,
      eventType: 'community',
      eventSubType: draftProfile.eventSubType || 'festival',
      eventName: draftProfile.eventName || 'Society Cultural Festival 2026',
      eventDate: draftProfile.eventDate || '2026-12-15',
      planningStartDate: draftProfile.planningStartDate || new Date().toISOString().split('T')[0],
      totalBudget: draftProfile.totalBudget || { amount: 400000, currency: 'INR' },
      guestCount: draftProfile.guestCount || 200,
      guestMix: draftProfile.guestMix || { family: 50, elders: 20, kids: 20, colleagues: 5, friends: 5 },
      experienceTier: draftProfile.experienceTier || 'normal',
      priorities: draftProfile.priorities || { top2: ['food_prasad', 'stage_sound'], notes: '' },
      location: draftProfile.location || { city: 'Bengaluru' },
      specialRequirements: draftProfile.specialRequirements || [],
      profileCompleteness: 100,
      intakeStatus: 'complete',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullProfile)
      });
      const json = await res.json();
      if (json.success && json.data) {
        await commitGeneratedPlan(json.data);
        // Celebration confetti
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      }
    } catch (err) {
      console.error('Plan generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentProfile = plan ? plan.profile : (draftProfile as EventProfile);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 via-white to-orange-50/20 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB: Intake */}
        {activeTab === 'intake' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <IntakeChat
                currentProfile={draftProfile}
                onProfileUpdate={handleProfileUpdate}
                onGeneratePlan={handleGeneratePlan}
                isGenerating={isGenerating}
                onStartDemo={startPriyaDemo}
                isDemoRunning={isDemoRunning}
              />
            </div>
            <div className="lg:col-span-5">
              <LiveProfileCard
                profile={draftProfile}
                completeness={completeness}
                onGeneratePlan={handleGeneratePlan}
                isGenerating={isGenerating}
              />
            </div>
          </div>
        )}

        {/* TAB: Dashboard */}
        {activeTab === 'dashboard' && plan && (
          <div className="space-y-6">
            <BudgetBreakdown
              budget={plan.budget}
              onOpenWhatIf={() => setActiveTab('whatif')}
            />
            <TimelineView
              tasks={plan.tasks}
              eventDate={plan.profile.eventDate}
            />
          </div>
        )}

        {/* TAB: What-If */}
        {activeTab === 'whatif' && plan && (
          <WhatIfSimulator
            plan={plan}
            onApplyScenario={applyWhatIfScenario}
          />
        )}

        {/* TAB: Vendors */}
        {activeTab === 'vendors' && plan && (
          <VendorChecklist
            vendors={plan.vendors}
            profile={plan.profile}
            onUpdateStatus={updateVendorStatus}
          />
        )}

        {/* TAB: Tasks */}
        {activeTab === 'tasks' && plan && (
          <TaskBoard
            tasks={plan.tasks}
            onUpdateStatus={updateTaskStatus}
          />
        )}

        {/* TAB: Run Sheet */}
        {activeTab === 'runsheet' && plan && (
          <DayOfRunSheet
            runSheet={plan.runSheet}
            eventName={plan.profile.eventName}
            eventDate={plan.profile.eventDate}
            onUpdateEntry={updateRunSheetEntry}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 mt-8 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Event Co-pilot • Hack2Skills PromptWars 5 • Cultural Community Planner</span>
          <span className="font-mono text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
            All math deterministic • No LLM budget hallucinations
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500">Loading Event Co-pilot...</div>}>
      <EventProvider>
        <AppContent />
      </EventProvider>
    </React.Suspense>
  );
}
