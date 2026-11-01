'use client';

import React, { useState, useMemo } from 'react';
import { EventPlan, BudgetCategorySlug, ScenarioInput } from '@/lib/types';
import { CULTURAL_CATEGORIES } from '@/lib/constants/cultural';
import { recomputeScenario, ScenarioResult } from '@/lib/engine/scenario';
import { resolveLocationTier, LOCATION_TIERS, LocationTier } from '@/lib/engine/location';
import { DiffTable } from './DiffTable';
import { Sliders, Lock, Unlock, Check, RefreshCw, Zap, Users, IndianRupee, Calendar, Sparkles, MapPin } from 'lucide-react';

interface WhatIfSimulatorProps {
  plan: EventPlan;
  onApplyScenario: (result: ScenarioResult, label: string) => Promise<void>;
}

export function WhatIfSimulator({ plan, onApplyScenario }: WhatIfSimulatorProps) {
  const currentBudget = plan.budget.totalBudget;
  const currentGuests = plan.profile.guestCount;
  const currentDate = plan.profile.eventDate;
  const currentLocationTier = plan.profile.location?.tier || resolveLocationTier(plan.profile.location?.city).tier;

  // Simulator State
  const [budgetSlider, setBudgetSlider] = useState<number>(currentBudget);
  const [guestsSlider, setGuestsSlider] = useState<number>(currentGuests);
  const [dateInput, setDateInput] = useState<string>(currentDate);
  const [locationTier, setLocationTier] = useState<LocationTier>(currentLocationTier);
  const [lockedSlugs, setLockedSlugs] = useState<BudgetCategorySlug[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  const toggleLock = (slug: BudgetCategorySlug) => {
    setLockedSlugs(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  // Immediate deterministic recomputation (<1ms)
  const scenarioResult: ScenarioResult = useMemo(() => {
    const inputChanges: ScenarioInput = {
      budget: budgetSlider,
      guestCount: guestsSlider,
      eventDate: dateInput,
      locationTier,
      lockedCategories: lockedSlugs
    };
    return recomputeScenario(plan.budget, plan.tasks, plan.profile, inputChanges);
  }, [plan, budgetSlider, guestsSlider, dateInput, locationTier, lockedSlugs]);

  const handleApply = async () => {
    setIsApplying(true);
    const guestDelta = guestsSlider - currentGuests;
    const locChanged = locationTier !== currentLocationTier;
    const label = guestDelta !== 0
      ? `${guestDelta > 0 ? '+' : ''}${guestDelta} guests scenario`
      : locChanged
      ? `${LOCATION_TIERS[locationTier].label} cost tier`
      : `Rebalanced scenario`;

    try {
      await onApplyScenario(scenarioResult, label);
    } finally {
      setIsApplying(false);
    }
  };

  const handleResetToBaseline = () => {
    setBudgetSlider(currentBudget);
    setGuestsSlider(currentGuests);
    setDateInput(currentDate);
    setLocationTier(currentLocationTier);
    setLockedSlugs([]);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center font-bold">
              <Sliders className="w-4 h-4 text-orange-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">What-If Scenario Simulator</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulate real-time changes in guests, budget, location cost level, or dates. The pure math engine rebalances in milliseconds with auditable reasons.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToBaseline}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            disabled={isApplying || scenarioResult.diffs.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            {isApplying ? (
              <span>Applying...</span>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Apply This Plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Preset Buttons (including Location presets for FIX 3) */}
      <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Quick Scenarios:</span>
        </span>
        <button
          onClick={() => {
            setGuestsSlider(currentGuests + 50);
          }}
          className="text-xs font-bold bg-white text-orange-900 border border-orange-300 hover:bg-orange-100 px-3 py-1 rounded-lg transition-colors shadow-2xs"
        >
          +50 Guests (Priya&apos;s Demo Story)
        </button>
        <button
          onClick={() => {
            setLocationTier('village');
          }}
          className="text-xs font-semibold bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100 px-3 py-1 rounded-lg transition-colors shadow-2xs"
        >
          Switch to Village Setting (0.6x)
        </button>
        <button
          onClick={() => {
            setLocationTier('metro');
          }}
          className="text-xs font-semibold bg-white text-purple-900 border border-purple-300 hover:bg-purple-100 px-3 py-1 rounded-lg transition-colors shadow-2xs"
        >
          Switch to Metro Setting (1.35x)
        </button>
        <button
          onClick={() => {
            setBudgetSlider(currentBudget + 100000);
          }}
          className="text-xs font-semibold bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 px-3 py-1 rounded-lg transition-colors shadow-2xs"
        >
          +₹1 Lakh Budget
        </button>
      </div>

      {/* Control Sliders Grid (4 controls: Guests, Budget, Date, Location) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/60 p-4 rounded-xl border border-slate-200/60">
        {/* Guest Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>Guest Count</span>
            </span>
            <span className="text-xs font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
              {guestsSlider} Guests
            </span>
          </div>
          <input
            type="range"
            min={50}
            max={500}
            step={10}
            value={guestsSlider}
            onChange={e => setGuestsSlider(parseInt(e.target.value, 10))}
            className="w-full accent-amber-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>50 min</span>
            <span className="font-semibold text-amber-700">Current: {currentGuests}</span>
            <span>500 max</span>
          </div>
        </div>

        {/* Budget Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
              <span>Budget (INR)</span>
            </span>
            <span className="text-xs font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
              ₹{(budgetSlider / 100000).toFixed(1)}L
            </span>
          </div>
          <input
            type="range"
            min={50000}
            max={1000000}
            step={25000}
            value={budgetSlider}
            onChange={e => setBudgetSlider(parseInt(e.target.value, 10))}
            className="w-full accent-amber-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>₹50K</span>
            <span className="font-semibold text-amber-700">₹{budgetSlider.toLocaleString('en-IN')}</span>
            <span>₹10L</span>
          </div>
        </div>

        {/* Location Tier Selector (FIX 3 requirement) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>Location Level</span>
            </span>
            <span className="text-xs font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded">
              {LOCATION_TIERS[locationTier].baseMultiplier}x
            </span>
          </div>
          <select
            value={locationTier}
            onChange={e => setLocationTier(e.target.value as LocationTier)}
            className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <option value="metro">Metro City (1.35x rate)</option>
            <option value="tier2">Tier-2 City (1.0x baseline)</option>
            <option value="small_town">Small Town (0.8x rate)</option>
            <option value="village">Village / Rural (0.6x rate)</option>
          </select>
          <div className="text-[10px] text-slate-500 truncate">
            {LOCATION_TIERS[locationTier].description.split('(')[0]}
          </div>
        </div>

        {/* Date Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>Event Date</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Lead: {scenarioResult.newTasks.totalDaysAvailable}d
            </span>
          </div>
          <input
            type="date"
            value={dateInput}
            onChange={e => setDateInput(e.target.value)}
            className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          <div className="text-[10px] text-slate-500">
            {scenarioResult.newTasks.rushMode ? (
              <span className="text-orange-700 font-bold flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 fill-current" /> Rush Mode Active
              </span>
            ) : (
              <span>Standard schedule</span>
            )}
          </div>
        </div>
      </div>

      {/* Category Locks Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Lock Categories (Preserve exact amount during rebalance)
          </span>
          <span className="text-[11px] text-slate-500">
            {lockedSlugs.length} of {plan.budget.categories.length} locked
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {plan.budget.categories.map(cat => {
            const isLocked = lockedSlugs.includes(cat.slug);
            const meta = CULTURAL_CATEGORIES[cat.slug];
            return (
              <button
                key={cat.slug}
                onClick={() => toggleLock(cat.slug)}
                className={`flex items-center justify-between p-2 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                  isLocked
                    ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-xs">{meta?.icon || '📁'}</span>
                  <span className="truncate">{cat.label}</span>
                </div>
                {isLocked ? (
                  <Lock className="w-3 h-3 text-amber-800 shrink-0" />
                ) : (
                  <Unlock className="w-3 h-3 text-slate-300 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Diff View */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Live Rebalance Diff ({scenarioResult.diffs.length} Changes)
          </h3>
          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Sum Guaranteed: ₹{scenarioResult.newPlan.totalBudget.toLocaleString('en-IN')}
          </span>
        </div>

        <DiffTable diffs={scenarioResult.diffs} />
      </div>
    </div>
  );
}
