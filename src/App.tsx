import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { WorkoutGenerator } from './components/WorkoutGenerator';
import { WorkoutPlanResult } from './components/WorkoutPlanResult';
import { AdminDashboard } from './components/AdminDashboard';
import { ApiDocsModal } from './components/ApiDocsModal';
import { QuickDemoModal } from './components/QuickDemoModal';
import { LiveVoiceCoachModal } from './components/LiveVoiceCoachModal';
import { SearchGroundingModal } from './components/SearchGroundingModal';
import { UserProfile, WorkoutPlanData } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'generator' | 'plan' | 'admin' | 'api'>('generator');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentPlan, setCurrentPlan] = useState<WorkoutPlanData | null>(null);
  const [generatorPreset, setGeneratorPreset] = useState<Partial<UserProfile> | undefined>();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isLiveCoachOpen, setIsLiveCoachOpen] = useState(false);
  const [isSearchGroundingOpen, setIsSearchGroundingOpen] = useState(false);

  useEffect(() => {
    // Check if ?coach=true or #coach is passed in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('coach') === 'true' || window.location.hash === '#coach') {
      setIsLiveCoachOpen(true);
    }

    async function loadInitialPlan() {
      try {
        const res = await fetch('/api/users/101');
        if (res.ok) {
          const data = await res.json();
          if (data.user && data.plan) {
            setCurrentUser(data.user);
            setCurrentPlan(data.plan);
          }
        }
      } catch (err) {
        console.warn('Initial SQLite seed load error:', err);
      }
    }
    loadInitialPlan();
  }, []);

  const handlePlanGenerated = (user: UserProfile, plan: WorkoutPlanData) => {
    setCurrentUser(user);
    setCurrentPlan(plan);
    setActiveTab('plan');
  };

  const handlePlanUpdated = (updatedPlan: WorkoutPlanData) => {
    setCurrentPlan(updatedPlan);
  };

  const handleSelectUserFromAdmin = async (userId: number | string) => {
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user && data.plan) {
          setCurrentUser(data.user);
          setCurrentPlan(data.plan);
          setActiveTab('plan');
        }
      }
    } catch (err) {
      console.error('Failed fetching user from admin:', err);
    }
  };

  const handleNewPlan = () => {
    setGeneratorPreset(undefined);
    setActiveTab('generator');
  };

  const handleSelectDemoProfile = (profile: Partial<UserProfile>) => {
    setGeneratorPreset(profile);
    setActiveTab('generator');
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans selection:bg-amber-400/20 selection:text-amber-200">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasActivePlan={Boolean(currentPlan)}
        onNewPlan={handleNewPlan}
        onOpenQuickDemo={() => setIsDemoModalOpen(true)}
        onOpenLiveCoach={() => setIsLiveCoachOpen(true)}
        onOpenSearchGrounding={() => setIsSearchGroundingOpen(true)}
      />

      <main className="flex-1">
        {activeTab === 'generator' && (
          <WorkoutGenerator
            key={generatorPreset?.id ? String(generatorPreset.id) : 'empty'}
            onPlanGenerated={handlePlanGenerated}
            initialValues={generatorPreset}
          />
        )}

        {activeTab === 'plan' && (
          currentUser && currentPlan ? (
            <WorkoutPlanResult
              user={currentUser}
              plan={currentPlan}
              onPlanUpdated={handlePlanUpdated}
              onNavigateToGenerator={() => setActiveTab('generator')}
            />
          ) : (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
              <div className="text-center max-w-md bg-[#0f141f] border border-slate-800 p-8 rounded-2xl shadow-xl">
                <h3 className="text-lg font-bold text-white mb-2">No Active Workout Plan</h3>
                <p className="text-xs text-slate-400 mb-6">
                  Please generate a custom workout routine or load a sample athlete profile to explore the interactive protocol.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('generator')}
                    className="w-full sm:w-auto px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-all cursor-pointer"
                  >
                    Go to Generator
                  </button>
                  <button
                    onClick={() => setIsDemoModalOpen(true)}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg border border-slate-700 transition-all cursor-pointer"
                  >
                    Load Sample Profile
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            onSelectUserToView={handleSelectUserFromAdmin}
          />
        )}

        {activeTab === 'api' && (
          <ApiDocsModal />
        )}
      </main>

      {/* Quick Demo Profile Drawer */}
      <QuickDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onSelectProfile={handleSelectDemoProfile}
      />

      {/* Live Audio Coach (gemini-3.8-live) */}
      <LiveVoiceCoachModal
        isOpen={isLiveCoachOpen}
        onClose={() => setIsLiveCoachOpen(false)}
        userGoal={currentUser?.goal}
      />

      {/* Google Search Grounding Explorer (gemini-3.5-flash) */}
      <SearchGroundingModal
        isOpen={isSearchGroundingOpen}
        onClose={() => setIsSearchGroundingOpen(false)}
      />
    </div>
  );
}
