'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  EventPlan,
  EventProfile,
  BudgetPlan,
  TaskGraph,
  VendorChecklistItem,
  RunSheetEntry,
  ScenarioInput,
  Diff,
  TaskStatus,
  VendorStatus,
  ChatMessage
} from '@/lib/types';
import { planRepository } from '@/lib/storage/repository';
import { recomputeScenario, ScenarioResult } from '@/lib/engine/scenario';

export type AppTab = 'intake' | 'dashboard' | 'whatif' | 'vendors' | 'tasks' | 'runsheet';

interface EventContextType {
  plan: EventPlan | null;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isLoading: boolean;
  isDemoRunning: boolean;
  setPlan: (plan: EventPlan | null) => void;
  updateProfilePartial: (patch: Partial<EventProfile>) => void;
  commitGeneratedPlan: (fullPlan: EventPlan) => Promise<void>;
  runWhatIfScenario: (inputChanges: ScenarioInput) => ScenarioResult | null;
  applyWhatIfScenario: (result: ScenarioResult, label: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  updateVendorStatus: (vendorId: string, status: VendorStatus, quotedPrice?: number) => Promise<void>;
  updateRunSheetEntry: (id: string, patch: Partial<RunSheetEntry>) => Promise<void>;
  resetToNewPlan: () => Promise<void>;
  startPriyaDemo: () => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
  const [plan, setPlanState] = useState<EventPlan | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('intake');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);

