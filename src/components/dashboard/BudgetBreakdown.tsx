'use client';

import React, { useState } from 'react';
import { BudgetPlan, BudgetCategorySlug } from '@/lib/types';
import { CULTURAL_CATEGORIES } from '@/lib/constants/cultural';
import { useEvent } from '@/context/EventContext';
import { computeSourcingModeCost } from '@/lib/engine/sourcing';
import { resolveLocationTier } from '@/lib/engine/location';
import {
  ShieldCheck,
  Lock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Sliders,
  Users,
  Store,
  Utensils,
  ArrowUpRight,
  HelpCircle,
  Plus,
  RotateCcw,
  Check
} from 'lucide-react';

interface BudgetBreakdownProps {
  budget: BudgetPlan;
  onOpenWhatIf: () => void;
}

const CATEGORY_COLORS: Record<BudgetCategorySlug, string> = {
  food_prasad: 'bg-amber-500',
  stage_sound: 'bg-orange-500',
  decor: 'bg-rose-400',
  venue_permissions: 'bg-blue-500',
  performers: 'bg-purple-500',
  volunteers: 'bg-emerald-500',
  safety: 'bg-red-500',
  photography: 'bg-indigo-500',
  misc: 'bg-slate-400'
};

const MODE_BADGES: Record<string, { label: string; badge: string }> = {
  community_sourced: {
    label: 'Community Sourced (₹0 Cash)',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  minimal_paid: {
    label: 'Minimal Paid Rental',
    badge: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  standard_paid: {
    label: 'Standard Paid Package',
    badge: 'bg-purple-100 text-purple-800 border-purple-300'
  },
  enhanced_paid: {
    label: 'Enhanced Production',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-300'
  },
  premium_paid: {
    label: 'Premium Turnkey',
    badge: 'bg-amber-100 text-amber-900 border-amber-300'
  }
};

export function BudgetBreakdown({ budget, onOpenWhatIf }: BudgetBreakdownProps) {
  const [expandedSlug, setExpandedSlug] = useState<BudgetCategorySlug | null>(null);
  const { plan, addCategoryExpense, removeCategoryExpense } = useEvent();

  // State for expense editing per category
  const [activeCategorySlug, setActiveCategorySlug] = useState<BudgetCategorySlug | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [expandOption, setExpandOption] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const categories = budget.categories;
  const toolkit = budget.resourcefulnessToolkit;
  const verification = budget.verification;

  const guests = plan?.profile?.guestCount || 100;
  const locTier = plan?.profile?.location?.tier || resolveLocationTier(plan?.profile?.location?.city).tier;

  const toggleExpand = (slug: BudgetCategorySlug) => {
    setExpandedSlug(prev => (prev === slug ? null : slug));
    if (activeCategorySlug === slug) {
      setActiveCategorySlug(null);
    }
  };

  const handleOpenExpenseEditor = (slug: BudgetCategorySlug) => {
    setExpandedSlug(slug);
    setActiveCategorySlug(slug);
    const cat = categories.find(c => c.slug === slug);
    const defaultCost = computeSourcingModeCost(slug, 'minimal_paid', guests, locTier);
    setCustomAmount(cat && cat.allocatedAmount > 0 ? String(cat.allocatedAmount) : String(defaultCost));
    setExpandOption(false);
  };

  const handleAddExpense = async (slug: BudgetCategorySlug) => {
    const num = Number(customAmount);
    if (isNaN(num) || num <= 0) return;
    setIsSubmitting(true);
    try {
      await addCategoryExpense(slug, num, expandOption);
      const catLabel = categories.find(c => c.slug === slug)?.label || slug;
      setSuccessToast(`Added ₹${num.toLocaleString('en-IN')} for ${catLabel} and replanned all categories!`);
      setTimeout(() => setSuccessToast(null), 4500);
      setActiveCategorySlug(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevertToCommunity = async (slug: BudgetCategorySlug) => {
    setIsSubmitting(true);
    try {
      await removeCategoryExpense(slug);
      const catLabel = categories.find(c => c.slug === slug)?.label || slug;
      setSuccessToast(`Reverted ${catLabel} to Community Sourcing (₹0) and redistributed cash!`);
      setTimeout(() => setSuccessToast(null), 4500);
      setActiveCategorySlug(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-6">
      {/* Success Notification */}
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-0.5 rounded hover:bg-emerald-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Event Blueprint & Spend Map
            </h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>{verification?.badgeText || 'Verified Invariants'}</span>
            </span>
            <span className="text-xs bg-purple-100 text-purple-900 font-semibold px-2.5 py-0.5 rounded-full border border-purple-200 hidden sm:inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-700" />
              <span>Gemini Rationale</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured allocation across all 9 cultural categories. Items with ₹0 cash are powered by community effort.
          </p>
        </div>

        <button
          onClick={onOpenWhatIf}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold shadow-sm shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Open What-If Simulator (+50 Guests)</span>
        </button>
      </div>

      {/* Top Level Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5">
          <span className="text-xs text-slate-500 font-medium">Usable Cash Budget</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            ₹{budget.totalBudget.toLocaleString('en-IN')}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{verification?.details || '100% exact integer balance'}</span>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-800 font-medium">
              Contingency Reserve ({budget.contingencyReserve.percentage}%)
            </span>
            <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
              Protected
            </span>
          </div>
          <p className="text-xl font-extrabold text-amber-950 mt-1">
            ₹{budget.contingencyReserve.amount.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-amber-700">Reserved for unexpected on-day supplies</span>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-3.5">
          <span className="text-xs text-emerald-800 font-medium">Allocated to Categories</span>
          <p className="text-xl font-extrabold text-emerald-950 mt-1">
            ₹{budget.allocatableBudget.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-emerald-700">
            {categories.filter(c => c.allocatedAmount === 0).length > 0
              ? `${categories.filter(c => c.allocatedAmount === 0).length} categories powered by community effort`
              : 'Distributed across paid vendor packages'}
          </span>
        </div>
      </div>

      {/* Visual Stacked Spend Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">Spend Distribution & Sourcing Modes</span>
          <span className="text-[11px] text-slate-400">Click a category row below to view full details</span>
        </div>
        <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-slate-100 shadow-inner">
          {categories.map(cat => {
            const share = budget.totalBudget > 0 ? (cat.allocatedAmount / budget.totalBudget) * 100 : 0;
            const colorClass = CATEGORY_COLORS[cat.slug] || 'bg-slate-400';
            if (share <= 0) return null;
            return (
              <div
                key={cat.slug}
                className={`${colorClass} h-full transition-all hover:opacity-80 cursor-pointer`}
                style={{ width: `${share}%` }}
                title={`${cat.label}: ₹${cat.allocatedAmount.toLocaleString('en-IN')} (${share.toFixed(1)}%)`}
              />
            );
          })}
          {/* Contingency segment */}
          <div
            className="bg-amber-300 h-full transition-all"
            style={{ width: `${budget.contingencyReserve.percentage}%` }}
            title={`Contingency Reserve: ₹${budget.contingencyReserve.amount.toLocaleString('en-IN')} (${budget.contingencyReserve.percentage}%)`}
          />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
          {categories.filter(c => c.allocatedAmount > 0).slice(0, 5).map(cat => (
            <div key={cat.slug} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${CATEGORY_COLORS[cat.slug]}`} />
              <span>{cat.label} ({cat.allocatedPercentage}%)</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
            <span>Contingency ({budget.contingencyReserve.percentage}%)</span>
          </div>
        </div>
      </div>

      {/* Event Map Table */}
      <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-3.5">Category & Sourcing Mode</th>
              <th className="py-3 px-3.5 text-right">Cash Amount (₹)</th>
              <th className="py-3 px-3.5 text-right">Share (%)</th>
              <th className="py-3 px-3.5">What the Organizer Gets</th>
              <th className="py-3 px-3.5">
                <span className="flex items-center gap-1">
                  <span>Rationale &amp; &quot;Why&quot;</span>
                  <span className="text-[9px] bg-purple-100 text-purple-900 border border-purple-200 px-1 py-0.2 rounded font-mono font-bold">
                    ✨ Gemini
                  </span>
                </span>
              </th>
              <th className="py-3 px-3.5 text-center w-16">Tasks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map(cat => {
              const meta = CULTURAL_CATEGORIES[cat.slug];
              const isExpanded = expandedSlug === cat.slug;
              const colorDot = CATEGORY_COLORS[cat.slug] || 'bg-slate-400';
              const mode = cat.sourcingMode || 'community_sourced';
              const modeMeta = MODE_BADGES[mode] || MODE_BADGES.community_sourced;

              return (
                <React.Fragment key={cat.slug}>
                  <tr
                    onClick={() => toggleExpand(cat.slug)}
                    className="hover:bg-amber-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${colorDot} shrink-0`} />
                        <span className="text-base">{meta?.icon || '📁'}</span>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5 group-hover:text-amber-800">
                            <span>{cat.label}</span>
                            {cat.isLocked && (
                              <span className="inline-flex items-center text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                                <Lock className="w-2.5 h-2.5 mr-0.5" /> Locked
                              </span>
                            )}
                          </div>
                          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md border mt-0.5 ${modeMeta.badge}`}>
                            {cat.sourcingModeLabel || modeMeta.label}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-right font-bold text-slate-900">
                      {cat.allocatedAmount === 0 ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                            ₹0 (Community)
                          </span>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenExpenseEditor(cat.slug);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="Add cash budget for this category and replan"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>+ Add Cash</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="text-slate-900 font-bold">
                            ₹{cat.allocatedAmount.toLocaleString('en-IN')}
                          </span>
                          {cat.perHeadCost && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              ₹{cat.perHeadCost}/guest
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenExpenseEditor(cat.slug);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-amber-800 underline mt-0.5 cursor-pointer"
                          >
                            {cat.isLocked ? 'Edit Lock' : 'Customize'}
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-right font-medium text-slate-600">
                      {cat.allocatedPercentage}%
                    </td>
                    <td className="py-3 px-3.5 text-slate-700 max-w-xs">
                      <p className="line-clamp-2 text-[11px] leading-relaxed">
                        {cat.deliverablesDescription || 'Covered by community effort and volunteer arrangements.'}
                      </p>
                    </td>
                    <td className="py-3 px-3.5 text-slate-500 max-w-xs">
                      <p className="line-clamp-2 text-[11px] leading-relaxed">{cat.why}</p>
                    </td>
                    <td className="py-3 px-3.5 text-center text-slate-400 group-hover:text-slate-700">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 mx-auto text-amber-700" />
                      ) : (
                        <ChevronDown className="w-4 h-4 mx-auto" />
                      )}
                    </td>
                  </tr>

                  {/* Expanded Community Action Accordion */}
                  {isExpanded && (
                    <tr className="bg-amber-50/30">
                      <td colSpan={6} className="py-4 px-6 space-y-4">
                        {/* Interactive Cash Expense & Rebalancing Box */}
                        {(() => {
                          const minPaidCost = computeSourcingModeCost(cat.slug, 'minimal_paid', guests, locTier);
                          const isEditingThis = activeCategorySlug === cat.slug;

                          if (cat.allocatedAmount === 0 || isEditingThis) {
                            return (
                              <div className="bg-white border-2 border-amber-300 rounded-xl p-4 space-y-3 shadow-xs">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                                      <Plus className="w-4 h-4 text-amber-800" />
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-bold text-slate-900">
                                        {cat.allocatedAmount === 0 ? 'Fund Category with Cash Expense' : `Adjust Cash for ${cat.label}`}
                                      </h4>
                                      <p className="text-[11px] text-slate-500">
                                        {cat.allocatedAmount === 0
                                          ? 'Currently ₹0 (Community Managed). Add cash to hire vendors and replan all categories.'
                                          : 'Update the allocated cash amount for this category and rebalance the event plan.'}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full">
                                    Baseline Min Package: ₹{minPaidCost.toLocaleString('en-IN')}
                                  </span>
                                </div>

                                {/* Quick suggestion */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[11px] font-semibold text-slate-600">Quick Baseline:</span>
                                  <button
                                    type="button"
                                    onClick={() => setCustomAmount(String(minPaidCost))}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
                                  >
                                    <Sparkles className="w-3 h-3 text-amber-600" />
                                    <span>Minimal Paid Package (₹{minPaidCost.toLocaleString('en-IN')})</span>
                                  </button>
                                </div>

                                {/* Form controls */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                      Cash Amount (₹)
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                                      <input
                                        type="number"
                                        min={100}
                                        step={500}
                                        value={customAmount}
                                        onChange={e => setCustomAmount(e.target.value)}
                                        placeholder={`e.g. ${minPaidCost}`}
                                        className="w-full pl-7 pr-3 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                      Rebalancing Strategy
                                    </label>
                                    <div className="space-y-1.5 text-xs">
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`rebalance-${cat.slug}`}
                                          checked={!expandOption}
                                          onChange={() => setExpandOption(false)}
                                          className="accent-amber-600"
                                        />
                                        <span className="text-[11px] text-slate-700">
                                          Rebalance within current budget (Keep ₹{budget.totalBudget.toLocaleString('en-IN')})
                                        </span>
                                      </label>
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`rebalance-${cat.slug}`}
                                          checked={expandOption}
                                          onChange={() => setExpandOption(true)}
                                          className="accent-amber-600"
                                        />
                                        <span className="text-[11px] text-slate-700">
                                          Increase total budget by +₹{Number(customAmount || 0).toLocaleString('en-IN')}
                                        </span>
                                      </label>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                  {cat.allocatedAmount > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => handleRevertToCommunity(cat.slug)}
                                      disabled={isSubmitting}
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                                    >
                                      <RotateCcw className="w-3 h-3 text-emerald-700" />
                                      <span>Revert to Community Sourcing (₹0)</span>
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">
                                      All calculations strictly adhere to zero-negative invariants.
                                    </span>
                                  )}

                                  <div className="flex items-center gap-2">
                                    {isEditingThis && cat.allocatedAmount > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setActiveCategorySlug(null)}
                                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      disabled={!customAmount || Number(customAmount) <= 0 || isSubmitting}
                                      onClick={() => handleAddExpense(cat.slug)}
                                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm cursor-pointer transition-all active:scale-95"
                                    >
                                      {isSubmitting ? (
                                        <span>Rebalancing...</span>
                                      ) : (
                                        <>
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Add to Expense List & Replan</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900">
                                    Paid Allocation: ₹{cat.allocatedAmount.toLocaleString('en-IN')}
                                  </span>
                                  {cat.isLocked ? (
                                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                                      <Lock className="w-2.5 h-2.5" /> Locked
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                      Engine Optimized
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Want to manage this with community volunteers or adjust the exact cash amount?
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenExpenseEditor(cat.slug)}
                                  className="text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer active:scale-95"
                                >
                                  Edit Amount
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRevertToCommunity(cat.slug)}
                                  disabled={isSubmitting}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer active:scale-95"
                                >
                                  <RotateCcw className="w-3 h-3 text-emerald-700" />
                                  <span>Revert to ₹0 Community</span>
                                </button>
                              </div>
                            </div>
                          );
                        })()}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-l-2 border-amber-400 pl-4">
                          {/* Volunteer & Community Tasks */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Community Action Plan ({cat.label})</span>
                            </span>
                            {cat.communityTasks && cat.communityTasks.length > 0 ? (
                              <ul className="space-y-1 text-[11px] text-slate-700 list-disc list-inside bg-white p-2.5 rounded-lg border border-emerald-200">
                                {cat.communityTasks.map((task, tIdx) => (
                                  <li key={tIdx} className="leading-relaxed">
                                    {task}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded border border-slate-200">
                                Standard vendor contract execution. No direct volunteer labor required.
                              </p>
                            )}
                          </div>

                          {/* Sponsor Asks & Line Items */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5 text-amber-700" />
                              <span>Local Sponsor & Donation Target</span>
                            </span>
                            {cat.sponsorOpportunities && cat.sponsorOpportunities.length > 0 ? (
                              <ul className="space-y-1 text-[11px] text-slate-700 list-disc list-inside bg-white p-2.5 rounded-lg border border-amber-200">
                                {cat.sponsorOpportunities.map((ask, aIdx) => (
                                  <li key={aIdx} className="leading-relaxed">
                                    {ask}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded border border-slate-200">
                                Self-funded from main society pool.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Line items breakdown */}
                        {cat.subItems && cat.subItems.length > 0 && cat.allocatedAmount > 0 && (
                          <div className="border-t border-amber-200/50 pt-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              Cash Budget Breakdown
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {cat.subItems.map((sub, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="bg-white p-2 rounded border border-slate-200 text-xs flex justify-between items-center"
                                >
                                  <span className="text-slate-800 font-medium">{sub.label}</span>
                                  <span className="font-bold text-amber-800">
                                    ₹{sub.estimatedCost.toLocaleString('en-IN')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Resourcefulness Toolkit Card & What Next ₹10k Unlocks */}
      {toolkit && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* Household Contribution Target */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>Per-Household Contribution Model</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              {toolkit.perHouseholdContribution.note}
            </p>
            <div className="text-[11px] font-bold text-emerald-900 bg-emerald-200/60 px-2 py-0.5 rounded inline-block">
              Suggested: ₹{toolkit.perHouseholdContribution.askPerHousehold} / family
            </div>
          </div>

          {/* Local Sponsor Target */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <Store className="w-4 h-4 text-amber-700" />
              <span>Local Merchant Sponsorships</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              {toolkit.sponsorTargets.description}
            </p>
            <div className="text-[11px] font-bold text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded inline-block">
              Target: 3 sponsors × ₹{toolkit.sponsorTargets.askPerSponsor.toLocaleString('en-IN')}
            </div>
          </div>

          {/* What the Next ₹10,000 Unlocks */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
              <Sparkles className="w-4 h-4 text-purple-700" />
              <span>What the Next ₹10,000 Unlocks</span>
            </div>
            <p className="text-xs text-purple-800 leading-relaxed">
              {toolkit.nextTierUnlock.unlockDescription}
            </p>
            <div className="text-[11px] font-bold text-purple-900 bg-purple-200/60 px-2 py-0.5 rounded inline-block">
              Priority: {toolkit.nextTierUnlock.affectedCategory}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
