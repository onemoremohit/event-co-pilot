'use client';

import React, { useState, useEffect } from 'react';
import { useEvent, AppTab } from '@/context/EventContext';
import { AiInspectorModal } from '@/components/common/AiInspectorModal';
import {
  Sparkles,
  LayoutDashboard,
  MessageSquare,
  Sliders,
  Store,
  CheckSquare,
  Clock,
  Play,
  RotateCcw,
  PlusCircle,
  Cpu
} from 'lucide-react';

interface NavbarProps {
  onReset?: () => void;
}

export function Navbar({ onReset }: NavbarProps) {
  const { plan, activeTab, setActiveTab, startPriyaDemo, isDemoRunning, resetToNewPlan } = useEvent();
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ liveGeminiActive: boolean; model: string } | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setAiStatus(data))
      .catch(() => {});
  }, []);

  const handleResetClick = async () => {
    if (confirm('Start a new blank event plan? This clears the current profile and saved plan.')) {
      if (onReset) {
        onReset();
      } else {
        await resetToNewPlan();
      }
    }
  };

  const tabs: { id: AppTab; label: string; icon: React.ReactNode; requiresPlan?: boolean }[] = [
    { id: 'intake', label: 'Intake Chat', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" />, requiresPlan: true },
    { id: 'whatif', label: 'What-If Simulator', icon: <Sliders className="w-3.5 h-3.5" />, requiresPlan: true },
    { id: 'vendors', label: 'Vendors', icon: <Store className="w-3.5 h-3.5" />, requiresPlan: true },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-3.5 h-3.5" />, requiresPlan: true },
    { id: 'runsheet', label: 'Run Sheet', icon: <Clock className="w-3.5 h-3.5" />, requiresPlan: true }
  ];

  return (
    <header className="border-b border-amber-200/60 bg-white/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-amber-900 via-orange-800 to-amber-900 bg-clip-text text-transparent">
                Event Co-pilot
              </span>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                Cultural Community Events
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              {plan?.profile.eventName || 'Specialized in Society Festivals, Cultural Nights & Neighborhood Gatherings'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Live AI Status Pill */}
          <button
            onClick={() => setShowAiModal(true)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-95 ${
              aiStatus?.liveGeminiActive
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            }`}
            title="Click to inspect AI Engine & Architecture details"
          >
            <span className={`w-2 h-2 rounded-full ${aiStatus?.liveGeminiActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <Cpu className="w-3 h-3 text-slate-600" />
            <span className="hidden sm:inline">
              {aiStatus?.liveGeminiActive ? 'Gemini 2.5 Flash' : 'Hybrid AI / Engine'}
            </span>
            <span className="text-[10px] bg-white/80 px-1 py-0.2 rounded border border-slate-200">
              Inspect
            </span>
          </button>

          {/* Start New Plan / Reset Button */}
          <button
            onClick={handleResetClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all active:scale-95"
            title="Clear all fields and start a new blank event plan"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Start New Plan</span>
            <span className="sm:hidden">Reset</span>
          </button>

          {/* Play Demo Button */}
          <button
            onClick={startPriyaDemo}
            disabled={isDemoRunning}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold shadow-sm transition-all shadow-amber-500/25 active:scale-95 disabled:opacity-50"
          >
            {isDemoRunning ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating Demo...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Play Demo (Priya&apos;s Festival)</span>
                <span className="sm:hidden">Play Demo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 flex items-center gap-1 overflow-x-auto py-1.5">
        {tabs.map(tab => {
          const isDisabled = tab.requiresPlan && !plan;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              disabled={isDisabled}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm shadow-amber-600/20'
                  : isDisabled
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-600 hover:bg-amber-50 hover:text-amber-900 cursor-pointer active:scale-95'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <AiInspectorModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} />
    </header>
  );
}
