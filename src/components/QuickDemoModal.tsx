import React from 'react';
import { X, User, ArrowRight, Flame } from 'lucide-react';
import { UserProfile } from '../types';

interface QuickDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProfile: (profile: Partial<UserProfile>) => void;
}

const DEMO_PROFILES: Array<Partial<UserProfile> & { tag: string; bio: string }> = [
  {
    name: 'Shreya Patel',
    id: 101,
    age: 22,
    weight: 55.0,
    goal: 'Muscle Gain & Hypertrophy',
    intensity: 'high',
    tag: 'From PDF Case Study',
    bio: 'College student seeking structured compound lifts, hypertrophy progression, and nutritional recovery.',
  },
  {
    name: 'Marcus Vance',
    id: 102,
    age: 29,
    weight: 78.5,
    goal: 'Fat Loss & Athletic Conditioning',
    intensity: 'medium',
    tag: 'Active Scenario',
    bio: 'Busy professional targeting body fat reduction and metabolic stamina through high-efficiency circuits.',
  },
  {
    name: 'Elena Rostova',
    id: 103,
    age: 34,
    weight: 62.0,
    goal: 'Functional Mobility & Posture',
    intensity: 'low',
    tag: 'Joint Recovery',
    bio: 'Designer aiming to correct desk posture, strengthen deep stabilizing core, and restore hip mobility.',
  },
  {
    name: 'David Chen',
    id: 104,
    age: 41,
    weight: 84.0,
    goal: 'Strength & Core Power',
    intensity: 'high',
    tag: 'Heavy Progression',
    bio: 'Lifter focused on progressive overload, barbell power lifts, and high-protein post-workout fueling.',
  },
];

export const QuickDemoModal: React.FC<QuickDemoModalProps> = ({
  isOpen,
  onClose,
  onSelectProfile,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0f141f] border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Select Sample Athlete Profile
            </h3>
            <p className="text-xs text-slate-400">
              Load pre-configured parameters to generate or review plans immediately.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {DEMO_PROFILES.map((p) => (
            <button
              key={p.name}
              onClick={() => {
                onSelectProfile(p);
                onClose();
              }}
              className="w-full text-left p-3.5 rounded-xl bg-[#141b2b] border border-slate-800 hover:border-amber-400/80 hover:bg-[#182135] transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm group-hover:text-amber-300 transition-colors">
                    {p.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    ID: {p.id}
                  </span>
                  <span className="text-[10px] bg-amber-400/10 text-amber-300 border border-amber-400/20 px-1.5 py-0.2 rounded">
                    {p.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {p.age}y · {p.weight}kg · <span className="text-slate-300">{p.goal}</span> · <span className="capitalize text-amber-400">{p.intensity}</span>
                </p>
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  {p.bio}
                </p>
              </div>

              <div className="flex items-center gap-1 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0">
                <span className="text-xs font-semibold">Select</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
