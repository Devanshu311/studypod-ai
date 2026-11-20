import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  BookOpen,
  School,
  Clock,
  Sparkles,
  ArrowRight,
  X,
  Plus,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const TARGET_EXAMS = [
  'JEE 2027',
  'GATE CS',
  'UPSC CSE',
  'CAT 2027',
  'University Semester',
  'Other',
];

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regTargetExam, setRegTargetExam] = useState(TARGET_EXAMS[0]);
  const [regUniversity, setRegUniversity] = useState('');
  const [regStudyGoal, setRegStudyGoal] = useState<number>(120);

  // Subjects tag list
  const [subjects, setSubjects] = useState<string[]>(['Calculus', 'Physics']);
  const [subjectInput, setSubjectInput] = useState('');

  // Sync tab with query parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'register') {
      setActiveTab('register');
    } else if (tab === 'login') {
      setActiveTab('login');
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleAddSubject = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    const trimmed = subjectInput.trim();
    if (trimmed && !subjects.includes(trimmed)) {
      setSubjects([...subjects, trimmed]);
      setSubjectInput('');
    }
  };

  const handleRemoveSubject = (subToRemove: string) => {
    setSubjects(subjects.filter((s) => s !== subToRemove));
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Please enter your email and password');
      return;
    }

    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword);
      toast.success('Welcome back to StudyPod!');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid email or password. Please try again.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regUsername || !regPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (regPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        email: regEmail,
        username: regUsername,
        password: regPassword,
        target_exam: regTargetExam,
        subjects,
        university: regUniversity.trim() || undefined,
        study_hours_goal: regStudyGoal,
      });

      toast.success('Account created! Welcome to StudyPod AI.');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Registration failed. Please check your details.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 px-4 py-12 sm:px-6 lg:px-8 selection:bg-teal-300 selection:text-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 transition hover:opacity-90"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-500 to-teal-400 text-white shadow-lg">
            <GraduationCap className="h-7 w-7" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            StudyPod <span className="text-teal-400">AI</span>
          </span>
        </Link>
        <h2 className="mt-4 text-xl font-bold tracking-tight text-white sm:text-2xl">
          {activeTab === 'login' ? 'Sign in to your Study Pod' : 'Create your StudyPod Account'}
        </h2>
        <p className="mt-1 text-xs text-violet-200">
          Peer accountability & AI coaching for ambitious learners
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/5 sm:p-8">
          {/* Tab Switcher */}
          <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 rounded-lg py-2 text-center text-sm font-semibold transition ${
                activeTab === 'login'
                  ? 'bg-white text-violet-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`flex-1 rounded-lg py-2 text-center text-sm font-semibold transition ${
                activeTab === 'register'
                  ? 'bg-white text-violet-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register
            </button>
          </div>

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Email Address
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="block w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <a href="#forgot" className="text-xs font-medium text-violet-600 hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white shadow-md shadow-violet-500/20 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:opacity-50 transition"
                >
                  {isLoading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Email Address *
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="block w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Username *
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. aryan_study"
                    className="block w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Password *
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="block w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              {/* Target Exam dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Target Exam *
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <select
                    value={regTargetExam}
                    onChange={(e) => setRegTargetExam(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  >
                    {TARGET_EXAMS.map((exam) => (
                      <option key={exam} value={exam}>
                        {exam}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subjects Pills */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Subjects & Focus Topics
                </label>
                <div className="mt-1 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    onKeyDown={handleAddSubject}
                    placeholder="Add subject (press Enter)"
                    className="block w-full rounded-xl border border-slate-300 py-1.5 px-3 text-xs text-slate-900 focus:border-violet-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSubject()}
                    className="rounded-xl border border-slate-300 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {subjects.map((sub) => (
                    <span
                      key={sub}
                      className="inline-flex items-center gap-1 rounded-lg bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800"
                    >
                      {sub}
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(sub)}
                        className="text-violet-500 hover:text-violet-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* University (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  University / College <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <School className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={regUniversity}
                    onChange={(e) => setRegUniversity(e.target.value)}
                    placeholder="e.g. Stanford / IIT Delhi"
                    className="block w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Daily study hours goal slider */}
              <div>
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-700 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    Daily Study Goal
                  </label>
                  <span className="font-bold text-violet-700">
                    {Math.floor(regStudyGoal / 60)}h {regStudyGoal % 60 > 0 ? `${regStudyGoal % 60}m` : ''} ({regStudyGoal} mins)
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="300"
                  step="15"
                  value={regStudyGoal}
                  onChange={(e) => setRegStudyGoal(Number(e.target.value))}
                  className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-violet-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>30 min</span>
                  <span>2 hours</span>
                  <span>5 hours</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white shadow-md shadow-violet-500/20 hover:bg-violet-700 focus:outline-none disabled:opacity-50 transition"
                >
                  {isLoading ? (
                    <span>Creating account...</span>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Complete Registration</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Switch tab helper text */}
          <div className="mt-6 text-center text-xs text-slate-500">
            {activeTab === 'login' ? (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="font-bold text-violet-600 hover:underline"
                >
                  Create free account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="font-bold text-violet-600 hover:underline"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
