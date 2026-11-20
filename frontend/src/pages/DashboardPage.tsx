import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Flame,
  BookOpen,
  CheckCircle2,
  Users,
  Plus,
  Play,
  ArrowRight,
  Clock,
  Sparkles,
  Calendar,
  MessageSquare,
  AlertCircle,
  X,
  Compass,
  Share2,
  Copy,
  UserPlus,
  Search,
  GraduationCap,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePodStore } from '../store/podStore';
import { milestoneAPI, podAPI } from '../services/api';
import { Milestone, StudyStats, PeerStudent } from '../types';
import Avatar from '../components/Avatar';
import MilestoneCard from '../components/MilestoneCard';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    pods,
    fetchPods,
    setActivePod,
    queueStatus,
    joinQueue,
    checkQueueStatus,
    isLoading: podsLoading,
  } = usePodStore();

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [stats, setStats] = useState<StudyStats>({
    total_hours: 14.5,
    current_streak: 5,
    milestones_completed: 12,
    pods_active: 0,
  });

  const [isFindPodModalOpen, setIsFindPodModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(user?.target_exam || 'JEE 2027');
  const [isQueueing, setIsQueueing] = useState(false);

  // Peer Discovery state
  const [peers, setPeers] = useState<PeerStudent[]>([]);
  const [peersLoading, setPeersLoading] = useState(false);
  const [peerSearch, setPeerSearch] = useState('');
  const [peerExamFilter, setPeerExamFilter] = useState('all');

  const loadPeers = async () => {
    setPeersLoading(true);
    try {
      const data = await podAPI.getPeers(peerSearch, peerExamFilter);
      setPeers(data);
    } catch {
      setPeers([]);
    } finally {
      setPeersLoading(false);
    }
  };

  useEffect(() => {
    fetchPods().catch((err) => console.error('Error fetching pods:', err));
    checkQueueStatus().catch((err) => console.error('Error checking queue:', err));
    loadMyMilestones();
    loadPeers();
  }, []);

  useEffect(() => {
    loadPeers();
  }, [peerExamFilter]);

  const handleInvitePeer = async (peer: PeerStudent) => {
    if (pods.length === 0) {
      toast.error('You need to join or create a Study Pod first!');
      return;
    }
    const currentPod = pods[0];
    try {
      const res = await podAPI.invitePeer(currentPod.id, peer.id);
      toast.success(res.message || `Added @${peer.username} to your pod!`);
      await fetchPods();
      await loadPeers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to add student to pod');
    }
  };

  const handleJoinPeerPod = async (peer: PeerStudent) => {
    if (!peer.pod_id) {
      toast.error(`@${peer.username} is not in an active pod yet!`);
      return;
    }
    try {
      const res = await podAPI.joinPodById(peer.pod_id);
      toast.success(res.message || `Joined ${peer.current_pod}!`);
      await fetchPods();
      navigate(`/pod/${peer.pod_id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to join this pod');
    }
  };

  useEffect(() => {
    if (user?.target_exam) {
      setSelectedExam(user.target_exam);
    }
  }, [user]);

  useEffect(() => {
    setStats((prev) => ({
      ...prev,
      pods_active: pods.length,
    }));
  }, [pods]);

  const loadMyMilestones = async () => {
    try {
      const data = await milestoneAPI.getMy();
      setMilestones(data);
    } catch {
      // Mock some sample initial milestones for student delight if empty
      setMilestones([
        {
          id: 'm1',
          pod_id: 'default',
          user_id: user?.id || 'u1',
          title: 'Complete 30 Calculus Integration Practice Problems',
          description: 'Focus on trigonometric substitution and partial fractions',
          due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
          status: 'in_progress',
          created_by: 'ai',
          created_at: new Date().toISOString(),
        },
        {
          id: 'm2',
          pod_id: 'default',
          user_id: user?.id || 'u1',
          title: 'Electrostatics Review: Gauss Law & Potentials',
          description: 'Chapter 2 summary notes & HC Verma exercises',
          due_date: new Date(Date.now() + 86400000 * 4).toISOString(),
          status: 'pending',
          created_by: 'user',
          created_at: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleUpdateMilestoneStatus = async (id: string, newStatus: Milestone['status']) => {
    try {
      await milestoneAPI.updateStatus(id, newStatus);
      setMilestones((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
      );
      toast.success('Milestone updated!');
    } catch {
      // Optimistic update
      setMilestones((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
      );
    }
  };

  const handleJoinQueue = async () => {
    setIsQueueing(true);
    try {
      const status = await joinQueue(selectedExam);
      setIsFindPodModalOpen(false);
      toast.success(
        `Added to queue for ${status.exam_category}! Est. wait: ${status.estimated_wait}`,
        { duration: 4000 }
      );
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to enter queue');
    } finally {
      setIsQueueing(false);
    }
  };

  const [modalTab, setModalTab] = useState<'match' | 'code'>('match');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isJoiningCode, setIsJoiningCode] = useState(false);

  const handleJoinByCode = async () => {
    if (!inviteCodeInput.trim()) {
      toast.error('Please enter a valid Pod Invite Code or ID');
      return;
    }
    setIsJoiningCode(true);
    try {
      const res = await podAPI.joinPodById(inviteCodeInput.trim());
      toast.success(res.message || 'Joined study pod successfully!');
      setIsFindPodModalOpen(false);
      setInviteCodeInput('');
      await fetchPods();
      if (res.pod?.id) {
        navigate(`/pod/${res.pod.id}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to join pod with this code');
    } finally {
      setIsJoiningCode(false);
    }
  };

  const handleEnterPod = (pod: (typeof pods)[0]) => {
    setActivePod(pod);
    navigate(`/pod/${pod.id}`);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner: Matchmaking Queue Status if Active */}
      {queueStatus && (
        <div className="relative overflow-hidden rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-white p-5 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white shadow-sm">
                <Users className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-teal-500" />
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Matching in progress for {queueStatus.exam_category}...
                </h3>
                <p className="text-xs text-slate-600">
                  You are at position #{queueStatus.position} in line. Estimated match time:{' '}
                  <span className="font-semibold text-teal-700">{queueStatus.estimated_wait}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal-700 border border-teal-200 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                Algorithm Searching Peers
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
            Welcome back, {user?.username || 'Student'}! 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Targeting <span className="font-semibold text-violet-700">{user?.target_exam || 'Exams'}</span>. Let's make today count!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFindPodModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-violet-500/20 hover:bg-violet-700 transition"
          >
            <Plus className="h-4 w-4" />
            Find a Study Pod
          </button>
        </div>
      </div>

      {/* Top 4 Stats Bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Stat 1: Study Streak */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Study Streak
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
              <Flame className="h-5 w-5 fill-amber-500" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">
            {stats.current_streak} <span className="text-sm font-medium text-slate-400">days</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">🔥 Active streak — keep going!</p>
        </div>

        {/* Stat 2: Hours This Week */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Hours This Week
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">
            {stats.total_hours} <span className="text-sm font-medium text-slate-400">hrs</span>
          </div>
          <p className="mt-1 text-[11px] text-violet-600 font-medium">Goal: {Math.round((user?.study_hours_goal || 120) / 60 * 7)} hrs/week</p>
        </div>

        {/* Stat 3: Milestones Done */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Milestones Done
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">
            {stats.milestones_completed}
          </div>
          <p className="mt-1 text-[11px] text-teal-600 font-medium">+3 completed this week</p>
        </div>

        {/* Stat 4: Active Pods */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Pods
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">
            {stats.pods_active}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">Max capacity: 4 per pod</p>
        </div>
      </div>

      {/* Main Content Area: Split 2 Columns */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Active Pods List (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Your Active Pods</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {pods.length}
              </span>
            </div>
            {pods.length > 0 && (
              <button
                onClick={() => setIsFindPodModalOpen(true)}
                className="text-xs font-semibold text-violet-600 hover:text-violet-700"
              >
                + Join Another
              </button>
            )}
          </div>

          {podsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : pods.length === 0 ? (
            /* No pods joined state */
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <Compass className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">No Active Study Pods Yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-xs text-slate-500 leading-relaxed">
                StudyPod pairs you with 3 peers studying for {user?.target_exam || 'your target exam'}.
                Enter the matchmaking queue to get paired within minutes!
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setIsFindPodModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-violet-500/20 hover:bg-violet-700 transition"
                >
                  <Plus className="h-4 w-4" />
                  Find My Study Pod
                </button>
              </div>
            </div>
          ) : (
            /* Pods Cards Grid */
            <div className="space-y-4">
              {pods.map((pod) => (
                <div
                  key={pod.id}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-violet-300 hover:shadow-md"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-violet-700 transition">
                          {pod.name}
                        </h3>
                        <span className="rounded-md bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700 border border-violet-100">
                          {pod.exam_category}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Created {new Date(pod.created_at).toLocaleDateString()} • {pod.members?.length || 0}/4 Members
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(pod.id);
                          toast.success(`Pod Code copied to clipboard!\nShare this code with your friends to study together: ${pod.id}`);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition"
                        title="Copy Pod Invite Code for friends"
                      >
                        <Share2 className="h-3.5 w-3.5 text-violet-600" />
                        <span>Invite Friend</span>
                      </button>

                      <button
                        onClick={() => handleEnterPod(pod)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-700 transition"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Open Pod</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Members Avatars and Status */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium">Members:</span>
                      <div className="flex -space-x-2">
                        {pod.members?.map((m) => (
                          <Avatar
                            key={m.user_id}
                            username={m.username}
                            size="sm"
                            className="ring-2 ring-white"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        Active today
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Today's Milestones + Quick Pomodoro Widget (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Quick Pomodoro Widget */}
          <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-500/10 via-white to-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 text-white shadow-xs">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Quick Pomodoro Sprint</h3>
                  <p className="text-[11px] text-teal-700 font-medium">Stay in the zone</p>
                </div>
              </div>

              <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-800">
                25 Min
              </span>
            </div>

            <p className="mt-3 text-xs text-slate-600 leading-relaxed">
              Launch a 25-minute focus session right now. If you're in a pod, peers can join you live!
            </p>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => {
                  if (pods.length > 0) {
                    navigate(`/pod/${pods[0].id}/pomodoro`);
                  } else {
                    toast('Starting solo focus session!');
                  }
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-500 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-600 transition"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>Start Focus Sprint</span>
              </button>
            </div>
          </div>

          {/* Today's Milestones */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-violet-600" />
                Today's Milestones
              </h2>
              <span className="text-xs font-semibold text-slate-400">
                {milestones.length} items
              </span>
            </div>

            {milestones.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
                No milestones for today. Plan one to stay on track!
              </div>
            ) : (
              <div className="space-y-2.5">
                {milestones.slice(0, 3).map((milestone) => (
                  <MilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    onUpdateStatus={handleUpdateMilestoneStatus}
                    draggable={false}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Peer Discovery Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-600" />
              Find Study Buddies & Active Students
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Discover and connect with fellow students preparing for exams. Join their pods or invite them to study together!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={peerSearch}
                onChange={(e) => setPeerSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadPeers()}
                placeholder="Search by name..."
                className="rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none"
              />
            </div>

            <select
              value={peerExamFilter}
              onChange={(e) => setPeerExamFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 font-medium focus:border-violet-500 focus:bg-white focus:outline-none"
            >
              <option value="all">All Exams</option>
              <option value="GATE CS">GATE CS</option>
              <option value="JEE 2027">JEE 2027</option>
              <option value="University Semester">University Semester</option>
              <option value="UPSC CSE">UPSC CSE</option>
              <option value="CAT 2027">CAT 2027</option>
            </select>
          </div>
        </div>

        {/* Peers Grid */}
        {peersLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-violet-600 border-r-transparent" />
          </div>
        ) : peers.length === 0 ? (
          <div className="rounded-xl bg-slate-50 p-6 text-center text-xs text-slate-500">
            No students found matching this filter. Try selecting another exam or clearing the search!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {peers.map((peer) => (
              <div
                key={peer.id}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:bg-white hover:border-violet-300 hover:shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar username={peer.username} size="md" online={true} />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-violet-600 transition">
                          {peer.username}
                        </h4>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <GraduationCap className="h-3 w-3 text-slate-400" />
                          {peer.university}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                      {peer.target_exam}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-semibold text-amber-600">
                      <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      {peer.study_streak}d streak
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {peer.minutes_studied}m focused
                    </span>
                  </div>

                  {peer.current_pod && (
                    <div className="mt-2 text-[11px] text-slate-500 truncate">
                      Pod: <span className="font-medium text-slate-700">{peer.current_pod}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-slate-200/60 pt-3">
                  {peer.pod_id && (!pods.some((p) => p.id === peer.pod_id)) ? (
                    <button
                      onClick={() => handleJoinPeerPod(peer)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-teal-600 py-1.5 text-xs font-bold text-white hover:bg-teal-700 transition"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>Join Their Pod</span>
                    </button>
                  ) : null}

                  {pods.length > 0 && pods[0].members.length < 4 && !pods[0].members.some((m) => m.user_id === peer.id) ? (
                    <button
                      onClick={() => handleInvitePeer(peer)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-violet-600 py-1.5 text-xs font-bold text-white hover:bg-violet-700 transition"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Invite to My Pod</span>
                    </button>
                  ) : null}

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`Hi @${peer.username}, let's study together on StudyPod AI!`);
                      toast.success(`Invite message copied for @${peer.username}!`);
                    }}
                    className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                    title="Send invite text"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity Feed at bottom */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600" />
          Recent Pod Activity
        </h3>

        <div className="mt-4 divide-y divide-slate-100">
          <div className="flex items-center justify-between py-3 text-xs">
            <div className="flex items-center gap-3">
              <Avatar username="Sarah" size="sm" />
              <div>
                <span className="font-semibold text-slate-800">Sarah</span>{' '}
                <span className="text-slate-500">completed a 50m Pomodoro session</span>
              </div>
            </div>
            <span className="text-slate-400 text-[11px]">10m ago</span>
          </div>

          <div className="flex items-center justify-between py-3 text-xs">
            <div className="flex items-center gap-3">
              <Avatar username="StudyBot" size="sm" />
              <div>
                <span className="font-semibold text-violet-700">StudyBot 🤖</span>{' '}
                <span className="text-slate-500">assigned weekly milestone to Pod Alpha</span>
              </div>
            </div>
            <span className="text-slate-400 text-[11px]">1h ago</span>
          </div>

          <div className="flex items-center justify-between py-3 text-xs">
            <div className="flex items-center gap-3">
              <Avatar username="Dev" size="sm" />
              <div>
                <span className="font-semibold text-slate-800">Dev</span>{' '}
                <span className="text-slate-500">reached 5-day study streak 🔥</span>
              </div>
            </div>
            <span className="text-slate-400 text-[11px]">3h ago</span>
          </div>
        </div>
      </div>

      {/* Find a Pod Matchmaking Modal */}
      {isFindPodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                  <Users className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Study Pod Center</h3>
              </div>
              <button
                onClick={() => setIsFindPodModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="mt-4 flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setModalTab('match')}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                  modalTab === 'match'
                    ? 'bg-white text-violet-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Auto Match Peers
              </button>
              <button
                type="button"
                onClick={() => setModalTab('code')}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                  modalTab === 'code'
                    ? 'bg-white text-violet-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Join Friend's Pod
              </button>
            </div>

            {modalTab === 'match' ? (
              <div className="mt-4 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Choose the exam category you are preparing for. Our matchmaking system will group
                  you with 3 other motivated students studying the same material.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Exam Category
                  </label>
                  <select
                    value={selectedExam}
                    onChange={(e) => setSelectedExam(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  >
                    <option value="JEE 2027">JEE 2027</option>
                    <option value="GATE CS">GATE CS</option>
                    <option value="UPSC CSE">UPSC CSE</option>
                    <option value="CAT 2027">CAT 2027</option>
                    <option value="University Semester">University Semester</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="rounded-xl bg-violet-50/70 p-3.5 text-xs text-violet-800 border border-violet-100">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-violet-600 flex-shrink-0 mt-0.5" />
                    <span>
                      Pods rotate automatically every 2-4 weeks or when members achieve their milestones.
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFindPodModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isQueueing}
                    onClick={handleJoinQueue}
                    className="rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-700 disabled:opacity-50"
                  >
                    {isQueueing ? 'Joining Queue...' : 'Join Matching Queue'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Has a friend or classmate shared their Pod Code with you? Paste it below to study and chat together immediately!
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pod Invite Code or ID
                  </label>
                  <input
                    type="text"
                    value={inviteCodeInput}
                    onChange={(e) => setInviteCodeInput(e.target.value)}
                    placeholder="e.g. dad3e476-7559-450b-af85-ddeb5d6f19f6"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 font-mono placeholder:font-sans focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>

                <div className="rounded-xl bg-teal-50/70 p-3.5 text-xs text-teal-800 border border-teal-100">
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span>
                      You will instantly join your friend's group chat, shared Pomodoro sessions, and milestone tracker.
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFindPodModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isJoiningCode}
                    onClick={handleJoinByCode}
                    className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700 disabled:opacity-50"
                  >
                    {isJoiningCode ? 'Joining...' : 'Join Friend’s Pod'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
