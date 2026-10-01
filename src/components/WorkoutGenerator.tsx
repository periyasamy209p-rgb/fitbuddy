import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Flame, Zap, Award, Target, Scale, User, Hash, Globe, Database } from 'lucide-react';
import { UserProfile, WorkoutPlanData } from '../types';
import gymHeroImage from '../assets/images/gym_cinematic_hero_1790821815135.jpg';

interface WorkoutGeneratorProps {
  onPlanGenerated: (user: UserProfile, plan: WorkoutPlanData) => void;
  initialValues?: Partial<UserProfile>;
}

const PRESET_GOALS = [
  'Muscle Gain & Hypertrophy',
  'Fat Loss & Athletic Conditioning',
  'Strength & Core Power',
  'Endurance & Stamina',
  'Functional Mobility & Posture',
  'General Wellness & Longevity',
];

export const WorkoutGenerator: React.FC<WorkoutGeneratorProps> = ({
  onPlanGenerated,
  initialValues,
}) => {
  const [username, setUsername] = useState(initialValues?.name || '');
  const [userId, setUserId] = useState<string>(initialValues?.id ? String(initialValues.id) : '');
  const [age, setAge] = useState<string>(initialValues?.age ? String(initialValues.age) : '24');
  const [weight, setWeight] = useState<string>(initialValues?.weight ? String(initialValues.weight) : '68.5');
  const [goal, setGoal] = useState(initialValues?.goal || 'Muscle Gain & Hypertrophy');
  const [customGoal, setCustomGoal] = useState('');
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>(initialValues?.intensity || 'medium');
  const [useSearchGrounding, setUseSearchGrounding] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('Initializing athletic profile...');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const effectiveGoal = customGoal.trim() ? customGoal.trim() : goal;

    if (!username.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!userId.trim()) {
      setErrorMsg('Please specify a unique User ID.');
      return;
    }

    setIsSubmitting(true);
    setLoadingStep(
      useSearchGrounding
        ? 'Grounding protocol with real-time sports science via Google Search...'
        : 'Consulting Gemini AI fitness reasoning models...'
    );

    try {
      const stepTimer1 = setTimeout(() => {
        setLoadingStep('Structuring 7-day periodized warmup, main lifts & cooldowns...');
      }, 1800);

      const stepTimer2 = setTimeout(() => {
        setLoadingStep('Synthesizing goal-specific nutrition and recovery guidelines...');
      }, 3500);

      const res = await fetch('/api/generate-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          user_id: userId.trim(),
          age: parseInt(age, 10) || 25,
          weight: parseFloat(weight) || 70.0,
          goal: effectiveGoal,
          intensity,
          useSearchGrounding,
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      onPlanGenerated(data.user, data.plan);
    } catch (err: any) {
      console.error('Error generating plan:', err);
      setErrorMsg(err.message || 'Failed to generate workout plan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyPreset = (presetName: string, id: string, presetAge: string, presetWeight: string, presetGoal: string, presetIntensity: 'low' | 'medium' | 'high') => {
    setUsername(presetName);
    setUserId(id);
    setAge(presetAge);
    setWeight(presetWeight);
    setGoal(presetGoal);
    setCustomGoal('');
    setIntensity(presetIntensity);
    setErrorMsg(null);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden pb-24 md:pb-12">
      {/* Cinematic Background with atmospheric gradient overlays */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <img
          src={gymHeroImage}
          alt="Cinematic training gym facility"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-30 filter contrast-125 brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080b11] via-[#080b11]/85 to-transparent" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#080b11]/60 to-[#080b11]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-3 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 pt-4 sm:pt-6">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-amber-400 mb-2 sm:mb-3 tracking-wide uppercase px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
            <Zap className="h-3.5 w-3.5" />
            <span>AI Athletic Architecture · SQLite + SQLAlchemy Persistence</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-2 sm:mb-4 leading-tight">
            FitBuddy – AI Fitness Plan Generator
          </h1>

          <p className="text-xs sm:text-base text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
            Generate a personalized 7-day workout routine and targeted nutrition advice. All data and plan versions are stored directly in your local SQLite database (<code>fitbuddy.db</code>).
          </p>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-4 sm:mt-6 overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center justify-start sm:justify-center gap-2 min-w-max px-1 text-xs">
              <span className="text-slate-400 font-medium shrink-0">Sample Profiles:</span>
              <button
                type="button"
                onClick={() => applyPreset('Shreya Patel', '101', '22', '55.0', 'Muscle Gain & Hypertrophy', 'high')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 text-slate-200 hover:bg-amber-500/20 hover:text-amber-300 border border-slate-700/80 transition-all cursor-pointer whitespace-nowrap min-h-[32px] flex items-center"
              >
                Shreya (22y · 55kg · Muscle Gain)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('Marcus Vance', '102', '29', '78.5', 'Fat Loss & Athletic Conditioning', 'medium')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 text-slate-200 hover:bg-amber-500/20 hover:text-amber-300 border border-slate-700/80 transition-all cursor-pointer whitespace-nowrap min-h-[32px] flex items-center"
              >
                Marcus (29y · 78.5kg · Fat Loss)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('Elena Rostova', '103', '34', '62.0', 'Functional Mobility & Posture', 'low')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 text-slate-200 hover:bg-amber-500/20 hover:text-amber-300 border border-slate-700/80 transition-all cursor-pointer whitespace-nowrap min-h-[32px] flex items-center"
              >
                Elena (34y · 62kg · Mobility)
              </button>
            </div>
          </div>
        </div>

        {/* Input Form Card */}
        <div className="mx-auto max-w-2xl bg-[#0f141f]/95 border border-slate-800 shadow-2xl rounded-2xl backdrop-blur-xl p-4 sm:p-7 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 sm:pb-5 mb-5 border-b border-slate-800/80">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Personal Athlete Blueprint</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Saved directly to SQLite table <code>users</code> and <code>plans</code>.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[11px] sm:text-xs font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded flex items-center gap-1">
                <Database className="h-3 w-3" />
                <span>SQLite</span>
              </span>
              <span className="text-[11px] sm:text-xs font-mono text-slate-400 bg-slate-800/80 border border-slate-700/80 px-2 py-0.5 rounded">
                7-Day Split
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-4 sm:space-y-5">
            {/* Row 1: Name and User ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-amber-400" />
                  <span>Full Name / Username</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shreya Patel"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#161d2d] border border-slate-700/90 rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-amber-400" />
                  <span>Unique User ID</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 101 or coach_shreya"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full bg-[#161d2d] border border-slate-700/90 rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors min-h-[44px]"
                />
              </div>
            </div>

            {/* Row 2: Age and Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-amber-400" />
                  <span>Age (Years)</span>
                </label>
                <input
                  type="number"
                  min="14"
                  max="95"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-[#161d2d] border border-slate-700/90 rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5 text-amber-400" />
                  <span>Body Weight (kg)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="250"
                  required
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-[#161d2d] border border-slate-700/90 rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors min-h-[44px]"
                />
              </div>
            </div>

            {/* Row 3: Fitness Goal */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-amber-400" />
                <span>Primary Fitness Goal</span>
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-[#161d2d] border border-slate-700/90 rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors mb-2 min-h-[44px]"
              >
                {PRESET_GOALS.map((g) => (
                  <option key={g} value={g} className="bg-slate-900 text-white">
                    {g}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Or specify custom nuance (e.g. lose belly fat while building back strength)"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                className="w-full bg-[#121824] border border-slate-800 rounded-lg px-3.5 py-2.5 text-base sm:text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-colors min-h-[40px]"
              />
            </div>

            {/* Row 4: Workout Intensity */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-amber-400" />
                  <span>Preferred Workout Intensity</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {intensity === 'low' && '3-4 days mod recovery'}
                  {intensity === 'medium' && '4-5 days balanced progression'}
                  {intensity === 'high' && '5-6 days intense volume'}
                </span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((level) => {
                  const isSelected = intensity === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setIntensity(level)}
                      className={`py-2.5 sm:py-3 px-2 rounded-lg border text-center transition-all cursor-pointer min-h-[48px] flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                          : 'bg-[#161d2d] border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      <div className="capitalize text-xs sm:text-sm font-semibold">{level}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">
                        {level === 'low' && '3-4 days'}
                        {level === 'medium' && '4-5 days'}
                        {level === 'high' && '5-6 days'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Google Search Grounding Checkbox */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-[#141b2b] border border-slate-800 flex items-center justify-between gap-3 min-h-[44px]">
              <div className="flex items-center gap-2.5">
                <Globe className="h-4 w-4 text-blue-400 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Sports Science Research Grounding (Gemini Flash)
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Enrich routine with live sports science research &amp; citations
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={useSearchGrounding}
                onChange={(e) => setUseSearchGrounding(e.target.checked)}
                className="h-5 w-5 rounded accent-amber-400 bg-slate-900 border-slate-700 cursor-pointer shrink-0"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 sm:py-4 px-6 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed min-h-[48px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span className="truncate">{loadingStep}</span>
                  </>
                ) : (
                  <>
                    <span>Generate Personalized Workout Plan</span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Bottom SQLite persistence note */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Stored locally in SQLite (fitbuddy.db)</span>
            </span>
            <span>7-Day Periodization</span>
          </div>
        </div>
      </div>
    </div>
  );
};
