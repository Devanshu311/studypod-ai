import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Plus,
  Compass,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePodStore } from '../store/podStore';
import Avatar from './Avatar';

interface NavbarProps {
  onOpenFindPod?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenFindPod }) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { pods, activePod, setActivePod } = usePodStore();
  const [podDropdownOpen, setPodDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const podMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (podMenuRef.current && !podMenuRef.current.contains(event.target as Node)) {
        setPodDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPod = (podId: string) => {
    const selected = pods.find((p) => p.id === podId);
    if (selected) {
      setActivePod(selected);
      navigate(`/pod/${podId}`);
    }
    setPodDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-violet-600 to-purple-700 text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="flex items-center gap-2.5 transition hover:opacity-90"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm shadow-inner">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              StudyPod <span className="text-teal-300">AI</span>
            </span>
          </Link>

          {isAuthenticated && (
            <nav className="hidden md:ml-6 md:flex md:items-center md:space-x-1 text-sm font-medium">
              <Link
                to="/dashboard"
                className={`rounded-lg px-3 py-2 transition ${
                  location.pathname === '/dashboard'
                    ? 'bg-white/20 text-white'
                    : 'text-violet-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
            </nav>
          )}
        </div>

        {/* Center: Pod Switcher Dropdown (Authenticated) */}
        {isAuthenticated && (
          <div className="relative" ref={podMenuRef}>
            <button
              onClick={() => setPodDropdownOpen(!podDropdownOpen)}
              className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="Switch Pod"
            >
              <div className="h-2 w-2 rounded-full bg-teal-400" />
              <span className="max-w-[140px] truncate sm:max-w-[200px]">
                {activePod ? activePod.name : pods.length > 0 ? 'Select a Pod' : 'No Pods Yet'}
              </span>
              <ChevronDown className="h-4 w-4 text-violet-200" />
            </button>

            {podDropdownOpen && (
              <div className="absolute left-1/2 mt-2 w-64 -translate-x-1/2 rounded-xl bg-white p-1 text-slate-800 shadow-xl ring-1 ring-black/5">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Your Study Pods
                </div>

                {pods.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500">
                    You haven't joined any pods yet.
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto">
                    {pods.map((pod) => (
                      <button
                        key={pod.id}
                        onClick={() => handleSelectPod(pod.id)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                          activePod?.id === pod.id
                            ? 'bg-violet-50 font-semibold text-violet-700'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="truncate">
                          <p className="truncate font-medium">{pod.name}</p>
                          <span className="text-xs text-slate-400">{pod.exam_category}</span>
                        </div>
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {pod.members?.length || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="border-t border-slate-100 p-1">
                  <button
                    onClick={() => {
                      setPodDropdownOpen(false);
                      if (onOpenFindPod) {
                        onOpenFindPod();
                      } else {
                        navigate('/dashboard');
                      }
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-violet-600 hover:bg-violet-50"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Find or Join a Pod</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right: User Menu or Auth CTAs */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-full p-1 transition hover:ring-2 hover:ring-white/30 focus:outline-none"
              >
                <Avatar username={user?.username || 'User'} size="md" online={true} />
                <span className="hidden text-sm font-semibold text-white sm:inline-block">
                  {user?.username || 'Student'}
                </span>
                <ChevronDown className="hidden h-4 w-4 text-violet-200 sm:inline-block" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white p-1 text-slate-800 shadow-xl ring-1 ring-black/5">
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {user?.username}
                    </p>
                    <p className="truncate text-xs text-slate-500">{user?.email}</p>
                    {user?.is_premium && (
                      <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                        PRO Member
                      </span>
                    )}
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <UserIcon className="h-4 w-4 text-slate-400" />
                    Profile & Settings
                  </Link>

                  <Link
                    to="/dashboard"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Compass className="h-4 w-4 text-slate-400" />
                    Study Hub
                  </Link>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/auth?tab=login"
                className="rounded-lg px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Log In
              </Link>
              <Link
                to="/auth?tab=register"
                className="rounded-lg bg-teal-400 px-4 py-1.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-teal-300 hover:shadow"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
