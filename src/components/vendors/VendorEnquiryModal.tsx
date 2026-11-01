'use client';

import React, { useState, useEffect } from 'react';
import { VendorChecklistItem, EventProfile } from '@/lib/types';
import { VendorMessageResponse } from '@/lib/llm';
import { X, Copy, Check, Sparkles, Send } from 'lucide-react';

interface VendorEnquiryModalProps {
  item: VendorChecklistItem | null;
  profile: EventProfile;
  isOpen: boolean;
  onClose: () => void;
  onEnquirySent: (itemId: string) => void;
}

export function VendorEnquiryModal({
  item,
  profile,
  isOpen,
  onClose,
  onEnquirySent
}: VendorEnquiryModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VendorMessageResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [editableMessage, setEditableMessage] = useState('');

  useEffect(() => {
    if (isOpen && item) {
      setLoading(true);
      fetch('/api/vendor/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorType: item.vendorType,
          category: item.category,
          allocatedBudget: item.estimatedBudget,
          profile
        })
      })
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data) {
            setData(json.data);
            setEditableMessage(json.data.message);
          }
        })
        .catch(err => console.error('Vendor enquiry API error:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, item, profile]);

  if (!isOpen || !item) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(editableMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkSent = () => {
    onEnquirySent(item.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Vendor Outreach Generator</h3>
                <span className="text-[10px] font-bold text-purple-900 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                  <span>Google Gemini 2.5 Flash</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{item.vendorType} • {profile.eventName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500">Drafting tailored enquiry with budget brackets...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Subject preview */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Subject
              </span>
              <p className="text-xs font-semibold text-slate-800 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                {data?.subject || `Enquiry for ${item.vendorType}`}
              </p>
            </div>

            {/* Editable Body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Enquiry Letter (Editable)
                </span>
                <span className="text-[11px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                  Bracket: {data?.budgetRangeText}
                </span>
              </div>
              <textarea
                rows={9}
                value={editableMessage}
                onChange={e => setEditableMessage(e.target.value)}
                className="w-full text-xs text-slate-800 bg-slate-50/50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-sans leading-relaxed"
              />
            </div>

            {/* Suggested Checklist Questions */}
            {data?.checklistQuestions && (
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3">
                <span className="text-[11px] font-bold text-amber-900 block mb-1">
                  Key Questions Included in Spec:
                </span>
                <ul className="text-[11px] text-amber-800 space-y-0.5 list-disc list-inside">
                  {data.checklistQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
              </button>

              <button
                onClick={handleMarkSent}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Mark Enquiry Sent & Close</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

