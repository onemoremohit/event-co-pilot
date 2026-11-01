'use client';

import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Users, MapPin, Sliders, ChevronDown, ChevronUp } from 'lucide-react';
import { EventSubType } from '@/lib/types';

interface EventHeadlineBannerProps {
  onSelectSubType?: (subType: EventSubType) => void;
  currentSubType?: EventSubType;
  planActive?: boolean;
}

export function EventHeadlineBanner({
  onSelectSubType,
  currentSubType,
  planActive = false
}: EventHeadlineBannerProps) {
  const [isExpanded, setIsExpanded] = useState(!planActive);

  const presets: {
    id: EventSubType;
    title: string;
    icon: string;
    examples: string;
    description: string;
    badge: string;
    badgeColor: string;
  }[] = [
    {
      id: 'festival',
      title: 'Festival Celebrations',
      icon: '🪔',
      examples: 'Diwali, Navratri & Dandiya, Durga Puja, Ganesh Utsav, Eid, Christmas',
      description: 'Optimized for community feast / sacred prasad bhog, floral entrance arches, traditional lighting, and family crowd safety.',
      badge: 'Feast & Pandal Focus',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300'
    },
    {
      id: 'cultural_night',
      title: 'Cultural Nights & Stage Shows',
      icon: '🎭',
      examples: 'Society Annual Functions, Youth Talent Shows, Drama & Musical Performances',
      description: 'Focuses on stage construction, concert acoustic sound, digital mixers, performer green rooms, and rehearsal coordination.',
      badge: 'Acoustics & Stage Focus',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300'
    },
    {
      id: 'neighborhood',
      title: 'Neighborhood & Society Gatherings',
      icon: '🤝',
      examples: 'Colony Resident Meets, Society AGM Celebrations, Community Dinners & Sports Days',
      description: 'Emphasizes low-cost municipal venue permits, volunteer wing captains, community high tea, and borrowed resident equipment at ₹0 cash.',
      badge: 'Volunteer & DIY Focus',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300'
    }
  ];

  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-br from-amber-900 via-stone-900 to-amber-950 text-white shadow-xl shadow-amber-950/20 border border-amber-500/30 overflow-hidden relative">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-gradient-to-tr from-orange-600/15 to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="p-5 sm:p-6 relative z-10 space-y-4">
        {/* Top Tagline & Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-400 text-stone-950 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Cultural Community Focus</span>
              </span>
              <span className="text-xs text-amber-200/80 font-medium hidden sm:inline">
                Exclusively built for non-commercial society & colony celebrations
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white pt-1">
              What Type of Event Are We Working On?
            </h1>
            <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed max-w-3xl">
              Event Co-pilot is dedicated exclusively to <strong className="text-amber-300 font-bold">Cultural Community Events</strong>. We reject commercial agency markups and arithmetic hallucinations to give volunteer organizers mathematically verified, resource-rich blueprints.
            </p>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl border border-amber-400/30 transition-all shrink-0 cursor-pointer"
          >
            <span>{isExpanded ? 'Hide Archetypes' : 'View 3 Supported Types'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 3 Core Supported Cultural Event Archetypes */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
            {presets.map(preset => {
              const isSelected = currentSubType === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => onSelectSubType && onSelectSubType(preset.id)}
                  className={`rounded-xl p-4 transition-all relative flex flex-col justify-between cursor-pointer border ${
                    isSelected
                      ? 'bg-gradient-to-br from-amber-500/25 to-orange-500/20 border-amber-400 shadow-md ring-2 ring-amber-400/50'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-amber-400/40'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{preset.icon}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${preset.badgeColor}`}>
                        {preset.badge}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                        <span>{preset.title}</span>
                      </h3>
                      <p className="text-[11px] font-medium text-amber-200/90 mt-0.5">
                        {preset.examples}
                      </p>
                    </div>
                    <p className="text-[11px] text-stone-300 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                    <span className="text-amber-300/80 font-medium">Click to select archetype</span>
                    {isSelected && (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        ✓ Selected
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Core Value Assurance Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-amber-200/90 font-medium">
          <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero Negative Spends & Exact Rupee Sum Guarantee</span>
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span>Community-First (Borrow & Volunteer at ₹0 Cash)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
            <MapPin className="w-3.5 h-3.5 text-orange-300" />
            <span>Auto-Calibrated for Metro to Village Price Levels</span>
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
            <Sliders className="w-3.5 h-3.5 text-purple-300" />
            <span>Live What-If Rebalancing in &lt;1ms</span>
          </span>
        </div>
      </div>
    </div>
  );
}
