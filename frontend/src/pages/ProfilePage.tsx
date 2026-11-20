import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  User as UserIcon,
  Mail,
  School,
  BookOpen,
  Clock,
  Flame,
  Award,
  CheckCircle2,
  Users,
  Sparkles,
  ShieldAlert,
  Save,
  Plus,
  X,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePodStore } from '../store/podStore';
import Avatar from '../components/Avatar';

const EXAM_OPTIONS = [
  'JEE 2027',
  'GATE CS',
  'UPSC CSE',
  'CAT 2027',
  'University Semester',
  'Other',
];

export const ProfilePage: React.FC = () => {
  const { user, setUser, logout } = useAuthStore();
  const { pods } = usePodStore();

  const [exam, setExam] = useState(user?.target_exam || 'JEE 2027');
  const [university, setUniversity] = useState(user?.university || '');
  const [goalMinutes, setGoalMinutes] = useState(user?.study_hours_goal || 120);

  // Subject tags
  const [subjects, setSubjects] = useState<string[]>(
    user?.subjects && user.subjects.length > 0
      ? user.subjects
      : ['Calculus', 'Physics', 'Data Structures']
  );
  const [newSubjectInput, setNewSubjectInput] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Danger zone
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleAddSubject = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    const trimmed = newSubjectInput.trim();
    if (trimmed && !subjects.includes(trimmed)) {
      setSubjects([...subjects, trimmed]);
      setNewSubjectInput('');
    }
  };

  const handleRemoveSubject = (sub: string) => {
    setSubjects(subjects.filter((s) => s !== sub));
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const updatedUser = {
      ...user,
      target_exam: exam,
      university: university.trim() || undefined,
      study_hours_goal: goalMinutes,
      subjects,
    };

    setUser(updatedUser);
    toast.success('Study preferences saved successfully!');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Please enter current and new passwords.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    setIsChangingPass(true);
    setTimeout(() => {
      setIsChangingPass(false);
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Password updated successfully!');
    }, 800);
  };

  const handleDeleteAccount = () => {
    toast.error('Account deleted.');
    logout();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Profile & Settings</h1>
        <p className="mt-1 text-xs text-slate-500">
          Manage your personal information, exam preferences, and study habits.
        </p>
      </div>

      {/* User Info Overview Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar username={user?.username || 'User'} size="xl" online={true} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{user?.username}</h2>
                {user?.is_premium ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                    PRO
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    Free Tier
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                <Mail className="h-3.5 w-3.5" />
                {user?.email}
              </p>
              {university && (
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <School className="h-3.5 w-3.5" />
                  {university}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!user?.is_premium && (
              <button
                onClick={() => toast.success('Pro upgrade modal opening!')}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-500/20 hover:from-violet-700 hover:to-purple-700 transition"
              >
                Upgrade to Pro ($4.99/mo)
              </button>
            )}
          </div>
        </div>

        {/* Study Stats Grid */}
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Hours
            </div>
            <div className="mt-1 text-2xl font-black text-slate-900">42.5 hrs</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Focus time tracked</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Longest Streak
            </div>
            <div className="mt-1 text-2xl font-black text-amber-500 flex items-center justify-center gap-1">
              <Flame className="h-5 w-5 fill-amber-500" />
              14 days
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Personal best</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Milestones
            </div>
            <div className="mt-1 text-2xl font-black text-teal-600">28 Done</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Completed sprints</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pods Joined
            </div>
            <div className="mt-1 text-2xl font-black text-violet-600">
              {pods.length || 1}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Micro study groups</p>
          </div>
        </div>
      </div>

      {/* Study Preferences Form */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-violet-600" />
          Study Preferences & Exam Setup
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          We use this to recommend optimal study pods and generate customized AI milestones.
        </p>

        <form onSubmit={handleSavePreferences} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Target Exam
              </label>
              <select
                value={exam}
                onChange={(e) => setExam(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-violet-500 focus:outline-none"
              >
                {EXAM_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                University / Institution
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="e.g. UC Berkeley, IIT Bombay"
                className="mt-1.5 block w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Daily Study Goal Slider */}
          <div>
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-violet-500" />
                Daily Study Target (Minutes)
              </label>
              <span className="font-bold text-violet-700">
                {Math.floor(goalMinutes / 60)}h {goalMinutes % 60 > 0 ? `${goalMinutes % 60}m` : ''} ({goalMinutes} min)
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="300"
              step="15"
              value={goalMinutes}
              onChange={(e) => setGoalMinutes(Number(e.target.value))}
              className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-violet-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>30m</span>
              <span>2 hours</span>
              <span>5 hours</span>
            </div>
          </div>

          {/* Subjects Tag Management */}
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Focus Subjects & Topics
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="text"
                value={newSubjectInput}
                onChange={(e) => setNewSubjectInput(e.target.value)}
                onKeyDown={handleAddSubject}
                placeholder="Type subject and press Enter..."
                className="flex-1 rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:border-violet-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddSubject()}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Add Tag
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {subjects.map((sub) => (
                <span
                  key={sub}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 border border-violet-200 px-2.5 py-1 text-xs font-semibold text-violet-800"
                >
                  {sub}
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(sub)}
                    className="text-violet-400 hover:text-violet-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-violet-700 transition"
            >
              <Save className="h-3.5 w-3.5" />
              Save Preferences
            </button>
          </div>
        </form>
      </div>

      {/* Account Security (Change Password) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Lock className="h-5 w-5 text-slate-700" />
          Change Password
        </h3>

        <form onSubmit={handleChangePassword} className="mt-5 space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 block w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="mt-1 block w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isChangingPass}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition"
          >
            {isChangingPass ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="rounded-3xl border border-rose-200 bg-rose-50/40 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-base font-bold text-rose-900 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-600" />
              Danger Zone
            </h3>
            <p className="mt-1 text-xs text-rose-700/80">
              Permanently remove your account, leave active pods, and delete all streak history.
            </p>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="rounded-xl border border-rose-300 bg-white px-4 py-2 text-xs font-bold text-rose-600 shadow-2xs hover:bg-rose-50 transition"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
            <h3 className="text-base font-bold text-slate-900">Are you sure?</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              This action cannot be undone. All your pod memberships, milestones, and focus streaks
              will be permanently removed.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
