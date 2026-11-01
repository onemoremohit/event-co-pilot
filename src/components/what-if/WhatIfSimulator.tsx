'use client';

import React, { useState, useMemo } from 'react';
import { EventPlan, BudgetCategorySlug, ScenarioInput } from '@/lib/types';
import { CULTURAL_CATEGORIES } from '@/lib/constants/cultural';
import { recomputeScenario, ScenarioResult } from '@/lib/engine/scenario';
import { DiffTable } from './DiffTable';
import { Sliders, Lock, Unlock, Check, RefreshCw, Zap, Users, IndianRupee, Calendar, Sparkles } from 'lucide-react';

interface WhatIfSimulatorProps {
  plan: EventPlan;
  onApplyScenario: (result: ScenarioResult, label: string) => Promise<void>;
}

export function WhatIfSimulator({ plan, onApplyScenario }: WhatIfSimulatorProps) {
  const currentBudget = plan.budget.totalBudget;
  const currentGuests = plan.profile.guestCount;
  const currentDate = plan.profile.eventDate;

  // Simulator State
  const [budgetSlider, setBudgetSlider] = useState<number>(currentBudget);
  const [guestsSlider, setGuestsSlider] = useState<number>(currentGuests);
  const [dateInput, setDateInput] = useState<string>(currentDate);
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
      lockedCategories: lockedSlugs
    };
    return recomputeScenario(plan.budget, plan.tasks, plan.profile, inputChanges);
  }, [plan, budgetSlider, guestsSlider, dateInput, lockedSlugs]);

  const handleApply = async () => {
    setIsApplying(true);
    const guestDelta = guestsSlider - currentGuests;
    const label = guestDelta !== 0
      ? `${guestDelta > 0 ? '+' : ''}${guestDelta} guests scenario`
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
            Simulate real-time changes in guests, budget, or dates. The pure math engine updates allocations in milliseconds with human reasons.
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
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
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

      {/* Quick Preset Buttons */}
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
            setBudgetSlider(currentBudget + 100000);
          }}
          className="text-xs font-semibold bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100 px-3 py-1 rounded-lg transition-colors shadow-2xs"
        >
          +₹1 Lakh Budget Expansion
        </button>
        <button
          onClick={() => {
            setBudgetSlider(Math.max(150000, currentBudget - 50000));
          }}
          className="text-xs font-semibold bg-white text-rose-900 border border-rose-300 hover:bg-rose-100 px-3 py-1 rounded-lg transition-colors shadow-2xs"
        >
          -₹50,000 Budget Compression
        </button>
      </div>

      {/* Control Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/60 p-4 rounded-xl border border-slate-200/60">
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
            <span className="font-semibold text-amber-700">Baseline: {currentGuests}</span>
            <span>500 max</span>
          </div>
        </div>

        {/* Budget Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
              <span>Total Budget (INR)</span>
            </span>
            <span className="text-xs font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
              ₹{budgetSlider.toLocaleString('en-IN')}
            </span>
          </div>
          <input
            type="range"
            min={100000}
            max={1000000}
            step={25000}
            value={budgetSlider}
            onChange={e => setBudgetSlider(parseInt(e.target.value, 10))}
            className="w-full accent-amber-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>₹1 Lakh</span>
            <span className="font-semibold text-amber-700">Baseline: ₹{(currentBudget/100000).toFixed(1)}L</span>
            <span>₹10 Lakhs</span>
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
              Lead: {scenarioResult.newTasks.totalDaysAvailable} days
            </span>
          </div>
          <input
            type="date"
            value={dateInput}
            onChange={e => setDateInput(e.target.value)}
            className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          <div className="text-[10px] text-slate-500">
            {scenarioResult.newTasks.rushMode ? (
              <span className="text-orange-700 font-bold flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 fill-current" /> Enters Rush Mode (&lt;45d)
              </span>
            ) : (
              <span>Standard planning timeframe</span>
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
                className={`flex items-center justify-between p-2 rounded-xl border text-xs text-left transition-all ${
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
