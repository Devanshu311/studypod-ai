export interface User {
  id: string;
  email: string;
  username: string;
  university?: string;
  target_exam: string;
  subjects: string[];
  study_hours_goal: number;
  is_premium: boolean;
  created_at: string;
}

export interface Pod {
  id: string;
  name: string;
  exam_category: string;
  members: PodMember[];
  created_at: string;
  is_active: boolean;
}

export interface PodMember {
  user_id: string;
  username: string;
  role: 'member' | 'leader';
  joined_at: string;
}

export interface Milestone {
  id: string;
  pod_id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  created_by: 'user' | 'ai';
  created_at: string;
}

export interface PomodoroSession {
  id: string;
  pod_id: string;
  initiated_by: string;
  started_at: string;
  duration_minutes: number;
  break_minutes: number;
  status: 'active' | 'completed' | 'cancelled';
  participants: PomodoroParticipant[];
}

export interface PomodoroParticipant {
  id: string;
  user_id: string;
  username?: string;
  joined_at: string;
  completed: boolean;
  focus_score: number;
}

export interface ChatMessage {
  id: string;
  pod_id: string;
  user_id: string | null;
  username?: string;
  content: string;
  message_type: 'text' | 'system' | 'ai_coach' | 'milestone_update' | 'pomodoro_invite';
  created_at: string;
}

export interface QueueStatus {
  position: number;
  exam_category: string;
  estimated_wait: string;
}

export interface StudyStats {
  total_hours: number;
  current_streak: number;
  milestones_completed: number;
  pods_active: number;
}

// API DTOs
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  target_exam: string;
  subjects?: string[];
  university?: string;
  study_hours_goal?: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type?: string;
}

export interface MilestoneCreateData {
  title: string;
  description?: string;
  due_date: string;
  pod_id: string;
}

export interface PomodoroStartData {
  pod_id: string;
  duration_minutes?: number;
  break_minutes?: number;
}

export interface PeerStudent {
  id: string;
  username: string;
  university: string;
  target_exam: string;
  subjects: string[];
  study_streak: number;
  minutes_studied: number;
  current_pod?: string;
  pod_id?: string;
}

