import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Play,
  Pause,
  RotateCcw,
  Users,
  CheckCircle2,
  Sparkles,
  Flame,
} from 'lucide-react';
import { PomodoroSession } from '../types';
import { pomodoroAPI } from '../services/api';
import {
  startPomodoro,
  joinPomodoro,
  onPomodoroStarted,
  onPomodoroTick,
  onPomodoroCompleted,
} from '../services/socket';
import Avatar from './Avatar';
import { useAuthStore } from '../store/authStore';

export interface PomodoroTimerProps {
  podId?: string;
  session?: PomodoroSession | null;
  onSessionUpdate?: (session: PomodoroSession) => void;
  className?: string;
}

type TimerMode = 'idle' | 'focus' | 'break';

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  podId,
  session: initialSession,
  onSessionUpdate,
  className = '',
}) => {
  const { user } = useAuthStore();
  const [currentSession, setCurrentSession] = useState<PomodoroSession | null>(
    initialSession || null
  );

  // Focus duration presets (in minutes)
  const [presetDuration, setPresetDuration] = useState<number>(25);
  const [breakDuration, setBreakDuration] = useState<number>(5);

  const [mode, setMode] = useState<TimerMode>('idle');
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [totalSeconds, setTotalSeconds] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompletedPulse, setIsCompletedPulse] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync initialSession prop
  useEffect(() => {
    if (initialSession) {
      setCurrentSession(initialSession);
      const totalSec = initialSession.duration_minutes * 60;
      setTotalSeconds(totalSec);
      setSecondsLeft(totalSec);
      setMode('focus');
      setIsRunning(initialSession.status === 'active');
    }
  }, [initialSession]);

  // Listen to socket events for group sessions
  useEffect(() => {
    const unsubStarted = onPomodoroStarted((newSession) => {
      if (!podId || newSession.pod_id === podId) {
        setCurrentSession(newSession);
        const total = newSession.duration_minutes * 60;
        setTotalSeconds(total);
        setSecondsLeft(total);
        setMode('focus');
        setIsRunning(true);
        if (onSessionUpdate) onSessionUpdate(newSession);
        toast.success(`Group Pomodoro started by ${newSession.initiated_by || 'pod member'}!`);
      }
    });

    const unsubTick = onPomodoroTick((data) => {
      if (currentSession && data.session_id === currentSession.id) {
        setSecondsLeft(data.remaining_seconds);
      }
    });

    const unsubCompleted = onPomodoroCompleted((completedSession) => {
      if (!podId || completedSession.pod_id === podId) {
        setIsRunning(false);
        setMode('break');
        setSecondsLeft(completedSession.break_minutes * 60);
        setTotalSeconds(completedSession.break_minutes * 60);
        triggerCompletion();
      }
    });

    return () => {
      unsubStarted();
      unsubTick();
      unsubCompleted();
    };
  }, [podId, currentSession, onSessionUpdate]);

  // Local interval countdown timer
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleTimerFinished();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  const triggerCompletion = () => {
    setIsCompletedPulse(true);
    setTimeout(() => setIsCompletedPulse(false), 3000);
    toast.success('🎉 Pomodoro Session Completed! Great focus session.', {
      duration: 5000,
      icon: '🔥',
    });
  };

  const handleTimerFinished = async () => {
    setIsRunning(false);
    triggerCompletion();

    if (currentSession) {
      try {
        const completed = await pomodoroAPI.complete(currentSession.id);
        setCurrentSession(completed);
        if (onSessionUpdate) onSessionUpdate(completed);
      } catch (e) {
        console.error('Failed to mark session as complete:', e);
      }
    }

    if (mode === 'focus') {
      setMode('break');
      const bSec = breakDuration * 60;
      setSecondsLeft(bSec);
      setTotalSeconds(bSec);
    } else {
      setMode('idle');
      const fSec = presetDuration * 60;
      setSecondsLeft(fSec);
      setTotalSeconds(fSec);
    }
  };

  const handleStartSolo = (mins: number) => {
    setPresetDuration(mins);
    const secs = mins * 60;
    setTotalSeconds(secs);
    setSecondsLeft(secs);
    setMode('focus');
    setIsRunning(true);
    toast('Focus mode activated. Mute distractions!', { icon: '🎯' });
  };

  const handleTogglePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setMode('idle');
    setSecondsLeft(presetDuration * 60);
    setTotalSeconds(presetDuration * 60);
  };

  const handleStartGroupSession = async () => {
    if (!podId) {
      toast.error('Select an active pod to start a group session.');
      return;
    }

    try {
      const sessionData = await pomodoroAPI.start({
        pod_id: podId,
        duration_minutes: presetDuration,
        break_minutes: breakDuration,
      });

      startPomodoro(podId, presetDuration, breakDuration);
      setCurrentSession(sessionData);
      setTotalSeconds(presetDuration * 60);
      setSecondsLeft(presetDuration * 60);
      setMode('focus');
      setIsRunning(true);
      if (onSessionUpdate) onSessionUpdate(sessionData);
      toast.success('Group session broadcasted to your pod!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Could not start group session.');
    }
  };

  const handleJoinSession = async () => {
    if (!currentSession) return;
    try {
      const updated = await pomodoroAPI.join(currentSession.id);
      joinPomodoro(currentSession.id);
      setCurrentSession(updated);
      setIsRunning(true);
      toast.success('Joined pod focus session!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Could not join session.');
    }
  };

  // Format time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // SVG circular progress calculation
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const isBreak = mode === 'break';
  const primaryColor = isBreak ? '#F59E0B' : '#14B8A6'; // Amber for break, Teal for focus
  const primaryBgClass = isBreak ? 'text-amber-500' : 'text-teal-500';

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all ${
        isCompletedPulse ? 'ring-4 ring-teal-400 ring-offset-2 animate-pulse' : ''
      } ${className}`}
    >
      {/* Session Header Status */}
      <div className="mb-4 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
            isBreak
              ? 'bg-amber-100 text-amber-800'
              : mode === 'focus'
              ? 'bg-teal-100 text-teal-800'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {isBreak ? (
            <>
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              Break Time
            </>
          ) : mode === 'focus' ? (
            <>
              <Flame className="h-3.5 w-3.5 text-teal-600" />
              Focus Sprint
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
              Ready to Study
            </>
          )}
        </span>

        {currentSession && (
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
            Pod Session
          </span>
        )}
      </div>

      {/* Circular SVG Timer */}
      <div className="relative my-2 flex items-center justify-center">
        <svg className="h-64 w-64 -rotate-90 transform" viewBox="0 0 240 240">
          {/* Background track circle */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            stroke="#f1f5f9"
            strokeWidth="12"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            stroke={primaryColor}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* Center Countdown Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {formatTime(secondsLeft)}
          </span>
          <span className={`mt-1 text-xs font-medium capitalize ${primaryBgClass}`}>
            {mode === 'idle' ? 'Ready' : mode}
          </span>
          {mode !== 'idle' && (
            <span className="text-[11px] text-slate-400">
              {Math.ceil(secondsLeft / 60)} min left
            </span>
          )}
        </div>
      </div>

      {/* Preset Buttons (when idle) */}
      {mode === 'idle' && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => handleStartSolo(25)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-500 hover:bg-teal-50 hover:text-teal-700 transition"
          >
            25m Focus
          </button>
          <button
            onClick={() => handleStartSolo(50)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-500 hover:bg-teal-50 hover:text-teal-700 transition"
          >
            50m Deep Work
          </button>
          <button
            onClick={() => {
              setBreakDuration(breakDuration === 5 ? 10 : 5);
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 transition"
          >
            Break: {breakDuration}m
          </button>
        </div>
      )}

      {/* Action Controls */}
      <div className="mt-5 flex items-center gap-3">
        {mode !== 'idle' ? (
          <>
            <button
              onClick={handleTogglePlayPause}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-95 ${
                isBreak
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-teal-500 hover:bg-teal-600'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-white" /> Resume
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition active:scale-95"
              title="Reset Timer"
            >
              <RotateCcw className="h-4 w-4 text-slate-500" />
              Reset
            </button>
          </>
        ) : (
          <button
            onClick={() => handleStartSolo(presetDuration)}
            className="flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-600 transition active:scale-95"
          >
            <Play className="h-4 w-4 fill-white" />
            Start Timer
          </button>
        )}
      </div>

      {/* Group Session CTA if inside a pod */}
      {podId && (
        <div className="mt-5 w-full border-t border-slate-100 pt-4 text-center">
          {currentSession && currentSession.status === 'active' ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-600">
                A group session is currently active in this pod!
              </p>
              {!currentSession.participants?.some((p) => p.user_id === user?.id) && (
                <button
                  onClick={handleJoinSession}
                  className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-violet-700 transition"
                >
                  Join Pod Session
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleStartGroupSession}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition shadow-xs"
            >
              <Users className="h-3.5 w-3.5" />
              Start Group Session with Pod
            </button>
          )}

          {/* Participant avatars */}
          {currentSession?.participants && currentSession.participants.length > 0 && (
            <div className="mt-3">
              <span className="text-[11px] font-medium text-slate-400">
                Focusing together:
              </span>
              <div className="mt-1 flex items-center justify-center -space-x-1.5">
                {currentSession.participants.map((p, idx) => (
                  <Avatar
                    key={p.user_id || idx}
                    username={p.username || 'Student'}
                    size="sm"
                    className="ring-2 ring-white"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;
