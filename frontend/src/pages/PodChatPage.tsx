import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Send,
  Timer,
  Smile,
  Users,
  Settings,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  Share2,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePodStore } from '../store/podStore';
import { useChatStore } from '../store/chatStore';
import { chatAPI, podAPI, milestoneAPI, pomodoroAPI } from '../services/api';
import {
  joinPodRoom,
  leavePodRoom,
  sendMessage as sendSocketMessage,
  sendTyping as sendSocketTyping,
  onMessage,
  onTyping,
  startPomodoro as startSocketPomodoro,
} from '../services/socket';
import { Pod, Milestone, PomodoroSession } from '../types';
import ChatBubble from '../components/ChatBubble';
import Avatar from '../components/Avatar';
import PomodoroTimer from '../components/PomodoroTimer';

export const PodChatPage: React.FC = () => {
  const { podId } = useParams<{ podId: string }>();
  const { user } = useAuthStore();
  const { activePod, setActivePod, pods } = usePodStore();
  const {
    messages,
    addMessage,
    setMessages,
    typingUsers,
    addTypingUser,
    removeTypingUser,
    isLoading: chatLoading,
    setLoading: setChatLoading,
  } = useChatStore();

  const [inputText, setInputText] = useState('');
  const [currentPod, setCurrentPod] = useState<Pod | null>(activePod);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [activeSession, setActiveSession] = useState<PomodoroSession | null>(null);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  // Load pod data, messages, milestones, and active session
  useEffect(() => {
    if (!podId) return;

    // Join socket room
    joinPodRoom(podId);

    // Fetch Pod metadata if not matched
    const loadPodDetails = async () => {
      try {
        const pod = await podAPI.getPod(podId);
        setCurrentPod(pod);
        setActivePod(pod);
      } catch {
        // Fallback to local store
        const found = pods.find((p) => p.id === podId);
        if (found) setCurrentPod(found);
      }
    };

    // Load Chat History
    const loadChatHistory = async () => {
      setChatLoading(true);
      try {
        const history = await chatAPI.getHistory(podId, 50);
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          // Initialize with friendly welcome system message
          setMessages([
            {
              id: `welcome-${podId}`,
              pod_id: podId,
              user_id: null,
              content: 'Welcome to your Study Pod! Introduce yourself and set your goals.',
              message_type: 'system',
              created_at: new Date().toISOString(),
            },
            {
              id: `ai-intro-${podId}`,
              pod_id: podId,
              user_id: null,
              username: 'StudyBot',
              content: `Hey everyone! I'm your AI Study Coach 🤖. I'll help your pod stay accountable, track milestones, and keep your focus sprints disciplined. Let me know what you're working on today!`,
              message_type: 'ai_coach',
              created_at: new Date(Date.now() + 1000).toISOString(),
            },
          ]);
        }
      } catch {
        // Fallback demo conversation
        setMessages([
          {
            id: `welcome-${podId}`,
            pod_id: podId,
            user_id: null,
            content: 'Welcome to your Study Pod! Introduce yourself and set your goals.',
            message_type: 'system',
            created_at: new Date().toISOString(),
          },
        ]);
      } finally {
        setChatLoading(false);
      }
    };

    // Load pod milestones
    const loadMilestones = async () => {
      try {
        const data = await milestoneAPI.getByPod(podId);
        setMilestones(data);
      } catch {
        setMilestones([]);
      }
    };

    // Load active Pomodoro
    const loadPomodoro = async () => {
      try {
        const session = await pomodoroAPI.getActive(podId);
        setActiveSession(session);
      } catch {
        setActiveSession(null);
      }
    };

    loadPodDetails();
    loadChatHistory();
    loadMilestones();
    loadPomodoro();

    // Socket Event Subscriptions
    const unsubMessage = onMessage((msg) => {
      if (msg.pod_id === podId) {
        addMessage(msg);
      }
    });

    const unsubTyping = onTyping((data) => {
      if (data.username && data.username !== user?.username) {
        addTypingUser(data.username);
        setTimeout(() => removeTypingUser(data.username), 3000);
      }
    });

    return () => {
      unsubMessage();
      unsubTyping();
      leavePodRoom(podId);
    };
  }, [podId]);

  // Handle typing indicator dispatch
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!podId) return;

    if (!typingTimeoutRef.current) {
      sendSocketTyping(podId);
      typingTimeoutRef.current = setTimeout(() => {
        typingTimeoutRef.current = null;
      }, 2000);
    }
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !podId) return;

    const content = inputText.trim();
    setInputText('');

    // Emit via socket
    sendSocketMessage(podId, content);

    // Optimistically add to chat store
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      pod_id: podId,
      user_id: user?.id || null,
      username: user?.username || 'Me',
      content,
      message_type: 'text' as const,
      created_at: new Date().toISOString(),
    };
    addMessage(optimisticMsg);

    try {
      await chatAPI.sendMessage(podId, content);
    } catch {
      // Socket will broadcast if connected
    }
  };

  // Quick invite to Pomodoro
  const handleInvitePomodoro = () => {
    if (!podId) return;
    const inviteContent = `${user?.username || 'Someone'} has initiated a 25-minute Pomodoro focus sprint!`;
    const msg = {
      id: `pomo-invite-${Date.now()}`,
      pod_id: podId,
      user_id: user?.id || null,
      username: user?.username || 'Me',
      content: inviteContent,
      message_type: 'pomodoro_invite' as const,
      created_at: new Date().toISOString(),
    };
    addMessage(msg);
    sendSocketMessage(podId, inviteContent);
    startSocketPomodoro(podId, 25, 5);
    toast.success('Pomodoro sprint invitation sent to Pod!');
  };

  const handleQuickReaction = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-100">
      {/* Center Chat Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden bg-slate-50">
        {/* Chat Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-2xs">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {currentPod ? currentPod.name : 'Study Pod'}
                </h2>
                <span className="rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                  {currentPod?.exam_category || 'Exam Pod'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {currentPod?.members?.length || 1} members active
                </span>
                <span>•</span>
                <Link
                  to={`/pod/${podId}/milestones`}
                  className="font-medium text-violet-600 hover:underline"
                >
                  View Goals
                </Link>
                <span>•</span>
                <Link
                  to={`/pod/${podId}/pomodoro`}
                  className="font-medium text-teal-600 hover:underline"
                >
                  Pomodoro Timer
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Member Avatars in Header */}
            <div className="hidden sm:flex -space-x-1.5 mr-2">
              {currentPod?.members?.map((m) => (
                <Avatar
                  key={m.user_id}
                  username={m.username}
                  size="sm"
                  online={true}
                  className="ring-2 ring-white"
                />
              ))}
            </div>

            <button
              onClick={() => {
                if (podId) {
                  navigator.clipboard.writeText(podId);
                  toast.success(`Pod Code copied: ${podId}\nShare it with a classmate to join!`, {
                    duration: 4000,
                  });
                }
              }}
              className="flex items-center gap-1 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition"
              title="Copy Pod Invite Code"
            >
              <Share2 className="h-4 w-4 text-violet-600" />
              <span className="hidden sm:inline">Invite Friend</span>
            </button>

            <button
              onClick={() => setShowRightSidebar(!showRightSidebar)}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              title="Toggle Pod Sidebar"
            >
              <Users className="h-4 w-4 text-violet-600" />
              <span className="hidden md:inline">Pod Info</span>
              {showRightSidebar ? (
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              ) : (
                <ChevronLeft className="h-3.5 w-3.5 text-slate-400" />
              )}
            </button>
          </div>
        </header>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-1">
          {chatLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-600 border-r-transparent" />
                <p className="mt-2 text-xs font-medium text-slate-500">
                  Loading Pod conversation...
                </p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
              <Sparkles className="h-10 w-10 text-violet-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">
                Start the conversation in {currentPod?.name}!
              </p>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Say hello, share your target study topics for today, or start a Pomodoro sprint.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.user_id === user?.id || message.username === user?.username;
              return (
                <ChatBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={isOwn}
                  onJoinPomodoro={() => {
                    toast.success('Joined group focus session!');
                  }}
                />
              );
            })
          )}

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="py-1 text-xs italic text-slate-500 flex items-center gap-1.5">
              <span className="flex space-x-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
              </span>
              <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
          <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
            {/* Quick Emoji / Reaction Picker Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <Smile className="h-5 w-5" />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 z-30 flex gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                  {['👍', '🔥', '📚', '🎯', '💡', '🙌', '🚀'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => handleQuickReaction(em)}
                      className="rounded-lg p-1.5 text-lg hover:bg-slate-100 transition"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Pomodoro Invite Button */}
            <button
              type="button"
              onClick={handleInvitePomodoro}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-100 transition"
              title="Invite pod to 25m Pomodoro sprint"
            >
              <Timer className="h-5 w-5" />
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={`Message ${currentPod?.name || 'pod members'}...`}
              className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white shadow-xs hover:bg-violet-700 disabled:opacity-40 transition active:scale-95"
            >
              <span>Send</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Sidebar: Pod Member List + Mini Pomodoro + Milestones */}
      {showRightSidebar && (
        <aside className="w-80 border-l border-slate-200 bg-white p-4 overflow-y-auto space-y-6">
          {/* Active Members List */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              <span>Pod Members</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                {currentPod?.members?.length || 1}/4
              </span>
            </div>

            <div className="space-y-2">
              {currentPod?.members?.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar username={member.username} size="sm" online={true} />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        {member.username}
                        {member.user_id === user?.id && (
                          <span className="ml-1 text-[10px] text-violet-600">(You)</span>
                        )}
                      </p>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {member.role || 'Member'}
                      </span>
                    </div>
                  </div>
                  {member.role === 'leader' && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 uppercase">
                      Leader
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mini Pomodoro Focus Widget */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              <span className="flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5 text-teal-500" />
                Focus Session
              </span>
              <Link
                to={`/pod/${podId}/pomodoro`}
                className="text-teal-600 text-[11px] font-semibold hover:underline"
              >
                Expand
              </Link>
            </div>

            <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-3.5">
              <div className="text-center">
                <span className="text-2xl font-black text-slate-900">
                  {activeSession ? `${activeSession.duration_minutes}:00` : '25:00'}
                </span>
                <p className="text-[11px] text-teal-700 font-medium mt-0.5">
                  {activeSession ? 'Session in progress' : 'Ready to sprint'}
                </p>
              </div>

              <div className="mt-3 flex gap-2">
                <Link
                  to={`/pod/${podId}/pomodoro`}
                  className="w-full text-center rounded-xl bg-teal-600 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition"
                >
                  Open Timer
                </Link>
              </div>
            </div>
          </div>

          {/* Upcoming Pod Milestones */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-violet-500" />
                Pod Goals
              </span>
              <Link
                to={`/pod/${podId}/milestones`}
                className="text-violet-600 text-[11px] font-semibold hover:underline"
              >
                Board
              </Link>
            </div>

            {milestones.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No milestones set yet.</p>
            ) : (
              <div className="space-y-2">
                {milestones.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-slate-200 bg-white p-2.5 text-xs shadow-2xs"
                  >
                    <p className="font-semibold text-slate-800 line-clamp-1">{m.title}</p>
                    <span className="mt-1 inline-block text-[10px] text-slate-400">
                      Due {new Date(m.due_date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
};

export default PodChatPage;
