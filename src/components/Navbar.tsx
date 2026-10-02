import React, { useState } from 'react';
import { Dumbbell, Users, Terminal, PlusCircle, Mic, Globe, Menu, X, Sparkles, Activity, Database } from 'lucide-react';

interface NavbarProps {
  activeTab: 'generator' | 'plan' | 'admin' | 'api';
  setActiveTab: (tab: 'generator' | 'plan' | 'admin' | 'api') => void;
  hasActivePlan: boolean;
  onNewPlan: () => void;
  onOpenQuickDemo: () => void;
  onOpenLiveCoach: () => void;
  onOpenSearchGrounding: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  hasActivePlan,
  onNewPlan,
  onOpenQuickDemo,
  onOpenLiveCoach,
  onOpenSearchGrounding,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: 'generator' | 'plan' | 'admin' | 'api') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#080b11]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNavClick('generator')}
              className="flex items-center gap-2 group cursor-pointer text-left"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/10 transition-transform group-hover:scale-105">
                <Dumbbell className="h-5 w-5" />
              </div>
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white group-hover:text-amber-400 transition-colors">
                FitBuddy
              </span>
            </button>

            {/* SQLite Badge */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 text-[10px] font-mono text-amber-400">
              <Database className="h-3 w-3" />
              <span>SQLite · fitbuddy.db</span>
            </div>
          </div>

          {/* Navigation Links (Tablet & Desktop) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium">
            <button
              onClick={() => handleNavClick('generator')}
              className={`transition-colors whitespace-nowrap py-1 cursor-pointer ${
                activeTab === 'generator'
                  ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              Generator
            </button>
            <button
              onClick={() => handleNavClick('plan')}
              className={`transition-colors whitespace-nowrap flex items-center gap-1.5 py-1 cursor-pointer ${
                activeTab === 'plan'
                  ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <span>Workout Plan</span>
              {hasActivePlan && (
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => handleNavClick('admin')}
              className={`transition-colors whitespace-nowrap flex items-center gap-1.5 py-1 cursor-pointer ${
                activeTab === 'admin'
                  ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Admin &amp; SQLite</span>
            </button>
            <button
              onClick={() => handleNavClick('api')}
              className={`transition-colors whitespace-nowrap flex items-center gap-1.5 py-1 cursor-pointer ${
                activeTab === 'api'
                  ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <Terminal className="h-4 w-4" />
              <span>API</span>
            </button>
          </nav>

          {/* Action Triggers */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Live Voice Coach trigger (gemini-3.8-live) */}
            <button
              onClick={onOpenLiveCoach}
              title="Real-time Live Audio Coach (gemini-3.8-live)"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-all cursor-pointer shadow-sm min-h-[36px]"
            >
              <Mic className="h-3.5 w-3.5 text-amber-400 animate-pulse shrink-0" />
              <span className="hidden sm:inline">Live Coach</span>
            </button>

            {/* Sports Science Research Grounding trigger */}
            <button
              onClick={onOpenSearchGrounding}
              title="Sports Science Research Grounding (Gemini Flash)"
              className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 hover:text-white transition-all cursor-pointer min-h-[36px]"
            >
              <Globe className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span className="hidden lg:inline">Research</span>
            </button>

            {/* Create Plan Button */}
            <button
              onClick={onNewPlan}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-sm whitespace-nowrap cursor-pointer min-h-[36px]"
            >
              <PlusCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Create</span>
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-[#0c111a] px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              <button
                onClick={() => handleNavClick('generator')}
                className={`p-3 rounded-lg text-left flex items-center gap-2 ${
                  activeTab === 'generator'
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-[#141b2b] text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Dumbbell className="h-4 w-4" />
                <span>Generator</span>
              </button>
              <button
                onClick={() => handleNavClick('plan')}
                className={`p-3 rounded-lg text-left flex items-center gap-2 ${
                  activeTab === 'plan'
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-[#141b2b] text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Activity className="h-4 w-4" />
                <span>Workout Plan</span>
              </button>
              <button
                onClick={() => handleNavClick('admin')}
                className={`p-3 rounded-lg text-left flex items-center gap-2 ${
                  activeTab === 'admin'
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-[#141b2b] text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Admin &amp; SQLite</span>
              </button>
              <button
                onClick={() => handleNavClick('api')}
                className={`p-3 rounded-lg text-left flex items-center gap-2 ${
                  activeTab === 'api'
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-[#141b2b] text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Terminal className="h-4 w-4" />
                <span>API Docs</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  onOpenSearchGrounding();
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2 px-3 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center gap-1.5"
              >
                <Globe className="h-3.5 w-3.5 text-blue-400" />
                <span>Sports Research</span>
              </button>
              <button
                onClick={() => {
                  onOpenQuickDemo();
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2 px-3 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Sample Athletes</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Floating Bottom Quick Tab Bar for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-slate-800/90 bg-[#0a0e17]/95 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around text-[11px] shadow-2xl safe-area-bottom">
        <button
          onClick={() => setActiveTab('generator')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors cursor-pointer min-h-[44px] ${
            activeTab === 'generator' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Dumbbell className="h-4 w-4 mb-0.5" />
          <span>Generator</span>
        </button>

        <button
          onClick={() => setActiveTab('plan')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors cursor-pointer relative min-h-[44px] ${
            activeTab === 'plan' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <div className="relative">
            <Activity className="h-4 w-4 mb-0.5" />
            {hasActivePlan && (
              <span className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </div>
          <span>Plan</span>
        </button>

        <button
          onClick={onOpenLiveCoach}
          className="flex flex-col items-center justify-center py-1 px-3 text-amber-400 font-bold rounded-lg cursor-pointer min-h-[44px]"
        >
          <div className="h-6 w-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20 mb-0.5">
            <Mic className="h-3.5 w-3.5" />
          </div>
          <span className="text-[10px]">Coach</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors cursor-pointer min-h-[44px] ${
            activeTab === 'admin' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Users className="h-4 w-4 mb-0.5" />
          <span>Admin</span>
        </button>

        <button
          onClick={() => setActiveTab('api')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors cursor-pointer min-h-[44px] ${
            activeTab === 'api' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Terminal className="h-4 w-4 mb-0.5" />
          <span>API</span>
        </button>
      </nav>
    </>
  );
};
