'use client';

import React from 'react';
import { BudgetPlan } from '@/lib/types';
import { CULTURAL_CATEGORIES } from '@/lib/constants/cultural';
import { IndianRupee, ShieldAlert, Lock, CheckCircle2, Info } from 'lucide-react';

interface BudgetBreakdownProps {
  budget: BudgetPlan;
  onOpenWhatIf: () => void;
}

export function BudgetBreakdown({ budget, onOpenWhatIf }: BudgetBreakdownProps) {
  const categories = budget.categories;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-6">
      {/* Header Cards */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Budget Allocation Breakdown</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full">
              Deterministic Math v{budget.version}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            100% auditable allocation across cultural categories with minimum viable cost floors.
          </p>
        </div>

        <button
          onClick={onOpenWhatIf}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 transition-all active:scale-95"
        >
          <span>Open What-If Simulator</span>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map(cat => {
              const meta = CULTURAL_CATEGORIES[cat.slug];
              return (
                <tr key={cat.slug} className="hover:bg-amber-50/30 transition-colors">
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{meta?.icon || '📁'}</span>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
