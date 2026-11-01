'use client';

import React, { useState } from 'react';
import { RunSheetEntry } from '@/lib/types';
import { Printer, Edit3, Check, Clock, User, Plus } from 'lucide-react';

interface DayOfRunSheetProps {
  runSheet: RunSheetEntry[];
  eventName: string;
  eventDate: string;
  onUpdateEntry: (id: string, patch: Partial<RunSheetEntry>) => Promise<void>;
}

export function DayOfRunSheet({
  runSheet,
  eventName,
  eventDate,
  onUpdateEntry
}: DayOfRunSheetProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ time: string; activity: string; responsible: string; notes: string }>({
    time: '',
    activity: '',
    responsible: '',
    notes: ''
  });

  const startEdit = (entry: RunSheetEntry) => {
    setEditingId(entry.id);
    setEditForm({
      time: entry.time,
      activity: entry.activity,
      responsible: entry.responsible,
      notes: entry.notes
    });
  };

  const saveEdit = async (id: string) => {
    await onUpdateEntry(id, {
      ...editForm,
      isUserEdited: true
    });
    setEditingId(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-6 print:border-none print:shadow-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Day-of Event Run Sheet</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hour-by-hour sequence for {eventName} ({new Date(eventDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}).
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors print:hidden"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Run Sheet</span>
        </button>
      </div>

      {/* Sheet Table */}
      <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-3.5 w-24">Time</th>
              <th className="py-3 px-3.5">Activity & Execution Cue</th>
              <th className="py-3 px-3.5 w-48">Lead / Committee</th>
              <th className="py-3 px-3.5">Notes</th>
              <th className="py-3 px-3.5 text-right w-24 print:hidden">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {runSheet.map(entry => {
              const isEditing = editingId === entry.id;

              if (isEditing) {
                return (
                  <tr key={entry.id} className="bg-amber-50/50">
                    <td className="py-2.5 px-3.5">
                      <input
                        type="text"
                        value={editForm.time}
                        onChange={e => setEditForm(prev => ({ ...prev, time: e.target.value }))}
                        className="w-full font-bold text-xs bg-white border border-slate-300 rounded px-2 py-1"
                      />
                    </td>
                    <td className="py-2.5 px-3.5">
                      <input
                        type="text"
                        value={editForm.activity}
                        onChange={e => setEditForm(prev => ({ ...prev, activity: e.target.value }))}
                        className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-1"
                      />
                    </td>
                    <td className="py-2.5 px-3.5">
                      <input
                        type="text"
                        value={editForm.responsible}
                        onChange={e => setEditForm(prev => ({ ...prev, responsible: e.target.value }))}
                        className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-1"
                      />
                    </td>
                    <td className="py-2.5 px-3.5">
                      <input
                        type="text"
                        value={editForm.notes}
                        onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-1"
                      />
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <button
                        onClick={() => saveEdit(entry.id)}
                        className="px-2.5 py-1 bg-amber-600 text-white rounded font-bold text-xs hover:bg-amber-700"
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3.5 font-bold font-mono text-amber-900">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      {entry.time}
                    </span>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-bold text-slate-900">{entry.activity}</div>
                    {entry.isUserEdited && (
                      <span className="inline-block mt-0.5 text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                        Custom User Override (Protected from Re-plan)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 font-medium text-slate-700">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {entry.responsible}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-slate-500">{entry.notes}</td>
                  <td className="py-3 px-3.5 text-right print:hidden">
                    <button
                      onClick={() => startEdit(entry)}
                      className="p-1 rounded text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                      title="Edit slot"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
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

