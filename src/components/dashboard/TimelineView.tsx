'use client';

import React from 'react';
import { TaskGraph, Task } from '@/lib/types';
import { CULTURAL_CATEGORIES } from '@/lib/constants/cultural';
import { Zap, Clock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

interface TimelineViewProps {
  tasks: TaskGraph;
  eventDate: string;
}

export function TimelineView({ tasks, eventDate }: TimelineViewProps) {
  const sortedTasks = [...tasks.tasks].sort((a, b) => a.deadline.localeCompare(b.deadline));
  const criticalPathSet = new Set(tasks.criticalPath);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Backward DAG Schedule</h2>
            {tasks.rushMode ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                <Zap className="w-3 h-3 fill-amber-600 text-amber-600" />
                Rush Mode Active
              </span>
            ) : (
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full">
                Standard Lead Times
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Calculated backward from event date ({new Date(eventDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}).
          </p>
        </div>

        <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <span>Available Planning Window: </span>
          <strong className="text-slate-900">{tasks.totalDaysAvailable} Days</strong>
        </div>
      </div>

      {/* Warnings & Rush Alerts */}
      {tasks.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1">
          {tasks.warnings.map((w, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs font-medium text-amber-900">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Task List / Timeline */}
      <div className="space-y-3">
        {sortedTasks.map((task, index) => {
          const isCritical = criticalPathSet.has(task.id);
          const meta = CULTURAL_CATEGORIES[task.category];

          return (
            <div
              key={task.id}
              className={`p-3.5 rounded-xl border transition-all ${
                task.isRushFlagged
                  ? 'bg-orange-50/60 border-orange-300'
                  : isCritical
                  ? 'bg-amber-50/30 border-amber-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0">{meta?.icon || '📌'}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{task.title}</h4>
                      {isCritical && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                          Critical Path
                        </span>
                      )}
                      {task.isRushFlagged && (
                        <span className="text-[10px] font-bold bg-orange-100 text-orange-900 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5 fill-current" /> Rush
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Due: {new Date(task.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Lead: {task.leadTimeDays}d • Assigned: {task.assignee}
                  </span>
                </div>
              </div>

              {/* Rush Alternative if flagged */}
              {task.isRushFlagged && task.rushAlternative && (
                <div className="mt-2.5 pt-2 border-t border-orange-200/60 flex items-start gap-1.5 text-xs text-orange-900 bg-orange-100/40 p-2 rounded-lg">
                  <span className="font-bold shrink-0">⚡ Faster Alternative:</span>
                  <span>{task.rushAlternative}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

