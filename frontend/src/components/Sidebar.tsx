import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  Plus,
  MessageSquare,
  CheckSquare,
  Clock,
  Sparkles,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { usePodStore } from '../store/podStore';
import Avatar from './Avatar';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenFindPod?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = true,
  onClose,
  onOpenFindPod,
}) => {
  const { pods, activePod, setActivePod } = usePodStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSelectPod = (pod: (typeof pods)[0]) => {
    setActivePod(pod);
    navigate(`/pod/${pod.id}`);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-slate-200 bg-white pt-16 transition-transform duration-300 md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col justify-between p-4">
          <div className="space-y-4 overflow-y-auto">
            {/* Header / Title */}
            <div className="flex items-center justify-between px-2 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Users className="h-4 w-4 text-violet-500" />
                <span>My Study Pods</span>
              </div>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                {pods.length}
              </span>
            </div>

            {/* Pods list */}
            {pods.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center bg-slate-50/50">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800">No Pods Joined</h4>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Join a pod with peers studying the same target exam!
                </p>
                <button
                  onClick={onOpenFindPod}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Find a Pod
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {pods.map((pod) => {
                  const isActive = activePod?.id === pod.id;
                  return (
                    <div
                      key={pod.id}
                      onClick={() => handleSelectPod(pod)}
                      className={`group relative cursor-pointer rounded-xl border p-3.5 transition-all duration-200 ${
                        isActive
                          ? 'border-violet-500 bg-violet-50/70 shadow-xs ring-1 ring-violet-500/30'
                          : 'border-slate-200 bg-white hover:border-violet-300 hover:bg-slate-50/80 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-2">
                          <h4
                            className={`truncate text-sm font-semibold ${
                              isActive ? 'text-violet-900' : 'text-slate-800 group-hover:text-violet-700'
                            }`}
                          >
                            {pod.name}
                          </h4>
                          <span className="mt-1 inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {pod.exam_category}
                          </span>
                        </div>
                        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" title="Active pod" />
                      </div>

                      {/* Member Avatars preview */}
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {pod.members?.slice(0, 4).map((member, i) => (
                            <Avatar
                              key={member.user_id || i}
                              username={member.username}
                              size="sm"
                              className="ring-2 ring-white"
                            />
                          ))}
                        </div>
                        <div className="flex items-center text-xs text-slate-500">
                          <Users className="mr-1 h-3.5 w-3.5 text-slate-400" />
                          <span>{pod.members?.length || 0}/4</span>
                          <ChevronRight className="ml-1 h-3.5 w-3.5 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition" />
                        </div>
                      </div>

                      {/* Active pod quick navigation shortcuts */}
                      {isActive && (
                        <div className="mt-2.5 pt-2 border-t border-violet-100 flex items-center justify-between text-xs text-violet-700 font-medium">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/pod/${pod.id}`);
                              if (onClose) onClose();
                            }}
                            className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-violet-200/50 ${
                              location.pathname === `/pod/${pod.id}` ? 'font-bold underline' : ''
                            }`}
                          >
                            <MessageSquare className="h-3 w-3" />
                            Chat
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/pod/${pod.id}/milestones`);
                              if (onClose) onClose();
                            }}
                            className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-violet-200/50 ${
                              location.pathname.includes('/milestones') ? 'font-bold underline' : ''
                            }`}
                          >
                            <CheckSquare className="h-3 w-3" />
                            Goals
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/pod/${pod.id}/pomodoro`);
                              if (onClose) onClose();
                            }}
                            className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-violet-200/50 ${
                              location.pathname.includes('/pomodoro') ? 'font-bold underline' : ''
                            }`}
                          >
                            <Clock className="h-3 w-3" />
                            Timer
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="border-t border-slate-200 pt-3">
            <button
              onClick={onOpenFindPod}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 hover:shadow-xs active:scale-[0.99]"
            >
              <Plus className="h-4 w-4" />
              <span>Find a Pod</span>
            </button>

            <div className="mt-3 flex items-center justify-between px-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-emerald-500" />
                StudyPod Guard
              </span>
              <span>v1.0.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
