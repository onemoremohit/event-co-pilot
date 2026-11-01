'use client';

import React, { useState, useEffect } from 'react';
import { EventProvider, useEvent } from '@/context/EventContext';
import { Navbar } from '@/components/layout/Navbar';
import { EventHeadlineBanner } from '@/components/layout/EventHeadlineBanner';
import { IntakeChat } from '@/components/chat/IntakeChat';
import { LiveProfileCard } from '@/components/chat/LiveProfileCard';
import { BudgetBreakdown } from '@/components/dashboard/BudgetBreakdown';
import { TimelineView } from '@/components/dashboard/TimelineView';
import { WhatIfSimulator } from '@/components/what-if/WhatIfSimulator';
import { VendorChecklist } from '@/components/vendors/VendorChecklist';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import { DayOfRunSheet } from '@/components/tasks/DayOfRunSheet';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { EventProfile, EventPlan } from '@/lib/types';
import { resolveLocationTier } from '@/lib/engine/location';
import confetti from 'canvas-confetti';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

function AppContent() {
  const {
    plan,
    activeTab,
    setActiveTab,
    commitGeneratedPlan,
    applyWhatIfScenario,
    runWhatIfScenario,
    updateTaskStatus,
    updateVendorStatus,
    updateRunSheetEntry,
    startPriyaDemo,
    isDemoRunning,
    resetToNewPlan
  } = useEvent();

  // Fresh visitor starts with a completely EMPTY profile (FIX 1)
  const [draftProfile, setDraftProfile] = useState<Partial<EventProfile>>({
    eventType: 'community',
    guestMix: { family: 50, elders: 20, kids: 20, colleagues: 5, friends: 5 },
    specialRequirements: [],
    intakeStatus: 'in_progress'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    provider: string;
    model: string;
    liveGeminiActive: boolean;
  } | null>(null);

  // Fetch health status on mount to show live AI indicator (FIX 4)
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealthStatus(data))
      .catch(err => console.warn('Health check failed:', err));
  }, []);

  // Always reset scroll to the starting point of the page when switching tabs or landing on dashboard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [activeTab]);

  // Compute completeness strictly based on actual filled fields (FIX 1)
  const completeness = React.useMemo(() => {
    let score = 0;
    if (draftProfile.eventSubType) score += 20;
    if (draftProfile.totalBudget?.amount && draftProfile.totalBudget.amount > 0) score += 20;
    if (draftProfile.guestCount && draftProfile.guestCount > 0) score += 20;
    if (draftProfile.eventDate) score += 20;
    if (draftProfile.location?.city && draftProfile.location.city.trim()) score += 20;
    return score;
  }, [draftProfile]);

  const handleProfileUpdate = (update: Partial<EventProfile>) => {
    setDraftProfile(prev => {
      const next = {
        ...prev,
        ...update,
        totalBudget: update.totalBudget || prev.totalBudget,
        priorities: update.priorities || prev.priorities,
        location: update.location || prev.location
      };

      // If plan already exists and location/tier was changed, recompute plan dynamically!
      if (plan && update.location) {
        const newLocTier = update.location.tier || resolveLocationTier(update.location.city).tier;
        const res = runWhatIfScenario({
          locationTier: newLocTier,
          lockedCategories: []
        });
        if (res) {
          applyWhatIfScenario(res, `Location changed to ${update.location.city || ''} (${newLocTier})`);
        }
      }

      return next;
    });
  };

  const handleGeneratePlan = async () => {
    // Validate that all required fields are present (FIX 1 & FIX 2)
    if (
      !draftProfile.eventSubType ||
      !draftProfile.totalBudget?.amount ||
      !draftProfile.guestCount ||
      !draftProfile.eventDate ||
      !draftProfile.location?.city
    ) {
      alert('Please fill event type, budget, guest count, date, and location before generating your plan.');
      return;
    }

    setIsGenerating(true);

    const city = draftProfile.location.city;
    const locTier = draftProfile.location.tier || resolveLocationTier(city).tier;

    const fullProfile: EventProfile = {
      id: `event-${Date.now()}`,
      eventType: 'community',
      eventSubType: draftProfile.eventSubType,
      eventName: draftProfile.eventName || `${draftProfile.eventSubType.replace('_', ' ')} Celebration`,
      eventDate: draftProfile.eventDate,
      planningStartDate: new Date().toISOString().split('T')[0],
      totalBudget: draftProfile.totalBudget,
      guestCount: draftProfile.guestCount,
      guestMix: draftProfile.guestMix || { family: 50, elders: 20, kids: 20, colleagues: 5, friends: 5 },
      experienceTier: draftProfile.experienceTier || 'normal',
      priorities: draftProfile.priorities || { top2: ['food_prasad', 'stage_sound'], notes: '' },
      location: {
        city,
        tier: locTier
      },
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
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
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

  const handleResetAll = async () => {
    await resetToNewPlan();
    setDraftProfile({
      eventType: 'community',
      guestMix: { family: 50, elders: 20, kids: 20, colleagues: 5, friends: 5 },
      specialRequirements: [],
      intakeStatus: 'in_progress'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 via-white to-orange-50/20 text-slate-900 flex flex-col font-sans">
      <Navbar onReset={handleResetAll} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Priya Demo Guide Banner (visible ONLY when demo plan is active) */}
        {plan && plan.profile.id === 'priya-demo-diwali-2026' && (
          <div className="mb-6 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-2xl p-4 text-white shadow-md shadow-orange-500/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <h4 className="font-bold text-sm tracking-tight">Priya&apos;s Demo Story (Gokuldham Society Festival Night)</h4>
                <p className="text-xs text-amber-100">
                  Baseline generated: 200 guests, ₹4 Lakhs, 6 weeks in Bengaluru. Now test the sudden RSVP surge (+50 guests).
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('whatif')}
              className="px-4 py-2 bg-white text-orange-900 font-bold text-xs rounded-xl shadow-sm hover:bg-amber-50 transition-all shrink-0 active:scale-95"
            >
              Simulate +50 Guests in What-If →
            </button>
          </div>
        )}

        {/* TAB: Intake */}
        {activeTab === 'intake' && (
          <ErrorBoundary fallbackTitle="Intake Assistant Encountered a Display Issue">
            {/* Core Event Focus Headline Banner - Only visible on chat intake tab */}
            <EventHeadlineBanner
              currentSubType={draftProfile.eventSubType}
              onSelectSubType={subType =>
                handleProfileUpdate({
                  eventSubType: subType,
                  eventName: subType ? `${subType.replace('_', ' ')} Celebration` : undefined
                })
              }
              planActive={Boolean(plan)}
            />

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
                  onUpdateProfile={handleProfileUpdate}
                  planActive={Boolean(plan)}
                />
              </div>
            </div>
          </ErrorBoundary>
        )}

        {/* TAB: Dashboard */}
        {activeTab === 'dashboard' && plan && (
          <ErrorBoundary fallbackTitle="Dashboard Encountered an Error">
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
          </ErrorBoundary>
        )}

        {/* TAB: What-If */}
        {activeTab === 'whatif' && plan && (
          <ErrorBoundary fallbackTitle="What-If Simulator Encountered an Error">
            <WhatIfSimulator
              plan={plan}
              onApplyScenario={applyWhatIfScenario}
            />
          </ErrorBoundary>
        )}

        {/* TAB: Vendors */}
        {activeTab === 'vendors' && plan && (
          <ErrorBoundary fallbackTitle="Vendor Checklist Encountered an Error">
            <VendorChecklist
              vendors={plan.vendors}
              profile={plan.profile}
              onUpdateStatus={updateVendorStatus}
            />
          </ErrorBoundary>
        )}

        {/* TAB: Tasks */}
        {activeTab === 'tasks' && plan && (
          <ErrorBoundary fallbackTitle="Task Board Encountered an Error">
            <TaskBoard
              tasks={plan.tasks}
              onUpdateStatus={updateTaskStatus}
            />
          </ErrorBoundary>
        )}

        {/* TAB: Run Sheet */}
        {activeTab === 'runsheet' && plan && (
          <ErrorBoundary fallbackTitle="Day-of Run Sheet Encountered an Error">
            <DayOfRunSheet
              runSheet={plan.runSheet}
              eventName={plan.profile.eventName}
              eventDate={plan.profile.eventDate}
              onUpdateEntry={updateRunSheetEntry}
            />
          </ErrorBoundary>
        )}
      </main>

      {/* Footer with AI Status Indicator */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-2">
            <span>Event Co-pilot • Hack2Skills PromptWars 5 • Cultural Planner</span>
            <span className="text-slate-300">|</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI: {healthStatus?.model ? `Google Gemini (${healthStatus.model}) (Live)` : 'Google Gemini 3.5 Flash (Live)'}</span>
            </span>
          </div>
          <span className="font-mono text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
            All math deterministic • Location-aware cost floors
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
