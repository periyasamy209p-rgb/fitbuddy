import React, { useState } from 'react';
import { Search, Globe, ExternalLink, X, Sparkles, BookOpen, AlertCircle } from 'lucide-react';

interface SearchGroundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

interface GroundingResponse {
  text: string;
  webSearchQueries?: string[];
  sources?: Array<{ title: string; url: string }>;
}

const PRESET_QUERIES = [
  'Optimal protein distribution per meal for muscle hypertrophy 2026',
  'Zone 2 cardio duration and lactate threshold adaptations',
  'Creatine monohydrate timing and hydration requirements',
  'Evidence-based hamstring rehab and Nordic curl progression',
];

export const SearchGroundingModal: React.FC<SearchGroundingModalProps> = ({
  isOpen,
  onClose,
  initialQuery = 'Optimal protein distribution per meal for muscle hypertrophy',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<GroundingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (qToSearch?: string) => {
    const activeQ = qToSearch || query;
    if (!activeQ.trim()) return;

    setIsSearching(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: activeQ.trim() }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch search-grounded response.');
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0f141f] border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl p-6 sm:p-7 space-y-5 my-8 relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
              <Globe className="h-4 w-4" />
              <span>RESEARCH GROUNDING · GEMINI FLASH</span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-0.5">
              Live Sports Science &amp; Nutrition Research
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ask any exercise physiology, technique, or nutrition question..."
                className="w-full bg-[#161d2d] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={isSearching}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer disabled:opacity-75"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Preset queries */}
          <div className="flex flex-wrap gap-1.5 text-[11px] pt-1">
            <span className="text-slate-400 self-center mr-1">Trending Topics:</span>
            {PRESET_QUERIES.map((pq, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(pq);
                  handleSearch(pq);
                }}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-amber-300 hover:bg-slate-700/80 border border-slate-700/80 transition-colors cursor-pointer"
              >
                {pq}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Results Container */}
        {isSearching ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 bg-[#080b11] rounded-xl border border-slate-800">
            <div className="h-6 w-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-300">
              Grounding sports science research and evidence via Gemini Flash...
            </span>
          </div>
        ) : result ? (
          <div className="space-y-4">
            {/* Search Queries Used */}
            {result.webSearchQueries && result.webSearchQueries.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-400 text-[11px] font-semibold">Google Search Queries:</span>
                {result.webSearchQueries.map((sq, i) => (
                  <span
                    key={i}
                    className="font-mono text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
                  >
                    &ldquo;{sq}&rdquo;
                  </span>
                ))}
              </div>
            )}

            {/* Answer Content */}
            <div className="bg-[#080b11] border border-slate-800 rounded-xl p-5 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap max-h-[380px] overflow-y-auto">
              {result.text}
            </div>

            {/* Citations & Sources */}
            {result.sources && result.sources.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                  <span>Grounding Sources &amp; Citations ({result.sources.length}):</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.sources.map((src, i) => (
                    <a
                      key={i}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-lg bg-[#141b2b] border border-slate-800 hover:border-amber-400/80 hover:bg-[#182135] transition-all flex items-center justify-between text-xs group"
                    >
                      <span className="text-slate-300 group-hover:text-amber-300 truncate pr-2">
                        {src.title}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-amber-400 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500 bg-[#080b11] rounded-xl border border-slate-800">
            Type any athletic or nutrition question to search live sports science.
          </div>
        )}
      </div>
    </div>
  );
};
