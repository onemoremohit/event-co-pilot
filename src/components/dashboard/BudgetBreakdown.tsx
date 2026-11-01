'use client';

import React, { useState } from 'react';
import { BudgetPlan, BudgetCategorySlug } from '@/lib/types';
import { CULTURAL_CATEGORIES } from '@/lib/constants/cultural';
import { IndianRupee, ShieldAlert, Lock, CheckCircle2, Info, ChevronDown, ChevronUp, Sparkles, Sliders } from 'lucide-react';

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

export function BudgetBreakdown({ budget, onOpenWhatIf }: BudgetBreakdownProps) {
  const [expandedSlug, setExpandedSlug] = useState<BudgetCategorySlug | null>(null);
  const categories = budget.categories;

  const toggleExpand = (slug: BudgetCategorySlug) => {
    setExpandedSlug(prev => (prev === slug ? null : slug));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-6">
      {/* Header Cards */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Budget Allocation Breakdown</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
              Deterministic Math v{budget.version}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            100% auditable allocation across cultural categories with minimum viable cost floors.
          </p>
        </div>

        <button
          onClick={onOpenWhatIf}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold shadow-sm shadow-amber-500/20 transition-all active:scale-95"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Open What-If Simulator (+50 Guests)</span>
        </button>
      </div>

      {/* Top Level Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5">
          <span className="text-xs text-slate-500 font-medium">Total Event Budget</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            ₹{budget.totalBudget.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-500">100% allocated without leakage</span>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-800 font-medium">Contingency Reserve (10%)</span>
            <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
              Protected
            </span>
          </div>
          <p className="text-xl font-extrabold text-amber-950 mt-1">
            ₹{budget.contingencyReserve.amount.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-amber-700">Reserved off-the-top for emergencies</span>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-3.5">
          <span className="text-xs text-emerald-800 font-medium">Allocatable Budget</span>
          <p className="text-xl font-extrabold text-emerald-950 mt-1">
            ₹{budget.allocatableBudget.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-emerald-700">Distributed across 9 cultural categories</span>
        </div>
      </div>

      {/* Visual Stacked Distribution Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">Visual Spend Distribution</span>
          <span className="text-[11px] text-slate-400">Click a category row below to view specific sub-items</span>
        </div>
        <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-slate-100 shadow-inner">
          {categories.map(cat => {
            const share = (cat.allocatedAmount / budget.totalBudget) * 100;
            const colorClass = CATEGORY_COLORS[cat.slug] || 'bg-slate-400';
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
            style={{ width: '10%' }}
            title={`Contingency Reserve: ₹${budget.contingencyReserve.amount.toLocaleString('en-IN')} (10%)`}
          />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
          {categories.slice(0, 5).map(cat => (
            <div key={cat.slug} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${CATEGORY_COLORS[cat.slug]}`} />
              <span>{cat.label} ({cat.allocatedPercentage}%)</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
            <span>Contingency (10%)</span>
          </div>
        </div>
      </div>

      {/* Category Table */}
      <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-3.5">Category</th>
              <th className="py-3 px-3.5 text-right">Allocated (₹)</th>
              <th className="py-3 px-3.5 text-right">Share (%)</th>
              <th className="py-3 px-3.5 text-right">Floor Cost</th>
              <th className="py-3 px-3.5">Strategic &quot;Why&quot; Justification</th>
              <th className="py-3 px-3.5 text-center w-16">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map(cat => {
              const meta = CULTURAL_CATEGORIES[cat.slug];
              const isExpanded = expandedSlug === cat.slug;
              const colorDot = CATEGORY_COLORS[cat.slug] || 'bg-slate-400';

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
                          {cat.perHeadCost && (
                            <span className="text-[11px] text-slate-500">
                              ₹{cat.perHeadCost}/guest
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-right font-bold text-slate-900">
                      ₹{cat.allocatedAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3.5 text-right font-medium text-slate-600">
                      {cat.allocatedPercentage}%
                    </td>
                    <td className="py-3 px-3.5 text-right text-slate-500">
                      ₹{cat.floorAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 max-w-xs">
                      <p className="line-clamp-2 text-[11px] leading-relaxed">{cat.why}</p>
                    </td>
                    <td className="py-3 px-3.5 text-center text-slate-400 group-hover:text-slate-700">
                      {isExpanded ? <ChevronUp className="w-4 h-4 mx-auto" /> : <ChevronDown className="w-4 h-4 mx-auto" />}
                    </td>
                  </tr>

                  {/* Expanded Sub-items Accordion */}
                  {isExpanded && cat.subItems && cat.subItems.length > 0 && (
                    <tr className="bg-amber-50/30">
                      <td colSpan={6} className="py-3 px-6">
                        <div className="space-y-2 border-l-2 border-amber-400 pl-4 py-1">
                          <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                            Specific Line-Item Cost Breakdown ({cat.label})
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {cat.subItems.map((sub, sIdx) => (
                              <div
                                key={sIdx}
                                className="bg-white p-2.5 rounded-lg border border-amber-200/70 shadow-2xs space-y-1"
                              >
                                <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                                  <span>{sub.label}</span>
                                  <span className="text-amber-800">₹{sub.estimatedCost.toLocaleString('en-IN')}</span>
                                </div>
                                <p className="text-[10px] text-slate-500">{sub.notes}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
