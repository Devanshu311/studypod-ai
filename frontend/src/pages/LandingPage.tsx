import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  Sparkles,
  Timer,
  CheckCircle2,
  ArrowRight,
  Target,
  Rocket,
  ShieldCheck,
  TrendingUp,
  Award,
  BookOpen,
  MessageSquare,
  Zap,
} from 'lucide-react';
import Navbar from '../components/Navbar';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-violet-100 selection:text-violet-800">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-violet-50/70 via-white to-slate-50 pt-16 pb-24 md:pt-28 md:pb-36">
        {/* Subtle decorative background gradient mesh */}
        <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-[480px] w-[600px] rounded-full bg-violet-400/15 blur-3xl" />
          <div className="h-[380px] w-[450px] -translate-x-48 rounded-full bg-teal-400/15 blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-4 py-1.5 text-xs font-semibold text-violet-700 shadow-2xs backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-violet-600" />
            <span>AI-Powered Micro Study Groups for Serious Students</span>
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl md:text-7xl">
            Study Smarter,{' '}
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-teal-500 bg-clip-text text-transparent">
              Together.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 sm:text-xl leading-relaxed">
            Join AI-powered micro study groups. Get matched with peers, stay accountable,
            and ace your exams with synchronized focus sprints and autonomous coaching.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/auth?tab=register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-5 w-5" />
            </Link>

            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-7 py-4 text-base font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-400"
            >
              Learn More
            </a>
          </div>

          {/* Social Proof Stats */}
          <div className="mt-14 grid grid-cols-2 gap-4 border-t border-slate-200/80 pt-10 sm:grid-cols-4">
            <div>
              <div className="text-2xl font-bold text-slate-900 sm:text-3xl">4 Peers</div>
              <div className="text-xs text-slate-500 mt-0.5">Optimal Pod Size</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 sm:text-3xl">3.4x</div>
              <div className="text-xs text-slate-500 mt-0.5">Higher Consistency</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 sm:text-3xl">24/7</div>
              <div className="text-xs text-slate-500 mt-0.5">AI Study Coach</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 sm:text-3xl">99.2%</div>
              <div className="text-xs text-slate-500 mt-0.5">Match Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white border-y border-slate-200/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-violet-600">
              Simple 3-Step Process
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              How StudyPod AI Works
            </p>
            <p className="mx-auto mt-3 max-w-xl text-slate-600 text-sm sm:text-base">
              Say goodbye to lonely, distracted study sessions. We bring the study hall to you.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-8 shadow-xs transition hover:shadow-md hover:border-violet-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
                <BookOpen className="h-6 w-6" />
              </div>
              <span className="mt-6 inline-block text-xs font-bold uppercase tracking-wider text-violet-600">
                Step 01
              </span>
              <h3 className="mt-1 text-xl font-bold text-slate-900">Sign Up</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Tell us your exam (JEE, GATE, UPSC, CAT, Semester), your focus subjects,
                and your daily study goals.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-8 shadow-xs transition hover:shadow-md hover:border-violet-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500 text-white shadow-sm">
                <Target className="h-6 w-6" />
              </div>
              <span className="mt-6 inline-block text-xs font-bold uppercase tracking-wider text-teal-600">
                Step 02
              </span>
              <h3 className="mt-1 text-xl font-bold text-slate-900">Get Matched</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Our smart matchmaking algorithm pairs you with 3 equally motivated peers
                studying the exact same syllabus.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-8 shadow-xs transition hover:shadow-md hover:border-violet-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
                <Rocket className="h-6 w-6" />
              </div>
              <span className="mt-6 inline-block text-xs font-bold uppercase tracking-wider text-purple-600">
                Step 03
              </span>
              <h3 className="mt-1 text-xl font-bold text-slate-900">Study Together</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Join synchronized Pomodoro focus sessions, track shared milestones, and
                receive nudges from your autonomous AI coach.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-violet-600">
              Engineered For Results
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Everything You Need to Stay Accountable
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-violet-300 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">Pod Matching</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Smart algorithm pairs you with peers studying for the same exam with
                compatible schedules and dedication levels.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-violet-300 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">AI Study Coach</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Your personal AI bot sets milestones, motivates, answers doubts, and
                keeps your entire pod on track.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-violet-300 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                <Timer className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">Group Pomodoro</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Synchronized focus sessions with your pod. Study together in real time,
                even when continents apart.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-violet-300 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">Accountability</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Streak tracking, progress alerts, and gentle nudges when you fall behind
                on target milestones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white border-t border-slate-200/80">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-violet-600">
              Affordable & Simple
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Invest in Your Study Discipline
            </p>
            <p className="mx-auto mt-3 max-w-lg text-slate-600 text-sm">
              Start with our full-featured Free tier, upgrade anytime for superpowers.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Free Tier */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Free Tier</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Ideal for students starting out with micro study pods.
                </p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-900">$0</span>
                  <span className="ml-1 text-sm text-slate-500">/ forever</span>
                </div>

                <ul className="mt-8 space-y-3.5 text-sm text-slate-700">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-teal-600" />
                    <span>Basic pod matching (1 active pod)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-teal-600" />
                    <span>Group chat & shared messaging</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-teal-600" />
                    <span>Real-time Pomodoro timer</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-teal-600" />
                    <span>Milestone progress board</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  to="/auth?tab=register"
                  className="block w-full rounded-xl border border-slate-300 bg-white py-3 text-center text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                >
                  Join for Free
                </Link>
              </div>
            </div>

            {/* Premium Tier ($4.99/mo) */}
            <div className="relative flex flex-col justify-between rounded-3xl border-2 border-violet-500 bg-gradient-to-b from-violet-50/40 via-white to-white p-8 shadow-xl ring-4 ring-violet-500/10">
              <div className="absolute -top-3.5 right-6 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-3.5 py-1 text-xs font-bold text-white uppercase tracking-wider shadow-sm">
                Most Popular
              </div>

              <div>
                <h3 className="text-xl font-bold text-violet-900">Premium Pro</h3>
                <p className="mt-1 text-sm text-slate-600">
                  For competitive exam aspirants aiming for top percentiles.
                </p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-extrabold text-violet-900">$4.99</span>
                  <span className="ml-1 text-sm text-slate-500">/ month</span>
                </div>

                <ul className="mt-8 space-y-3.5 text-sm text-slate-700">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-violet-600" />
                    <span className="font-semibold text-slate-900">Unlimited active pods</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-violet-600" />
                    <span>Advanced AI Coaching & personalized study roadmaps</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-violet-600" />
                    <span>Deep focus analytics & streak recovery</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-violet-600" />
                    <span>Custom study plans & mock test tracking</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-violet-600" />
                    <span>Priority queue matchmaking</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  to="/auth?tab=register"
                  className="block w-full rounded-xl bg-violet-600 py-3 text-center text-sm font-bold text-white shadow-md shadow-violet-500/20 transition hover:bg-violet-700"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-white">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold text-white">StudyPod AI</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Empowering students worldwide with autonomous study groups, focus timers,
                and AI-driven exam mastery.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Product
              </h4>
              <ul className="mt-4 space-y-2 text-xs">
                <li><a href="#how-it-works" className="hover:text-white transition">How it Works</a></li>
                <li><Link to="/auth?tab=register" className="hover:text-white transition">Pod Matching</Link></li>
                <li><Link to="/auth?tab=register" className="hover:text-white transition">AI Study Bot</Link></li>
                <li><Link to="/auth?tab=register" className="hover:text-white transition">Pomodoro Timer</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Company
              </h4>
              <ul className="mt-4 space-y-2 text-xs">
                <li><a href="#about" className="hover:text-white transition">About Us</a></li>
                <li><a href="#careers" className="hover:text-white transition">Careers</a></li>
                <li><a href="#blog" className="hover:text-white transition">Study Tips Blog</a></li>
                <li><a href="#contact" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Legal
              </h4>
              <ul className="mt-4 space-y-2 text-xs">
                <li><a href="#privacy" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#terms" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#guidelines" className="hover:text-white transition">Community Guidelines</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between border-t border-slate-800 pt-6 sm:flex-row text-xs text-slate-500">
            <p>© {new Date().getFullYear()} StudyPod AI Inc. All rights reserved.</p>
            <p className="mt-2 sm:mt-0 font-medium">
              Made with <span className="text-rose-500">💜</span> for students everywhere
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
