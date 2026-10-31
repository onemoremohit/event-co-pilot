'use client';

import React from 'react';
import { EventProfile, BudgetCategorySlug } from '@/lib/types';
import { CULTURAL_CATEGORIES } from '@/lib/constants/cultural';
import { Calendar, Users, IndianRupee, MapPin, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LiveProfileCardProps {
  profile: Partial<EventProfile>;
  completeness: number;
  onGeneratePlan: () => void;
  isGenerating: boolean;
}

export function LiveProfileCard({
  profile,
  completeness,
  onGeneratePlan,
  isGenerating
}: LiveProfileCardProps) {
  const isComplete = completeness >= 80;
  const perHead = profile.totalBudget?.amount && profile.guestCount
    ? Math.round(profile.totalBudget.amount / profile.guestCount)
    : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {profile.eventSubType === 'cultural_night' ? '🎭' : profile.eventSubType === 'neighborhood' ? '🏘️' : '🎉'}
            </span>
            <div>
              <h2 className="font-bold text-slate-900 text-sm leading-tight">
                {profile.eventName || 'New Celebration Profile'}
              </h2>
              <span className="text-[11px] text-slate-500 capitalize">
                {profile.eventSubType ? `${profile.eventSubType.replace('_', ' ')} Preset` : 'Awaiting preset'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {completeness}% Ready
            </span>
          </div>
        </div>

        {/* Completeness Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-500"
            style={{ width: `${completeness}%` }}
          />
        </div>

        {/* Profile Fields List */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Date */}
          <div className={`p-2.5 rounded-xl border transition-colors ${profile.eventDate ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-dashed border-slate-200'}`}>
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>Event Date</span>
            </div>
            <p className="font-semibold text-slate-900 truncate">
              {profile.eventDate ? new Date(profile.eventDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending...'}
            </p>
          </div>

          {/* Budget */}
          <div className={`p-2.5 rounded-xl border transition-colors ${profile.totalBudget?.amount ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-dashed border-slate-200'}`}>
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
              <span>Total Budget</span>
            </div>
            <p className="font-semibold text-slate-900 truncate">
              {profile.totalBudget?.amount ? `₹${profile.totalBudget.amount.toLocaleString('en-IN')}` : 'Pending...'}
            </p>
          </div>

          {/* Guests */}
          <div className={`p-2.5 rounded-xl border transition-colors ${profile.guestCount ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-dashed border-slate-200'}`}>
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>Expected Guests</span>
            </div>
            <p className="font-semibold text-slate-900 truncate">
              {profile.guestCount ? `${profile.guestCount} Attendees` : 'Pending...'}
            </p>
          </div>

          {/* Location */}
          <div className={`p-2.5 rounded-xl border transition-colors ${profile.location?.city ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-dashed border-slate-200'}`}>
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>City / Society</span>
            </div>
            <p className="font-semibold text-slate-900 truncate">
              {profile.location?.city || 'Bengaluru (default)'}
            </p>
          </div>
        </div>

        {/* Per Head Metric Pill */}
        {perHead && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-amber-800 font-medium">Per-Head Capacity</span>
              <p className="text-base font-extrabold text-amber-950">₹{perHead.toLocaleString('en-IN')}<span className="text-xs font-normal text-amber-700"> / guest</span></p>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-1 rounded-md ${perHead >= 1500 ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>
              {perHead >= 1500 ? 'Healthy Budget' : 'Tight / Conservative'}
            </span>
          </div>
        )}

        {/* Priorities Section */}
        <div>
          <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">
            Splurge Priorities (1.5× Weight)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {profile.priorities?.top2 && profile.priorities.top2.length > 0 ? (
              profile.priorities.top2.map(slug => (
                <span
                  key={slug}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-orange-100 text-orange-800 px-2.5 py-1 rounded-lg border border-orange-200"
                >
                  <span>{CULTURAL_CATEGORIES[slug as BudgetCategorySlug]?.icon || '⭐'}</span>
                  <span>{CULTURAL_CATEGORIES[slug as BudgetCategorySlug]?.shortLabel || slug}</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">Defaults to Food & Prasad + Stage/Sound</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4 border-t border-slate-100 mt-4">
        <button
          onClick={onGeneratePlan}
          disabled={isGenerating || !profile.totalBudget?.amount || !profile.guestCount}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
            isComplete
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-amber-500/25 active:scale-98'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
              <span>Running Deterministic Allocations...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{isComplete ? 'Generate Live Event Plan' : 'Fill Details to Generate Plan'}</span>
            </>
          )}
        </button>
        <p className="text-[11px] text-slate-400 text-center mt-2">
          Deterministic budget math • Backward DAG schedule • Vendor checklist
        </p>
      </div>
    </div>
  );
}
