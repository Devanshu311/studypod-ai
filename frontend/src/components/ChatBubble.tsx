import React from 'react';
import {
  Sparkles,
  Timer,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { ChatMessage } from '../types';
import Avatar from './Avatar';

export interface ChatBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  onJoinPomodoro?: (sessionId: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isOwnMessage,
  onJoinPomodoro,
}) => {
  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // 1. System messages: centered, muted, small text
  if (message.message_type === 'system') {
    return (
      <div className="my-2.5 flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500 font-medium border border-slate-200/60 shadow-2xs">
          <span>{message.content}</span>
          <span className="text-[10px] text-slate-400">
            {formatTimestamp(message.created_at)}
          </span>
        </span>
      </div>
    );
  }

  // 2. AI Coach bot messages: left-aligned, purple/indigo gradient with sparkle icon, labeled "StudyBot 🤖"
  if (message.message_type === 'ai_coach') {
    return (
      <div className="my-3 flex items-start gap-2.5 max-w-xl">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-sm ring-2 ring-violet-200">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-violet-900 bg-violet-100 px-2 py-0.5 rounded-md flex items-center gap-1">
              <span>StudyBot</span>
              <span className="text-sm">🤖</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {formatTimestamp(message.created_at)}
            </span>
          </div>
          <div className="rounded-2xl rounded-tl-xs border border-violet-200/80 bg-gradient-to-br from-violet-50/90 to-indigo-50/60 p-4 text-sm text-slate-800 shadow-xs">
            <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Pomodoro Invite card message
  if (message.message_type === 'pomodoro_invite') {
    return (
      <div className={`my-3 flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-sm rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-teal-800 font-semibold text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 text-white shadow-xs">
              <Timer className="h-4 w-4" />
            </div>
            <div>
              <h4>Pomodoro Focus Sprint</h4>
              <p className="text-[11px] font-normal text-teal-600">
                Shared by {message.username || 'Pod member'}
              </p>
            </div>
          </div>

          <p className="mt-2.5 text-xs text-slate-700 leading-normal">
            {message.content}
          </p>

          <div className="mt-3.5 flex items-center justify-between border-t border-teal-200/60 pt-2.5">
            <span className="text-[11px] text-slate-500">
              {formatTimestamp(message.created_at)}
            </span>
            <button
              onClick={() => onJoinPomodoro && onJoinPomodoro(message.id)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-700 transition active:scale-95"
            >
              <span>Join Session</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Milestone update message
  if (message.message_type === 'milestone_update') {
    return (
      <div className="my-2.5 flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/90 px-3.5 py-1.5 text-xs text-amber-900 shadow-2xs">
          <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{message.content}</span>
          <span className="text-[10px] text-amber-700/70">
            {formatTimestamp(message.created_at)}
          </span>
        </div>
      </div>
    );
  }

  // 5. Normal text message (Own vs Others)
  return (
    <div
      className={`my-2 flex items-end gap-2 ${
        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {!isOwnMessage && (
        <Avatar username={message.username || 'Student'} size="sm" />
      )}

      <div
        className={`max-w-[78%] sm:max-w-md rounded-2xl px-4 py-2.5 shadow-2xs transition-all ${
          isOwnMessage
            ? 'rounded-br-xs bg-violet-600 text-white'
            : 'rounded-bl-xs border border-slate-200 bg-white text-slate-800'
        }`}
      >
        {!isOwnMessage && message.username && (
          <div className="mb-0.5 text-[11px] font-bold text-violet-700">
            {message.username}
          </div>
        )}

        <div className="break-words text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>

        <div
          className={`mt-1 flex items-center justify-end text-[10px] ${
            isOwnMessage ? 'text-violet-200' : 'text-slate-400'
          }`}
        >
          <Clock className="mr-0.5 h-2.5 w-2.5" />
          <span>{formatTimestamp(message.created_at)}</span>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
