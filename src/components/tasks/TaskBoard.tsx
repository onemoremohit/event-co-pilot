'use client';

import React from 'react';
import { TaskGraph, Task, TaskStatus } from '@/lib/types';
import { CULTURAL_CATEGORIES } from '@/lib/constants/cultural';
import { CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

interface TaskBoardProps {
  tasks: TaskGraph;
  onUpdateStatus: (taskId: string, status: TaskStatus) => Promise<void>;
}

export function TaskBoard({ tasks, onUpdateStatus }: TaskBoardProps) {
  const columns: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'pending', title: 'To Do', color: 'border-slate-300 text-slate-700 bg-slate-100' },
    { id: 'in_progress', title: 'In Progress', color: 'border-blue-300 text-blue-800 bg-blue-50' },
    { id: 'at_risk', title: 'At Risk / Rush', color: 'border-orange-300 text-orange-900 bg-orange-50' },
    { id: 'done', title: 'Completed', color: 'border-emerald-300 text-emerald-800 bg-emerald-50' }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Community Task Board</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate volunteers and committee heads with milestone deadlines.
          </p>
        </div>

        <div className="text-xs text-slate-500">
          <span>Total Tasks: </span>
          <strong className="text-slate-900">{tasks.tasks.length}</strong>
        </div>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(col => {
          const colTasks = tasks.tasks.filter(t => t.status === col.id);

          return (
            <div key={col.id} className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/70 flex flex-col">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="font-bold text-xs text-slate-700">{col.title}</span>
                <span className="text-[11px] font-extrabold bg-white text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px]">
                {colTasks.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs italic">
                    No tasks in {col.title.toLowerCase()}
                  </div>
                ) : (
                  colTasks.map(task => {
                    const meta = CULTURAL_CATEGORIES[task.category];
                    return (
                      <div
                        key={task.id}
                        className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2 hover:shadow-xs transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="text-xs shrink-0">{meta?.icon || '📌'}</span>
                          <span className="font-bold text-xs text-slate-900 flex-1 leading-snug">
                            {task.title}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 line-clamp-2">{task.description}</p>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(task.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </span>

                          <select
                            value={task.status}
                            onChange={e => onUpdateStatus(task.id, e.target.value as TaskStatus)}
                            className="text-[10px] font-semibold bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none"
                          >
                            <option value="pending">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="at_risk">At Risk</option>
                            <option value="done">Done</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
