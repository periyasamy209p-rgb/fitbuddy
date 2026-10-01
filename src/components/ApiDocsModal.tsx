import React, { useState } from 'react';
import { Terminal, Send, Check, Copy } from 'lucide-react';

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  description: string;
  sampleBody?: any;
  queryParams?: Record<string, string>;
}

const ENDPOINTS: ApiEndpoint[] = [
  {
    method: 'POST',
    path: '/api/generate-workout',
    description: 'Generates a 7-day personalized workout plan and nutrition tip, and saves user & plan records to SQLite and Firestore.',
    sampleBody: {
      username: 'Alex Morgan',
      user_id: 104,
      age: 26,
      weight: 71.5,
      goal: 'Endurance & Stamina',
      intensity: 'high',
      useSearchGrounding: true,
    },
  },
  {
    method: 'POST',
    path: '/api/submit-feedback',
    description: 'Revises existing workout plan based on user feedback prompt, updating the database record while preserving original.',
    sampleBody: {
      user_id: 101,
      feedback: 'Add more core exercises and 15 mins of yoga on rest days.',
    },
  },
  {
    method: 'POST',
    path: '/api/search-grounding',
    description: 'Performs live sports science and nutrition search grounding using gemini-3.5-flash and googleSearch.',
    sampleBody: {
      query: 'Protein intake timing for muscle growth',
    },
  },
  {
    method: 'GET',
    path: '/api/nutrition-tip',
    description: 'Fast lightweight nutrition or recovery recommendation via Gemini Flash.',
    queryParams: {
      goal: 'Muscle Gain',
      intensity: 'high',
    },
  },
  {
    method: 'GET',
    path: '/api/view-all-users',
    description: 'Returns all registered users, their original plans, updated plans, and feedback history.',
  },
];

export const ApiDocsModal: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(ENDPOINTS[0]);
  const [requestBodyInput, setRequestBodyInput] = useState<string>(
    JSON.stringify(ENDPOINTS[0].sampleBody || {}, null, 2)
  );
  const [queryInput, setQueryInput] = useState<string>('goal=Muscle Gain&intensity=high');
  const [responseOutput, setResponseOutput] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSelectEndpoint = (ep: ApiEndpoint) => {
    setSelectedEndpoint(ep);
    setRequestBodyInput(JSON.stringify(ep.sampleBody || {}, null, 2));
    if (ep.queryParams) {
      const q = new URLSearchParams(ep.queryParams).toString();
      setQueryInput(q);
    } else {
      setQueryInput('');
    }
    setResponseOutput(null);
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setResponseOutput(null);

    try {
      let url = selectedEndpoint.path;
      if (selectedEndpoint.method === 'GET' && queryInput.trim()) {
        url += `?${queryInput.trim()}`;
      }

      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: { 'Content-Type': 'application/json' },
      };

      if (selectedEndpoint.method === 'POST') {
        options.body = requestBodyInput;
      }

      const res = await fetch(url, options);
      const data = await res.json();
      setResponseOutput(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponseOutput(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsExecuting(false);
    }
  };

  const copyCurl = () => {
    let curl = `curl -X ${selectedEndpoint.method} "http://localhost:3000${selectedEndpoint.path}${
      selectedEndpoint.method === 'GET' && queryInput ? `?${queryInput}` : ''
    }" \\\n+  -H "Authorization: Bearer YOUR_FITBUDDY_AUTH_TOKEN"`;
    if (selectedEndpoint.method === 'POST') {
      curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${requestBodyInput.replace(/\n/g, '')}'`;
    }
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#080b11] py-5 sm:py-8 px-3 sm:px-6 lg:px-8 pb-24 md:pb-12">
      <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="bg-[#0f141f] border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
            <Terminal className="h-4 w-4 shrink-0" />
            <span>INTERACTIVE REST API EXPLORER</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            FitBuddy API Endpoints &amp; Swagger Spec
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Live interactive documentation corresponding to routes.py and the backend server architecture.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* Endpoint List */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-xs font-semibold text-slate-400 block px-1">
              AVAILABLE ENDPOINTS
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {ENDPOINTS.map((ep, i) => {
                const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelectEndpoint(ep)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#141b2b] border-amber-400 text-white shadow-md'
                        : 'bg-[#0f141f] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          ep.method === 'POST'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {ep.method}
                      </span>
                      <span className="text-xs font-mono font-semibold truncate text-white">
                        {ep.path}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {ep.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tester Panel */}
          <div className="lg:col-span-8 bg-[#0f141f] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-slate-800 gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    selectedEndpoint.method === 'POST'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {selectedEndpoint.method}
                </span>
                <span className="font-mono text-xs sm:text-sm text-white font-semibold truncate">
                  {selectedEndpoint.path}
                </span>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={copyCurl}
                  className="px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer min-h-[34px]"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>Copy cURL</span>
                </button>
                <button
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-75 min-h-[34px]"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isExecuting ? 'Sending...' : 'Send'}</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              {selectedEndpoint.description}
            </p>

            {selectedEndpoint.method === 'GET' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Query String Parameters:
                </label>
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="key=value&key2=value2"
                  className="w-full bg-[#161d2d] border border-slate-700 rounded-lg px-3 py-2 text-base sm:text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 min-h-[40px]"
                />
              </div>
            )}

            {selectedEndpoint.method === 'POST' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Request Payload (JSON):
                </label>
                <textarea
                  rows={5}
                  value={requestBodyInput}
                  onChange={(e) => setRequestBodyInput(e.target.value)}
                  className="w-full bg-[#080b11] border border-slate-800 rounded-lg p-3 text-base sm:text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                HTTP Response:
              </label>
              <div className="bg-[#080b11] border border-slate-800 rounded-lg p-3 sm:p-4 min-h-[140px] max-h-[340px] overflow-y-auto">
                {isExecuting ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
                    <div className="h-3.5 w-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <span>Executing request through server...</span>
                  </div>
                ) : responseOutput ? (
                  <pre className="text-[11px] sm:text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {responseOutput}
                  </pre>
                ) : (
                  <div className="text-xs text-slate-500 italic py-4">
                    Click &ldquo;Send&rdquo; to test this endpoint.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