  // Load saved plan from localStorage on initial mount
  useEffect(() => {
    async function init() {
      try {
        const saved = await planRepository.getPlan();
        if (saved) {
          setPlanState(saved);
          if (saved.budget && saved.tasks) {
            setActiveTab('dashboard');
          }
        }
      } catch (err) {
        console.warn('Failed to load plan from localStorage:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const setPlan = (newPlan: EventPlan | null) => {
    setPlanState(newPlan);
    if (newPlan) {
      planRepository.savePlan(newPlan);
    }
  };

  const updateProfilePartial = (patch: Partial<EventProfile>) => {
    if (!plan) return;
    const updated = {
      ...plan,
      profile: {
        ...plan.profile,
        ...patch,
        updatedAt: new Date().toISOString()
      }
    };
    setPlan(updated);
  };

  const commitGeneratedPlan = async (fullPlan: EventPlan) => {
    setPlan(fullPlan);
    setActiveTab('dashboard');
  };

  const runWhatIfScenario = (inputChanges: ScenarioInput): ScenarioResult | null => {
    if (!plan) return null;
    return recomputeScenario(plan.budget, plan.tasks, plan.profile, inputChanges);
  };

  const applyWhatIfScenario = async (result: ScenarioResult, label: string) => {
    if (!plan) return;

    // Preserve user edited run sheet items
    const preservedRunSheet = plan.runSheet;

    const newScenarioRecord = {
      id: `scenario-${Date.now()}`,
      eventId: plan.profile.id,
      label,
      inputChanges: {
        budget: result.newPlan.totalBudget,
        guestCount: result.newPlan.categories.find(c => c.slug === 'food_prasad')?.perHeadCost
          ? Math.round(result.newPlan.allocatableBudget / 2000)
          : plan.profile.guestCount,
        lockedCategories: result.newPlan.categories.filter(c => c.isLocked).map(c => c.slug)
      },
      resultingPlan: result.newPlan,
      resultingTasks: result.newTasks,
      diffs: result.diffs,
      createdAt: new Date().toISOString()
    };

    const updatedPlan: EventPlan = {
      ...plan,
      budget: result.newPlan,
      tasks: result.newTasks,
      vendors: result.newVendors,
      runSheet: preservedRunSheet,
      scenarios: [newScenarioRecord, ...(plan.scenarios || [])]
    };

    setPlan(updatedPlan);
    setActiveTab('dashboard');
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    if (!plan) return;
    const updatedTasks = plan.tasks.tasks.map(t => (t.id === taskId ? { ...t, status } : t));
    const newGraph: TaskGraph = { ...plan.tasks, tasks: updatedTasks };
    const updatedPlan: EventPlan = { ...plan, tasks: newGraph };
    setPlan(updatedPlan);
  };

  const updateVendorStatus = async (vendorId: string, status: VendorStatus, quotedPrice?: number) => {
    if (!plan) return;
    const updatedVendors = plan.vendors.map(v =>
      v.id === vendorId ? { ...v, status, quotedPrice: quotedPrice ?? v.quotedPrice } : v
    );
    const updatedPlan: EventPlan = { ...plan, vendors: updatedVendors };
    setPlan(updatedPlan);
  };

  const updateRunSheetEntry = async (id: string, patch: Partial<RunSheetEntry>) => {
    if (!plan) return;
    const updatedSheet = plan.runSheet.map(item =>
      item.id === id ? { ...item, ...patch, isUserEdited: true } : item
    );
    const updatedPlan: EventPlan = { ...plan, runSheet: updatedSheet };
    setPlan(updatedPlan);
  };

  const resetToNewPlan = async () => {
    await planRepository.clear();
    setPlanState(null);
    setActiveTab('intake');
  };

  // Automated Priya Demo Story
  const startPriyaDemo = async () => {
    setIsDemoRunning(true);
    setActiveTab('intake');

    // Reset current state
    await planRepository.clear();
    setPlanState(null);

    // Initial base profile for Priya's Society Diwali Celebration
    const priyaProfile: EventProfile = {
      id: 'priya-demo-diwali-2026',
      eventType: 'community',
      eventSubType: 'festival',
      eventName: 'Gokuldham Society Diwali Celebration 2026',
      eventDate: '2026-12-15',
      planningStartDate: '2026-11-01',
      totalBudget: { amount: 400000, currency: 'INR' },
      guestCount: 200,
      guestMix: { family: 50, elders: 20, kids: 20, colleagues: 5, friends: 5 },
      experienceTier: 'normal',
      priorities: { top2: ['food_prasad', 'stage_sound'], notes: 'Authentic prasad dinner feast and high-clarity sound' },
      location: { city: 'Bengaluru', region: 'Karnataka' },
      specialRequirements: ['Society amphitheater and podium', 'Priority seating for 40 seniors'],
      profileCompleteness: 100,
      intakeStatus: 'complete',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // Fetch plan from deterministic API
      const res = await fetch('/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(priyaProfile)
      });
      const json = await res.json();
      if (json.success && json.data) {
        const fullPlan: EventPlan = json.data;
        fullPlan.chatHistory = [
          {
            id: 'c-1',
            eventId: priyaProfile.id,
            role: 'assistant',
            content: 'Namaste Priya! I am your Event Co-pilot. What type of community celebration are we organizing?',
            timestamp: new Date().toISOString()
          },
          {
            id: 'c-2',
            eventId: priyaProfile.id,
            role: 'user',
            content: 'We need to organize our Gokuldham Society Diwali celebration on December 15th for around 200 residents with a budget of ₹4 Lakhs.',
            timestamp: new Date().toISOString()
          },
          {
            id: 'c-3',
            eventId: priyaProfile.id,
            role: 'assistant',
            content: 'With ₹4,00,000 for 200 guests, your per-head budget is ₹2,000. That is a viable, healthy budget for a memorable celebration! Which aspects should we splurge on as top priorities?',
            timestamp: new Date().toISOString()
          },
          {
            id: 'c-4',
            eventId: priyaProfile.id,
            role: 'user',
            content: 'Food & Prasad first! And excellent Stage & Sound for our cultural performances.',
            timestamp: new Date().toISOString()
          },
          {
            id: 'c-5',
            eventId: priyaProfile.id,
            role: 'assistant',
            content: 'Done! Your 100% deterministic plan is ready. All math is balanced, floors respected, and 10% contingency reserved.',
            timestamp: new Date().toISOString()
          }
        ];

        setPlan(fullPlan);
        setActiveTab('dashboard');
      }
    } catch (err) {
      console.error('Demo runner error:', err);
    } finally {
      setIsDemoRunning(false);
    }
  };

  return (
    <EventContext.Provider
      value={{
        plan,
        activeTab,
        setActiveTab,
        isLoading,
        isDemoRunning,
        setPlan,
        updateProfilePartial,
        commitGeneratedPlan,
        runWhatIfScenario,
        applyWhatIfScenario,
        updateTaskStatus,
        updateVendorStatus,
        updateRunSheetEntry,
        resetToNewPlan,
        startPriyaDemo
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
}
