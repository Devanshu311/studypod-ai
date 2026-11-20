import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  X,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePodStore } from '../store/podStore';
import { milestoneAPI, podAPI } from '../services/api';
import { Milestone, Pod } from '../types';
import MilestoneCard from '../components/MilestoneCard';

export const MilestonePage: React.FC = () => {
  const { podId } = useParams<{ podId: string }>();
  const { user } = useAuthStore();
  const { pods, activePod } = usePodStore();

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [currentPod, setCurrentPod] = useState<Pod | null>(activePod);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add Milestone Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  // AI Suggested Milestones
  const [aiSuggestions, setAiSuggestions] = useState<
    Array<{ id: string; title: string; desc: string; days: number }>
  >([
    {
      id: 'ai-sug-1',
      title: 'Review High-Yield Mock Test Questions (Topics 1-4)',
      desc: 'Analyze common mistakes and bookmark tricky formula applications.',
      days: 3,
    },
    {
      id: 'ai-sug-2',
      title: 'Complete 40 Speed Problem Sprints under 60 minutes',
      desc: 'Focus on accuracy and rapid formula recollection.',
      days: 5,
    },
    {
      id: 'ai-sug-3',
      title: 'Create Consolidated Formula Cheat Sheet for Next Pod Review',
      desc: 'Summarize key derivations and edge conditions.',
      days: 2,
    },
  ]);

  useEffect(() => {
    loadPodAndMilestones();
  }, [podId]);

  const loadPodAndMilestones = async () => {
    setIsLoading(true);
    try {
      if (podId) {
        try {
          const pod = await podAPI.getPod(podId);
          setCurrentPod(pod);
        } catch {
          const found = pods.find((p) => p.id === podId);
          if (found) setCurrentPod(found);
        }

        const data = await milestoneAPI.getByPod(podId);
        setMilestones(data);
      } else {
        const data = await milestoneAPI.getMy();
        setMilestones(data);
      }
    } catch {
      // Fallback demo milestones
      setMilestones([
        {
          id: 'm1',
          pod_id: podId || 'pod1',
          user_id: user?.id || 'u1',
          title: 'Complete 30 Calculus Integration Problems',
          description: 'Focus on trigonometric substitution and partial fractions',
          due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
          status: 'in_progress',
          created_by: 'ai',
          created_at: new Date().toISOString(),
        },
        {
          id: 'm2',
          pod_id: podId || 'pod1',
          user_id: user?.id || 'u1',
          title: 'Read & Outline Electrostatics Chapter 3',
          description: 'Electric potential and capacitance derivations',
          due_date: new Date(Date.now() + 86400000 * 4).toISOString(),
          status: 'pending',
          created_by: 'user',
          created_at: new Date().toISOString(),
        },
        {
          id: 'm3',
          pod_id: podId || 'pod1',
          user_id: user?.id || 'u1',
          title: 'Full Length Diagnostic Mock Exam #1',
          description: 'Timed 3-hour exam simulation under test conditions',
          due_date: new Date(Date.now() - 86400000 * 1).toISOString(),
          status: 'completed',
          created_by: 'ai',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: Milestone['status']) => {
    try {
      await milestoneAPI.updateStatus(id, status);
      setMilestones((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status } : m))
      );
      toast.success(`Milestone moved to ${status.replace('_', ' ')}!`);
    } catch {
      // Optimistic update
      setMilestones((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status } : m))
      );
    }
  };

  // Drag and Drop Column Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropToColumn = (e: React.DragEvent, targetStatus: Milestone['status']) => {
    e.preventDefault();
    const milestoneId = e.dataTransfer.getData('text/plain');
    if (milestoneId) {
      handleUpdateStatus(milestoneId, targetStatus);
    }
  };

  // Add Milestone Submission
  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate) {
      toast.error('Please enter a title and due date.');
      return;
    }

    try {
      const created = await milestoneAPI.create({
        pod_id: podId || 'default',
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        due_date: new Date(newDueDate).toISOString(),
      });

      setMilestones((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      setNewDueDate('');
      toast.success('Milestone created!');
    } catch {
      // Fallback optimistic
      const newM: Milestone = {
        id: `m-custom-${Date.now()}`,
        pod_id: podId || 'default',
        user_id: user?.id || 'u1',
        title: newTitle.trim(),
        description: newDesc.trim(),
        due_date: new Date(newDueDate).toISOString(),
        status: 'pending',
        created_by: 'user',
        created_at: new Date().toISOString(),
      };
      setMilestones((prev) => [newM, ...prev]);
      setIsModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      setNewDueDate('');
      toast.success('Milestone added to pod!');
    }
  };

  // Accept AI Suggestion
  const handleAcceptAiSuggestion = (sug: (typeof aiSuggestions)[0]) => {
    const newM: Milestone = {
      id: `ai-acc-${Date.now()}`,
      pod_id: podId || 'default',
      user_id: user?.id || 'u1',
      title: sug.title,
      description: sug.desc,
      due_date: new Date(Date.now() + 86400000 * sug.days).toISOString(),
      status: 'pending',
      created_by: 'ai',
      created_at: new Date().toISOString(),
    };
    setMilestones((prev) => [newM, ...prev]);
    setAiSuggestions((prev) => prev.filter((s) => s.id !== sug.id));
    toast.success('AI Milestone added to your sprint backlog!');
  };

  // Filter milestones by search
  const filteredMilestones = milestones.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Kanban Columns
  const todoItems = filteredMilestones.filter(
    (m) => m.status === 'pending' || m.status === 'overdue'
  );
  const inProgressItems = filteredMilestones.filter((m) => m.status === 'in_progress');
  const doneItems = filteredMilestones.filter((m) => m.status === 'completed');

  // Completion calculation
  const totalCount = milestones.length;
  const completedCount = milestones.filter((m) => m.status === 'completed').length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">
              {currentPod ? `${currentPod.name} Goals` : 'Study Pod Milestones'}
            </h1>
            {currentPod && (
              <span className="rounded-md bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                {currentPod.exam_category}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Sprint milestones and group commitments. Drag tasks between columns to update status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {podId && (
            <Link
              to={`/pod/${podId}`}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Back to Chat
            </Link>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-500/20 hover:bg-violet-700 transition"
          >
            <Plus className="h-4 w-4" />
            Add Milestone
          </button>
        </div>
      </div>

      {/* Progress Bar & Filter Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 max-w-md">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-700">
                <TrendingUp className="h-4 w-4 text-violet-600" />
                Sprint Completion
              </span>
              <span className="text-violet-700 font-bold">{completionPercentage}%</span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-teal-400 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {completedCount} of {totalCount} milestones completed
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search goals..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* AI Suggested Milestones Section */}
      {aiSuggestions.length > 0 && (
        <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/70 via-indigo-50/40 to-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-white shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-purple-950">
                AI Coach Suggested Milestones
              </h3>
            </div>
            <span className="text-[11px] font-medium text-purple-700">
              Tailored for {currentPod?.exam_category || user?.target_exam || 'Exams'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {aiSuggestions.map((sug) => (
              <div
                key={sug.id}
                className="flex flex-col justify-between rounded-xl border border-purple-200/80 bg-white p-3.5 shadow-2xs hover:border-purple-300 transition"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{sug.title}</h4>
                  <p className="mt-1 text-[11px] text-slate-500 leading-normal">{sug.desc}</p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-purple-50 pt-2 text-[11px]">
                  <span className="text-purple-600 font-medium">Sprint: {sug.days} days</span>
                  <button
                    onClick={() => handleAcceptAiSuggestion(sug)}
                    className="inline-flex items-center gap-1 rounded-lg bg-purple-100 px-2.5 py-1 font-semibold text-purple-800 hover:bg-purple-200 transition"
                  >
                    <span>Add to Pod</span>
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Three-Column Kanban Board */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Column 1: To Do */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropToColumn(e, 'pending')}
          className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/80 p-4 min-h-[480px]"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              <h3 className="text-sm font-bold text-slate-800">To Do</h3>
            </div>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600">
              {todoItems.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {todoItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-400">
                Drop items here to move to To Do
              </div>
            ) : (
              todoItems.map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  onUpdateStatus={handleUpdateStatus}
                  draggable={true}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropToColumn(e, 'in_progress')}
          className="flex flex-col rounded-2xl border border-amber-200/80 bg-amber-50/30 p-4 min-h-[480px]"
        >
          <div className="flex items-center justify-between pb-3 border-b border-amber-200/80 mb-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <h3 className="text-sm font-bold text-amber-900">In Progress</h3>
            </div>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
              {inProgressItems.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {inProgressItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-amber-300 p-6 text-center text-xs text-amber-600/70">
                Drop active tasks here
              </div>
            ) : (
              inProgressItems.map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  onUpdateStatus={handleUpdateStatus}
                  draggable={true}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 3: Done */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropToColumn(e, 'completed')}
          className="flex flex-col rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-4 min-h-[480px]"
        >
          <div className="flex items-center justify-between pb-3 border-b border-emerald-200/80 mb-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-bold text-emerald-900">Done</h3>
            </div>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
              {doneItems.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {doneItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-emerald-300 p-6 text-center text-xs text-emerald-600/70">
                Drop completed tasks here 🎉
              </div>
            ) : (
              doneItems.map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  onUpdateStatus={handleUpdateStatus}
                  draggable={true}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Milestone Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create New Milestone</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Goal / Milestone Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Master Organic Chemistry Mechanisms Chapter 5"
                  className="mt-1 block w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Description <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Include specific problem numbers, page ranges, or test links..."
                  className="mt-1 block w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Target Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-700 transition"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestonePage;
