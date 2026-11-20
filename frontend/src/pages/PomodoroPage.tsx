import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Timer,
  Users,
  MessageSquare,
  Sparkles,
  Volume2,
  VolumeX,
  Flame,
  Award,
  ChevronLeft,
  CheckCircle,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePodStore } from '../store/podStore';
import { podAPI, pomodoroAPI } from '../services/api';
import { Pod, PomodoroSession } from '../types';
import PomodoroTimer from '../components/PomodoroTimer';
import Avatar from '../components/Avatar';

export const PomodoroPage: React.FC = () => {
  const { podId } = useParams<{ podId: string }>();
  const { user } = useAuthStore();
  const { pods, activePod } = usePodStore();

  const [currentPod, setCurrentPod] = useState<Pod | null>(activePod);
  const [activeSession, setActiveSession] = useState<PomodoroSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<PomodoroSession[]>([]);
  const [ambientSound, setAmbientSound] = useState<string | null>(null);

  useEffect(() => {
    if (!podId) return;

    const loadData = async () => {
      try {
        const pod = await podAPI.getPod(podId);
        setCurrentPod(pod);
      } catch {
        const found = pods.find((p) => p.id === podId);
        if (found) setCurrentPod(found);
      }

      try {
        const active = await pomodoroAPI.getActive(podId);
        setActiveSession(active);

        const history = await pomodoroAPI.getHistory(podId);
        setSessionHistory(history);
      } catch {
        // Mock sample session history
        setSessionHistory([
          {
            id: 'sess-1',
            pod_id: podId,
            initiated_by: 'Alice',
            started_at: new Date(Date.now() - 3600000).toISOString(),
            duration_minutes: 25,
            break_minutes: 5,
            status: 'completed',
            participants: [
              {
                id: 'p1',
                user_id: 'u1',
                username: 'Alice',
                joined_at: new Date().toISOString(),
                completed: true,
                focus_score: 95,
              },
              {
                id: 'p2',
                user_id: user?.id || 'u2',
                username: user?.username || 'You',
                joined_at: new Date().toISOString(),
                completed: true,
                focus_score: 98,
              },
            ],
          },
        ]);
      }
    };

    loadData();
  }, [podId]);

  const toggleSound = (soundType: string) => {
    if (ambientSound === soundType) {
      setAmbientSound(null);
      toast('Ambient sound muted');
    } else {
      setAmbientSound(soundType);
      toast.success(`Playing ambient: ${soundType}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to={`/pod/${podId}`}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-900 transition"
              title="Return to Pod Chat"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-black text-slate-900">
              {currentPod ? `${currentPod.name} Focus Room` : 'Group Pomodoro'}
            </h1>
            <span className="rounded-md bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
              Live Sync
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Work in synchronized Pomodoro focus intervals with your pod mates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/pod/${podId}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <MessageSquare className="h-3.5 w-3.5 text-violet-600" />
            <span>Open Chat</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Timer on Left, Participant & Focus Stats on Right */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Pomodoro Circular Timer (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          <PomodoroTimer
            podId={podId}
            session={activeSession}
            onSessionUpdate={(updated) => setActiveSession(updated)}
            className="shadow-sm"
          />

          {/* Ambient Study Noise Widget */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Volume2 className="h-4 w-4 text-violet-500" />
                Focus Soundscapes
              </h3>
              {ambientSound && (
                <button
                  onClick={() => setAmbientSound(null)}
                  className="text-xs text-rose-500 font-semibold hover:underline flex items-center gap-1"
                >
                  <VolumeX className="h-3.5 w-3.5" />
                  Mute
                </button>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { name: 'Rain & Thunder', key: 'rain' },
                { name: 'Lo-Fi Study Beats', key: 'lofi' },
                { name: 'Library White Noise', key: 'library' },
                { name: 'Binaural Alpha Waves', key: 'alpha' },
              ].map((sound) => (
                <button
                  key={sound.key}
                  onClick={() => toggleSound(sound.name)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                    ambientSound === sound.name
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {sound.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Pod Participants & Session History (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Active Members Focus Board */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-600" />
                Pod Focus Board
              </h3>
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                In Focus
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {currentPod?.members?.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar username={member.username} size="sm" online={true} />
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {member.username}
                        {member.user_id === user?.id && ' (You)'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {member.role === 'leader' ? 'Pod Leader' : 'Pod Peer'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                      <Flame className="h-3 w-3 text-teal-600" />
                      98% Focus
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pod Focus Stats */}
          <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/50 to-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-violet-900 flex items-center gap-2">
              <Award className="h-4 w-4 text-violet-600" />
              Pod Sprints Completed
            </h3>

            <div className="mt-3 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl border border-violet-100 bg-white p-3">
                <div className="text-2xl font-black text-violet-700">18</div>
                <div className="text-[11px] text-slate-500">Group Sprints</div>
              </div>
              <div className="rounded-xl border border-violet-100 bg-white p-3">
                <div className="text-2xl font-black text-teal-600">7.5 hrs</div>
                <div className="text-[11px] text-slate-500">Pod Focus Time</div>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-violet-100/60 p-3 text-xs text-violet-900 leading-relaxed">
              <span className="font-bold">Tip from StudyBot:</span> 25-minute sprints followed by
              5-minute eye rests significantly improve retention of complex formulas.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroPage;
