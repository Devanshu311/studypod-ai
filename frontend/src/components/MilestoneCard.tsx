import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  Clock3,
  AlertCircle,
  HelpCircle,
  GripVertical,
} from 'lucide-react';
import { Milestone } from '../types';
import Avatar from './Avatar';

export interface MilestoneCardProps {
  milestone: Milestone;
  onUpdateStatus: (id: string, status: Milestone['status']) => void;
  draggable?: boolean;
}

export const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  onUpdateStatus,
  draggable = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Compute status and relative date formatting
  const calculateRelativeDate = (dueDateString: string) => {
    try {
      const due = new Date(dueDateString);
      const now = new Date();
      // Difference in days
      const diffTime = due.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return { text: `Overdue by ${Math.abs(diffDays)}d`, isOverdue: true };
      } else if (diffDays === 0) {
        return { text: 'Due today', isOverdue: false, isSoon: true };
      } else if (diffDays === 1) {
        return { text: 'Due tomorrow', isOverdue: false, isSoon: true };
      } else {
        return { text: `Due in ${diffDays} days`, isOverdue: false };
      }
    } catch {
      return { text: dueDateString, isOverdue: false };
    }
  };

  const relDate = calculateRelativeDate(milestone.due_date);

  // Border and badge color mappings
  const getStatusVisuals = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return {
          border: 'border-l-emerald-500',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />,
          label: 'Completed',
        };
      case 'in_progress':
        return {
          border: 'border-l-amber-500',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <Clock3 className="h-3.5 w-3.5 text-amber-600" />,
          label: 'In Progress',
        };
      case 'overdue':
        return {
          border: 'border-l-rose-500',
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <AlertCircle className="h-3.5 w-3.5 text-rose-600" />,
          label: 'Overdue',
        };
      case 'pending':
      default:
        return {
          border: 'border-l-slate-400',
          badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <HelpCircle className="h-3.5 w-3.5 text-slate-500" />,
          label: 'Pending',
        };
    }
  };

  const visuals = getStatusVisuals(milestone.status);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', milestone.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      className={`group relative rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs transition-all hover:shadow-md border-l-4 ${visuals.border} select-none`}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex-1 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            {milestone.created_by === 'ai' && (
              <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-200">
                <Sparkles className="h-2.5 w-2.5" />
                AI Coach
              </span>
            )}
            <h4 className="text-sm font-semibold text-slate-900 group-hover:text-violet-600 transition">
              {milestone.title}
            </h4>
          </div>

          {milestone.description && (
            <p
              className={`mt-1 text-xs text-slate-500 leading-relaxed ${
                isExpanded ? '' : 'line-clamp-2'
              }`}
            >
              {milestone.description}
            </p>
          )}
        </div>

        {draggable && (
          <div className="cursor-grab text-slate-300 hover:text-slate-500 active:cursor-grabbing">
            <GripVertical className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Footer Info: Due date badge, Avatar, and Status Selector */}
      <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
        {/* Due date tag */}
        <div
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium border ${
            relDate.isOverdue
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : relDate.isSoon
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}
          title={`Due: ${new Date(milestone.due_date).toLocaleDateString()}`}
        >
          <Calendar className="h-3 w-3" />
          <span>{relDate.text}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Assigned user avatar */}
          <Avatar username={milestone.user_id ? 'Member' : 'Pod'} size="sm" />

          {/* Status Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold transition ${visuals.badgeBg}`}
            >
              {visuals.icon}
              <span className="capitalize">{visuals.label}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 bottom-full mb-1 z-30 w-36 rounded-xl bg-white p-1 text-slate-800 shadow-lg ring-1 ring-black/5">
                  {(['pending', 'in_progress', 'completed', 'overdue'] as const).map(
                    (statusKey) => (
                      <button
                        key={statusKey}
                        onClick={() => {
                          onUpdateStatus(milestone.id, statusKey);
                          setIsMenuOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium capitalize transition ${
                          milestone.status === statusKey
                            ? 'bg-violet-50 font-bold text-violet-700'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {statusKey.replace('_', ' ')}
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilestoneCard;
