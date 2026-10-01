import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Printer,
  Sparkles,
  Flame,
  Apple,
  RefreshCw,
  Send,
  Calendar,
  Layers,
  Code2,
  ChevronRight,
  Clock,
  Dumbbell,
  Check,
  AlertCircle,
  Globe,
  ExternalLink,
  Database
} from 'lucide-react';
import { UserProfile, WorkoutPlanData, DayWorkout } from '../types';
import { parseWorkoutPlan } from '../utils/planParser';
import nutritionImage from '../assets/images/nutrition_fuel_cinematic_1790821829360.jpg';

interface WorkoutPlanResultProps {
  user: UserProfile;
  plan: WorkoutPlanData;
  onPlanUpdated: (updatedPlan: WorkoutPlanData) => void;
  onNavigateToGenerator: () => void;
}

export const WorkoutPlanResult: React.FC<WorkoutPlanResultProps> = ({
  user,
  plan,
  onPlanUpdated,
  onNavigateToGenerator,
}) => {
  const [activeVersion, setActiveVersion] = useState<'current' | 'original'>(
    plan.updated_plan ? 'current' : 'original'
  );
  const [viewMode, setViewMode] = useState<'interactive' | 'pre'>('interactive');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackUserId, setFeedbackUserId] = useState(String(user.id));
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string | null>(
    plan.updated_plan ? 'Your plan has been updated based on your feedback!' : null
  );
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Active display plan text
  const currentPlanText =
    activeVersion === 'current' && plan.updated_plan ? plan.updated_plan : plan.original_plan;

  // Parse days for interactive rendering
  const days: DayWorkout[] = parseWorkoutPlan(currentPlanText);

  // Submit feedback handler (persists to SQLite table plans & feedback_history)
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);

    if (!feedbackText.trim()) {
      setFeedbackError('Please enter your feedback or suggested adjustments.');
      return;
    }

    setIsUpdating(true);
    setFeedbackSuccessMsg(null);

    try {
      const res = await fetch('/api/submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: feedbackUserId.trim() || user.id,
          feedback: feedbackText.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      onPlanUpdated(data.plan);
      setActiveVersion('current');
      setFeedbackSuccessMsg(data.message || 'Your plan has been updated based on your feedback!');
      setFeedbackText('');
    } catch (err: any) {
      console.error('Feedback submission error:', err);
      setFeedbackError(err.message || 'Failed to update plan. Please verify User ID.');
    } finally {
      setIsUpdating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentPlanText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const activeDay = days[selectedDayIndex] || days[0];

  return (
    <div className="min-h-screen bg-[#080b11] py-5 sm:py-8 px-3 sm:px-6 lg:px-8 pb-24 md:pb-12">
      <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8">
        {/* Success Alert Banner when updated via feedback */}
        {feedbackSuccessMsg && (
          <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/60 shadow-lg flex items-center gap-3 text-emerald-200">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <div className="text-xs sm:text-sm font-semibold">
              {feedbackSuccessMsg}
            </div>
          </div>
        )}

        {/* User Information Card */}
        <div className="bg-[#0f141f] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
                <span>ATHLETE PROFILE</span>
                <span className="text-slate-600">/</span>
                <span>SQLITE USER #{user.id}</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                {user.name}&apos;s Personalized Workout Plan
              </h1>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={copyToClipboard}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer min-h-[36px]"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer min-h-[36px]"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* User biometrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 pt-4 sm:pt-5 text-xs">
            <div className="p-2.5 sm:p-3 rounded-lg bg-[#141b2b] border border-slate-800">
              <span className="text-slate-400 block mb-0.5 text-[11px]">Athlete Name</span>
              <span className="font-semibold text-white truncate block">{user.name}</span>
            </div>
            <div className="p-2.5 sm:p-3 rounded-lg bg-[#141b2b] border border-slate-800">
              <span className="text-slate-400 block mb-0.5 text-[11px]">User ID</span>
              <span className="font-mono font-semibold text-amber-400 block truncate">{user.id}</span>
            </div>
            <div className="p-2.5 sm:p-3 rounded-lg bg-[#141b2b] border border-slate-800">
              <span className="text-slate-400 block mb-0.5 text-[11px]">Age</span>
              <span className="font-semibold text-white tabular-nums block">{user.age} yrs</span>
            </div>
            <div className="p-2.5 sm:p-3 rounded-lg bg-[#141b2b] border border-slate-800">
              <span className="text-slate-400 block mb-0.5 text-[11px]">Weight</span>
              <span className="font-semibold text-white tabular-nums block">{user.weight} kg</span>
            </div>
            <div className="p-2.5 sm:p-3 rounded-lg bg-[#141b2b] border border-slate-800">
              <span className="text-slate-400 block mb-0.5 text-[11px]">Intensity</span>
              <span className="capitalize font-semibold text-amber-400 flex items-center gap-1">
                <Flame className="h-3 w-3 shrink-0" />
                <span>{user.intensity}</span>
              </span>
            </div>
            <div className="p-2.5 sm:p-3 rounded-lg bg-[#141b2b] border border-slate-800 col-span-2 sm:col-span-1 lg:col-span-1">
              <span className="text-slate-400 block mb-0.5 text-[11px]">Primary Goal</span>
              <span className="font-semibold text-slate-200 truncate block">{user.goal}</span>
            </div>
          </div>
        </div>

        {/* Plan Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#0f141f] border border-slate-800 p-3 sm:p-4 rounded-xl">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-white">7-Day Workout Protocol</span>
            {plan.updated_plan && (
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                Dynamic Revisions Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end overflow-x-auto no-scrollbar">
            {plan.updated_plan && (
              <div className="flex items-center p-1 bg-[#141b2b] border border-slate-700/80 rounded-lg text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveVersion('current')}
                  className={`px-2.5 sm:px-3 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap min-h-[30px] ${
                    activeVersion === 'current'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Updated (v2)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVersion('original')}
                  className={`px-2.5 sm:px-3 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap min-h-[30px] ${
                    activeVersion === 'original'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Original
                </button>
              </div>
            )}

            <div className="flex items-center p-1 bg-[#141b2b] border border-slate-700/80 rounded-lg text-xs shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('interactive')}
                className={`px-2.5 sm:px-3 py-1 rounded-md flex items-center gap-1.5 transition-all cursor-pointer min-h-[30px] ${
                  viewMode === 'interactive'
                    ? 'bg-slate-700 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="h-3 w-3" />
                <span>Interactive</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('pre')}
                className={`px-2.5 sm:px-3 py-1 rounded-md flex items-center gap-1.5 transition-all cursor-pointer min-h-[30px] ${
                  viewMode === 'pre'
                    ? 'bg-slate-700 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code2 className="h-3 w-3" />
                <span>Raw &lt;pre&gt;</span>
              </button>
            </div>
          </div>
        </div>

        {/* Plan Content Section */}
        {viewMode === 'interactive' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            {/* Day Selector */}
            <div className="lg:col-span-4 space-y-2">
              <span className="text-xs font-semibold text-slate-400 block px-1">
                SCHEDULE ROTATION (7 DAYS)
              </span>

              {/* Mobile Horizontal Carousel */}
              <div className="lg:hidden flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {days.map((day, idx) => {
                  const isSelected = selectedDayIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDayIndex(idx)}
                      className={`shrink-0 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer min-h-[44px] flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 font-bold border-amber-400 shadow-md'
                          : 'bg-[#0f141f] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>Day {day.dayNumber}</span>
                      <span className={`text-[10px] truncate max-w-[90px] font-normal ${isSelected ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                        {day.focus.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Desktop Vertical List */}
              <div className="hidden lg:block space-y-2">
                {days.map((day, idx) => {
                  const isSelected = selectedDayIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDayIndex(idx)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 border-amber-400 text-white shadow-md'
                          : 'bg-[#0f141f] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-[#141b2b]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-mono font-bold ${
                              isSelected ? 'text-amber-400' : 'text-slate-400'
                            }`}
                          >
                            Day {day.dayNumber}
                          </span>
                        </div>
                        <div className="text-sm font-semibold truncate mt-0.5 max-w-[200px]">
                          {day.focus}
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 transition-transform ${
                          isSelected ? 'text-amber-400 translate-x-1' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Day Routine Detail */}
            <div className="lg:col-span-8 bg-[#0f141f] border border-slate-800 rounded-2xl p-4 sm:p-7 shadow-xl space-y-5 sm:space-y-6">
              <div className="pb-3 sm:pb-4 border-b border-slate-800">
                <span className="text-xs font-mono text-amber-400">
                  DAY {activeDay?.dayNumber || 1} PROTOCOL
                </span>
                <h2 className="text-lg sm:text-2xl font-bold text-white mt-0.5 sm:mt-1">
                  {activeDay?.focus}
                </h2>
              </div>

              {/* Warm-up Card */}
              <div className="rounded-xl bg-[#141b2b] border border-slate-800 p-3.5 sm:p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide mb-1.5 sm:mb-2">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>Warm-up Guidance (5–10 mins)</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {activeDay?.warmup}
                </p>
              </div>

              {/* Main Workout Exercises */}
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wide">
                  <span className="flex items-center gap-1.5 text-slate-200">
                    <Dumbbell className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>Main Movements</span>
                  </span>
                  <span>{activeDay?.exercises?.length || 0} Exercises</span>
                </div>

                <div className="space-y-2">
                  {activeDay?.exercises && activeDay.exercises.length > 0 ? (
                    activeDay.exercises.map((ex, i) => (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-3.5 rounded-lg bg-[#141b2b] border border-slate-800 hover:border-slate-700 transition-colors gap-2"
                      >
                        <div className="flex items-start sm:items-center gap-2.5">
                          <span className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-md bg-slate-800 text-[11px] sm:text-xs font-mono text-amber-400 mt-0.5 sm:mt-0">
                            {i + 1}
                          </span>
                          <span className="text-xs sm:text-sm font-semibold text-white">
                            {ex.name}
                          </span>
                        </div>
                        <div className="sm:text-right pl-7 sm:pl-0">
                          <span className="text-[11px] sm:text-xs font-mono text-amber-300 bg-amber-400/10 px-2 py-0.5 sm:py-1 rounded border border-amber-400/20 inline-block">
                            {ex.setsAndReps}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-xs text-slate-400">
                      Standard protocol active. See raw breakdown below.
                    </div>
                  )}
                </div>
              </div>

              {/* Cooldown Card */}
              <div className="rounded-xl bg-[#141b2b] border border-slate-800 p-3.5 sm:p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wide mb-1.5 sm:mb-2">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>Cooldown &amp; Recovery</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {activeDay?.cooldown}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs text-slate-400 font-mono">
              <span className="truncate">FORMATTED &lt;pre&gt; OUTPUT</span>
              <button
                onClick={copyToClipboard}
                className="text-amber-400 hover:underline cursor-pointer shrink-0 ml-2"
              >
                {copied ? 'Copied' : 'Copy All'}
              </button>
            </div>
            <pre className="text-xs sm:text-sm font-mono text-slate-200 whitespace-pre-wrap leading-relaxed overflow-x-auto p-3 sm:p-4 bg-[#07090e] rounded-xl border border-slate-800/80">
              {currentPlanText}
            </pre>
          </div>
        )}

        {/* Google Search Grounding Sources */}
        {plan.grounding_sources && plan.grounding_sources.length > 0 && (
          <div className="p-4 rounded-xl bg-[#121929] border border-blue-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
              <Globe className="h-4 w-4 shrink-0" />
              <span>Google Search Grounded Sports Science Sources</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {plan.grounding_sources.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded bg-slate-900 border border-slate-800 hover:border-blue-400 flex items-center justify-between text-xs text-slate-300 hover:text-blue-300 transition-colors"
                >
                  <span className="truncate pr-2">{s.title}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 text-slate-500" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Nutrition Tip Section */}
        <div className="bg-gradient-to-br from-[#121929] to-[#0f141f] border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-xl overflow-hidden relative">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center">
            <div className="md:col-span-8 space-y-2 sm:space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Apple className="h-4 w-4 shrink-0" />
                <span>Targeted Nutrition &amp; Recovery Tip (Gemini Flash)</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Complementary Fueling for &ldquo;{user.goal}&rdquo;
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {plan.nutrition_tip}
              </p>
              <div className="pt-1 sm:pt-2 text-[11px] sm:text-xs text-slate-400 flex flex-wrap items-center gap-2 sm:gap-4">
                <span>· Goal: {user.goal}</span>
                <span>· Intensity: {user.intensity}</span>
              </div>
            </div>

            <div className="md:col-span-4 flex justify-center">
              <div className="relative rounded-xl overflow-hidden border border-slate-700/70 shadow-lg w-full max-w-[240px] sm:max-w-[260px] aspect-[4/3]">
                <img
                  src={nutritionImage}
                  alt="Athletic nutrition recovery plate"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 text-[10px] sm:text-[11px] font-medium text-white px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm">
                  Precision Recovery
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Share Your Feedback Section */}
        <div className="bg-[#0f141f] border border-slate-800 rounded-2xl p-4 sm:p-8 shadow-xl">
          <div className="flex items-start sm:items-center gap-2.5 pb-4 mb-5 border-b border-slate-800">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 mt-0.5 sm:mt-0">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Share Your Feedback &amp; Dynamically Update Plan
              </h3>
              <p className="text-xs text-slate-400">
                Tell Gemini what you want to change (e.g. &ldquo;Add more cardio&rdquo;, &ldquo;Include yoga sessions&rdquo;). The AI model adapts the plan and saves changes to SQLite.
              </p>
            </div>
          </div>

          {feedbackError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{feedbackError}</span>
            </div>
          )}

          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Your Unique User ID:
              </label>
              <input
                type="text"
                required
                value={feedbackUserId}
                onChange={(e) => setFeedbackUserId(e.target.value)}
                placeholder="Enter User ID"
                className="w-full max-w-sm bg-[#161d2d] border border-slate-700 rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Your Feedback &amp; Requested Adjustments:
              </label>
              <textarea
                rows={3}
                required
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Let us know how to improve your plan (e.g. 'Add 15 mins of yoga on Day 3 and substitute squats with goblet squats')..."
                className="w-full bg-[#161d2d] border border-slate-700 rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="text-slate-400 mr-1 self-center">Suggestions:</span>
                <button
                  type="button"
                  onClick={() => setFeedbackText('Add 20 minutes of restorative yoga and mobility on active rest days.')}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer min-h-[28px]"
                >
                  + Add Yoga
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackText('Include more cardiovascular HIIT finishers and reduce rest intervals.')}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer min-h-[28px]"
                >
                  + More Cardio
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackText('Make lower body exercises joint-friendly with less direct compressive spinal load.')}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer min-h-[28px]"
                >
                  + Joint-Friendly
                </button>
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed whitespace-nowrap min-h-[44px]"
              >
                {isUpdating ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Regenerating via Gemini...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Submit Feedback</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {plan.feedback_history && plan.feedback_history.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-slate-400 block mb-2">
                Previous Feedback Iterations ({plan.feedback_history.length}):
              </span>
              <div className="space-y-2">
                {plan.feedback_history.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#141b2b] border border-slate-800 text-xs flex items-start justify-between gap-3"
                  >
                    <span className="text-slate-200">{item.feedback}</span>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
