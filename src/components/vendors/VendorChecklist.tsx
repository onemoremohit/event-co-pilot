'use client';

import React, { useState } from 'react';
import { VendorChecklistItem, EventProfile, VendorStatus } from '@/lib/types';
import { CULTURAL_CATEGORIES } from '@/lib/constants/cultural';
import { VendorEnquiryModal } from './VendorEnquiryModal';
import { Mail, CheckCircle2, Clock, AlertCircle, Sparkles } from 'lucide-react';

interface VendorChecklistProps {
  vendors: VendorChecklistItem[];
  profile: EventProfile;
  onUpdateStatus: (vendorId: string, status: VendorStatus, quotedPrice?: number) => Promise<void>;
}

export function VendorChecklist({ vendors, profile, onUpdateStatus }: VendorChecklistProps) {
  const [activeModalItem, setActiveModalItem] = useState<VendorChecklistItem | null>(null);

  const statusOptions: { value: VendorStatus; label: string; color: string }[] = [
    { value: 'not_started', label: 'Not Started', color: 'bg-slate-100 text-slate-700' },
    { value: 'enquiry_sent', label: 'Enquiry Sent', color: 'bg-amber-100 text-amber-800' },
    { value: 'quote_received', label: 'Quote Received', color: 'bg-blue-100 text-blue-800' },
    { value: 'booked', label: 'Booked / Confirmed', color: 'bg-emerald-100 text-emerald-800' }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Cultural Vendor Checklist</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pre-calculated budget targets and tailored one-click enquiry letters for every cultural service.
          </p>
        </div>

        <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <span>Booked: </span>
          <strong className="text-emerald-700">
            {vendors.filter(v => v.status === 'booked').length} of {vendors.length}
          </strong>
        </div>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vendors.map(item => {
          const meta = CULTURAL_CATEGORIES[item.category];

          return (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{meta?.icon || '📦'}</span>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">{item.vendorType}</h3>
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={item.status}
                    onChange={e => onUpdateStatus(item.id, e.target.value as VendorStatus)}
                    className="text-[11px] font-semibold rounded-lg px-2 py-1 bg-slate-50 border border-slate-200 focus:outline-none"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2">{item.notes}</p>
              </div>

              {/* Bottom Specs & Action */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Est. Budget Target</span>
                  <span className="font-extrabold text-slate-900">
                    ₹{item.estimatedBudget.toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={() => setActiveModalItem(item)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 transition-all active:scale-95"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-700" />
                  <span>Draft Enquiry</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enquiry Modal */}
      <VendorEnquiryModal
        item={activeModalItem}
        profile={profile}
        isOpen={Boolean(activeModalItem)}
        onClose={() => setActiveModalItem(null)}
        onEnquirySent={id => onUpdateStatus(id, 'enquiry_sent')}
      />
    </div>
  );
}
