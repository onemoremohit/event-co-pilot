'use client';

import React from 'react';
import { Diff, BudgetCategorySlug } from '@/lib/types';
import { CULTURAL_CATEGORIES } from '@/lib/constants/cultural';
import { ArrowUpRight, ArrowDownRight, Minus, AlertCircle, Info } from 'lucide-react';

interface DiffTableProps {
  diffs: Diff[];
}

export function DiffTable({ diffs }: DiffTableProps) {
  if (diffs.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-500 text-xs">
        No differences detected. Adjust the sliders or toggle locks above to simulate changes.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-xl">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
          <tr>
            <th className="py-3 px-3.5">Category / Field</th>
            <th className="py-3 px-3.5 text-right">Current</th>
            <th className="py-3 px-3.5 text-right">Simulated</th>
            <th className="py-3 px-3.5 text-right">Delta (₹)</th>
            <th className="py-3 px-3.5 text-right">Change (%)</th>
            <th className="py-3 px-3.5">Reason for Change</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {diffs.map((diff, index) => {
            const isIncrease = diff.direction === 'increase';
            const isDecrease = diff.direction === 'decrease';
            const meta = CULTURAL_CATEGORIES[diff.category as BudgetCategorySlug];

            return (
              <tr key={index} className="hover:bg-amber-50/20 transition-colors">
                <td className="py-3 px-3.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <span>{meta?.icon || '🔹'}</span>
                    <span>{meta?.label || diff.category}</span>
                  </div>
                </td>

                <td className="py-3 px-3.5 text-right text-slate-500 font-medium">
                  {typeof diff.oldValue === 'number'
                    ? `₹${diff.oldValue.toLocaleString('en-IN')}`
                    : String(diff.oldValue)}
                </td>

                <td className="py-3 px-3.5 text-right font-bold text-slate-900">
                  {typeof diff.newValue === 'number'
                    ? `₹${diff.newValue.toLocaleString('en-IN')}`
                    : String(diff.newValue)}
                </td>

                <td className="py-3 px-3.5 text-right font-bold">
                  {diff.delta !== null ? (
                    <span
                      className={`inline-flex items-center gap-0.5 ${
                        isIncrease ? 'text-emerald-700' : isDecrease ? 'text-rose-600' : 'text-slate-500'
                      }`}
                    >
                      {isIncrease ? <ArrowUpRight className="w-3.5 h-3.5" /> : isDecrease ? <ArrowDownRight className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                      <span>
                        {diff.delta > 0 ? '+' : ''}₹{Math.abs(diff.delta).toLocaleString('en-IN')}
                      </span>
                    </span>
                  ) : (
                    '—'
                  )}
                </td>

                <td className="py-3 px-3.5 text-right font-semibold">
                  {diff.deltaPercentage !== null ? (
                    <span className={isIncrease ? 'text-emerald-700' : isDecrease ? 'text-rose-600' : 'text-slate-500'}>
                      {diff.deltaPercentage > 0 ? '+' : ''}{diff.deltaPercentage}%
                    </span>
                  ) : (
                    '—'
                  )}
                </td>

                <td className="py-3 px-3.5 text-slate-600 max-w-sm">
                  <p className="text-[11px] leading-relaxed">{diff.reason}</p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
