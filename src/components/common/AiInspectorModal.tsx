'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, Cpu, Check, AlertCircle, X, RefreshCw, Zap } from 'lucide-react';

interface AiInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiInspectorModal({ isOpen, onClose }: AiInspectorModalProps) {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = () => {
    setLoading(true);
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealthData(data))
      .catch(err => setHealthData({ status: 'error', testError: err.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">AI Pipeline & Architecture Inspector</h3>
              <p className="text-[11px] text-slate-500">Live verification of Google Gemini GenAI & Deterministic Math Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Model Status Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-800">Active LLM Provider</span>
            </div>
            {loading ? (
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Checking...
              </span>
            ) : healthData?.liveGeminiActive ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Google Gemini 2.5 Flash (Live)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Deterministic Fallback Engine</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Model Identifier</span>
              <span className="font-mono font-bold text-slate-800 text-[11px]">
                {healthData?.model || 'gemini-2.5-flash'}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">API Key Status</span>
              <span className="font-bold text-slate-800 text-[11px]">
                {healthData?.keyConfigured ? '✓ Configured in Environment' : '⚠️ Missing (Using Mock Fallback)'}
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown of What is GenAI vs Deterministic */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            How GenAI is Used (Hybrid Architecture)
          </span>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-purple-900">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>1. Natural Language Entity Extraction & Intent Understanding (GenAI)</span>
              </div>
              <p className="text-[11px] text-purple-800 leading-relaxed">
                Parses unstructured organizer chat messages (&quot;4 lakh in Meerut for 200 guests on 15 Dec&quot;) into structured fields using Google Gemini JSON schema output with Zod validation.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                <span>2. Cultural Deliverables & Tailored Vendor Letters (GenAI)</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Generates culturally authentic outreach messages for WhatsApp/Email tailored to specific vendors (sound, caterer, tent) with &plusmn;15% budget confidentiality brackets.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>3. Zero Arithmetic Hallucination (Deterministic Engine)</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                All numbers, budget percentages, rupee conservation sums, location cost multipliers, and backward critical path dates are computed in pure TypeScript. LLMs never touch arithmetic.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
