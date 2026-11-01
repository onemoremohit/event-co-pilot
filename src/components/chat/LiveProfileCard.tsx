'use client';

import React from 'react';
import { EventProfile, BudgetCategorySlug } from '@/lib/types';
import { CULTURAL_CATEGORIES } from '@/lib/constants/cultural';
import { resolveLocationTier, LOCATION_TIERS } from '@/lib/engine/location';
import { Calendar, Users, IndianRupee, MapPin, Sparkles, Building2, CheckCircle2 } from 'lucide-react';

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
  // Required fields for plan generation
  const hasSubtype = Boolean(profile.eventSubType);
  const hasBudget = Boolean(profile.totalBudget?.amount && profile.totalBudget.amount > 0);
  const hasGuests = Boolean(profile.guestCount && profile.guestCount > 0);
  const hasDate = Boolean(profile.eventDate);
  const hasLocation = Boolean(profile.location?.city && profile.location.city.trim());

  const isReady = hasSubtype && hasBudget && hasGuests && hasDate && hasLocation;

  const perHead = hasBudget && hasGuests
    ? Math.round(profile.totalBudget!.amount / profile.guestCount!)
    : null;

  // Location tier info
  const locResolution = profile.location?.city
    ? resolveLocationTier(profile.location.city)
    : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {profile.eventSubType === 'cultural_night' ? '🎭' : profile.eventSubType === 'neighborhood' ? '🏘️' : profile.eventSubType === 'festival' ? '🎉' : '📋'}
            </span>
            <div>
              <h2 className="font-bold text-slate-900 text-sm leading-tight">
                {profile.eventName || 'Live Event Profile'}
              </h2>
              <span className="text-[11px] text-slate-500 capitalize">
                {profile.eventSubType ? `${profile.eventSubType.replace('_', ' ')} Celebration` : 'Event type: Not set yet'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
              completeness >= 80
                ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                : completeness > 0
                ? 'text-amber-800 bg-amber-50 border-amber-200'
                : 'text-slate-600 bg-slate-100 border-slate-200'
            }`}>
              {completeness}% Ready
            </span>
          </div>
        </div>

        {/* Completeness Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              completeness >= 80
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : 'bg-gradient-to-r from-amber-500 to-orange-500'
            }`}
            style={{ width: `${completeness}%` }}
          />
        </div>

        {/* Profile Fields List */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Sub-type */}
          <div className={`p-2.5 rounded-xl border transition-colors ${hasSubtype ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-dashed border-slate-200'}`}>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">
              Event Preset
            </span>
            <p className={`font-semibold truncate ${hasSubtype ? 'text-slate-900 capitalize' : 'text-slate-400 italic'}`}>
              {profile.eventSubType ? profile.eventSubType.replace('_', ' ') : 'Not set yet'}
            </p>
          </div>

          {/* Date */}
          <div className={`p-2.5 rounded-xl border transition-colors ${hasDate ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-dashed border-slate-200'}`}>
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>Event Date</span>
            </div>
            <p className={`font-semibold truncate ${hasDate ? 'text-slate-900' : 'text-slate-400 italic'}`}>
              {profile.eventDate
                ? new Date(profile.eventDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Not set yet'}
            </p>
          </div>

          {/* Budget */}
          <div className={`p-2.5 rounded-xl border transition-colors ${hasBudget ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-dashed border-slate-200'}`}>
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
              <span>Total Budget</span>
            </div>
            <p className={`font-semibold truncate ${hasBudget ? 'text-slate-900' : 'text-slate-400 italic'}`}>
              {hasBudget ? `₹${profile.totalBudget!.amount.toLocaleString('en-IN')}` : 'Not set yet'}
            </p>
          </div>

          {/* Guests */}
          <div className={`p-2.5 rounded-xl border transition-colors ${hasGuests ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-dashed border-slate-200'}`}>
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>Attendees</span>
            </div>
            <p className={`font-semibold truncate ${hasGuests ? 'text-slate-900' : 'text-slate-400 italic'}`}>
              {hasGuests ? `${profile.guestCount} Guests` : 'Not set yet'}
            </p>
          </div>

          {/* Location */}
          <div className={`col-span-2 p-2.5 rounded-xl border transition-colors ${hasLocation ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-dashed border-slate-200'}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Location</span>
              </div>
              {locResolution && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  locResolution.tier === 'metro'
                    ? 'bg-purple-100 text-purple-900'
                    : locResolution.tier === 'village'
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-blue-100 text-blue-900'
                }`}>
                  {locResolution.label} ({locResolution.baseMultiplier}x)
                </span>
              )}
            </div>
            <p className={`font-semibold truncate ${hasLocation ? 'text-slate-900' : 'text-slate-400 italic'}`}>
              {hasLocation ? profile.location!.city : 'Not set yet'}
            </p>
          </div>
        </div>

        {/* Location Cost Level Indicator Chip (FIX 3 requirement) */}
        {locResolution && (
          <div className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
            locResolution.tier === 'metro'
              ? 'bg-purple-50/70 border-purple-200 text-purple-950'
              : locResolution.tier === 'village'
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : locResolution.tier === 'small_town'
              ? 'bg-blue-50/70 border-blue-200 text-blue-950'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <Building2 className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-bold block">
                Location Cost Level: {locResolution.label}
              </span>
              <p className="text-[11px] leading-tight text-slate-600 mt-0.5">
                {locResolution.tier === 'metro' && 'Metro rates apply (~35% above baseline). Venues, sound & commercial vendors are higher.'}
                {locResolution.tier === 'village' && 'Village rates apply (~40% below baseline). Substantially lower rental & ground costs.'}
                {locResolution.tier === 'small_town' && 'Small town benchmark (~20% below baseline). Favorable pricing for local vendors.'}
                {locResolution.tier === 'tier2' && 'Standard Tier-2 benchmark rates (1.0x baseline).'}
              </p>
            </div>
          </div>
        )}

        {/* Per Head Capacity Pill */}
        {perHead && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-amber-800 font-medium">Per-Head Capacity</span>
              <p className="text-base font-extrabold text-amber-950">
                ₹{perHead.toLocaleString('en-IN')}
                <span className="text-xs font-normal text-amber-700"> / guest</span>
              </p>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-1 rounded-md ${
              perHead >= 1800 ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
            }`}>
              {perHead >= 1800 ? 'Healthy Capacity' : 'Tight / Conservative'}
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
              <span className="text-xs text-slate-400 italic">Not chosen yet (can be confirmed during chat)</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4 border-t border-slate-100 mt-4">
        <button
          onClick={onGeneratePlan}
          disabled={isGenerating || !isReady}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
            isReady
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-amber-500/25 active:scale-98 cursor-pointer'
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
              <span>{isReady ? 'Generate Live Event Plan' : 'Fill All Details to Generate Plan'}</span>
            </>
          )}
        </button>
        <p className="text-[11px] text-slate-400 text-center mt-2">
          Requires event type, budget, guests, date & location
        </p>
      </div>
    </div>
  );
}
