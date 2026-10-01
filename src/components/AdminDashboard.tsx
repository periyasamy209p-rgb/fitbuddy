import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Trash2,
  Eye,
  RefreshCw,
  GitCompare,
  X,
  Database,
  Download,
  Terminal,
  Play,
  CheckCircle2,
  Table,
  Layers,
  LayoutGrid,
  Shield
} from 'lucide-react';
import { AdminUserRecord } from '../types';

interface AdminDashboardProps {
  onSelectUserToView: (userId: number | string) => void;
  onRefreshTrigger?: () => void;
}

interface DbInfo {
  fileName: string;
  filePath: string;
  sizeBytes: number;
  engine: string;
  totalUsers: number;
  totalUpdatedPlans: number;
  schema: Array<{
    table: string;
    columns: string[];
  }>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onSelectUserToView,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'sqlite'>('users');
  const [viewStyle, setViewStyle] = useState<'cards' | 'table'>('table');
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [intensityFilter, setIntensityFilter] = useState<string>('all');
  const [selectedUserForComparison, setSelectedUserForComparison] = useState<AdminUserRecord | null>(null);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // SQLite Console state
  const [dbInfo, setDbInfo] = useState<DbInfo | null>(null);
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT id, name, age, weight, goal, intensity FROM users LIMIT 10;');
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [isExecutingSql, setIsExecutingSql] = useState(false);
  const [sqlError, setSqlError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/view-all-users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDbInfo = async () => {
    try {
      const res = await fetch('/api/database/info');
      if (res.ok) {
        const data = await res.json();
        setDbInfo(data);
      }
    } catch (err) {
      console.error('Failed fetching DB info:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDbInfo();
  }, []);

  const handleDeleteUser = async (userId: number | string) => {
    setDeletingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => String(u.id) !== String(userId)));
        setStatusMessage(`User ID #${userId} successfully deleted from SQLite database.`);
        setDeleteConfirmId(null);
        fetchDbInfo();
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed deleting user:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExecuteSql = async () => {
    setIsExecutingSql(true);
    setSqlError(null);
    setSqlResult(null);

    try {
      const res = await fetch('/api/database/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery }),
      });
      const data = await res.json();
      if (!data.success) {
        setSqlError(data.error || 'SQL execution failed');
      } else {
        setSqlResult(data.results);
        fetchUsers();
        fetchDbInfo();
      }
    } catch (err: any) {
      setSqlError(err.message || 'Network error executing SQL');
    } finally {
      setIsExecutingSql(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(u.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.goal.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIntensity =
      intensityFilter === 'all' || u.intensity.toLowerCase() === intensityFilter.toLowerCase();
    return matchesSearch && matchesIntensity;
  });

  return (
    <div className="min-h-screen bg-[#080b11] py-5 sm:py-8 px-3 sm:px-6 lg:px-8 pb-24 md:pb-12">
      <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f141f] border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
              <span>ROUTE: /view-all-users</span>
              <span className="text-slate-600">/</span>
              <span>DATABASE: fitbuddy.db &amp; Firestore</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Users className="h-6 w-6 text-amber-400 shrink-0" />
              <span>FitBuddy – All Users &amp; Plans</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Admin &amp; coach oversight dashboard to inspect athletes, monitor revisions, and audit database state.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Selector Tabs */}
            <div className="flex items-center p-1 bg-[#141b2b] rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setActiveSubTab('users')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 min-h-[32px] ${
                  activeSubTab === 'users'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Table className="h-3.5 w-3.5" />
                <span>Athletes</span>
              </button>
              <button
                onClick={() => {
                  setActiveSubTab('sqlite');
                  fetchDbInfo();
                }}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 min-h-[32px] ${
                  activeSubTab === 'sqlite'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Database className="h-3.5 w-3.5" />
                <span>SQLite DB</span>
              </button>
            </div>

            <button
              onClick={() => {
                fetchUsers();
                fetchDbInfo();
              }}
              disabled={isLoading}
              className="p-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Refresh Data"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Status notification */}
        {statusMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Tab 1: Users & Plans Table */}
        {activeSubTab === 'users' && (
          <div className="space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#0f141f] border border-slate-800 p-3.5 sm:p-4 rounded-xl text-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, ID, or goal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#161d2d] border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors min-h-[38px]"
                />
              </div>

              <div className="flex items-center justify-between md:justify-end gap-2">
                {/* Segmented intensity filter */}
                <div className="flex items-center gap-1 p-1 bg-[#141b2b] rounded-lg border border-slate-800 overflow-x-auto no-scrollbar">
                  {(['all', 'low', 'medium', 'high'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setIntensityFilter(lvl)}
                      className={`px-2.5 py-1 rounded capitalize transition-all cursor-pointer whitespace-nowrap min-h-[28px] ${
                        intensityFilter === lvl
                          ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {lvl === 'all' ? 'All' : lvl}
                    </button>
                  ))}
                </div>

                {/* View Style Switcher (Cards vs Table on Mobile/Tablet) */}
                <div className="flex items-center p-1 bg-[#141b2b] rounded-lg border border-slate-800">
                  <button
                    onClick={() => setViewStyle('cards')}
                    title="Card View"
                    className={`p-1.5 rounded transition-all cursor-pointer ${
                      viewStyle === 'cards' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setViewStyle('table')}
                    title="Table View"
                    className={`p-1.5 rounded transition-all cursor-pointer ${
                      viewStyle === 'table' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Table className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Cards View */}
            {viewStyle === 'cards' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {isLoading ? (
                  <div className="col-span-full py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      <span>Reading fitbuddy.db via SQLite engine...</span>
                    </div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-400">
                    No athletes found matching your search.
                  </div>
                ) : (
                  filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      className="bg-[#0f141f] border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-colors shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-amber-400">#{u.id}</span>
                            <span className="font-semibold text-white text-sm">{u.name}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {u.age} yrs · {u.weight} kg
                          </span>
                        </div>
                        <span
                          className={`text-xs font-semibold capitalize px-2 py-0.5 rounded ${
                            u.intensity === 'high'
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              : u.intensity === 'medium'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {u.intensity}
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <span className="text-slate-400 text-[11px] block">Goal:</span>
                        <p className="text-slate-200 font-medium line-clamp-1">{u.goal}</p>
                      </div>

                      <div className="text-[11px] text-slate-400 bg-[#080b11] p-2.5 rounded-lg border border-slate-800/80">
                        <span className="font-semibold text-slate-300 block mb-1">
                          Status: {u.updated_plan ? 'Updated (v2.0)' : 'Original (v1.0)'}
                        </span>
                        <p className="line-clamp-2 text-slate-400 font-mono text-[10px]">
                          {(u.updated_plan || u.original_plan).substring(0, 100)}...
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
                        {u.updated_plan && (
                          <button
                            onClick={() => setSelectedUserForComparison(u)}
                            className="px-2.5 py-1.5 text-xs text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 rounded-lg border border-amber-400/30 flex items-center gap-1 cursor-pointer min-h-[32px]"
                          >
                            <GitCompare className="h-3.5 w-3.5" />
                            <span>Compare</span>
                          </button>
                        )}
                        <button
                          onClick={() => onSelectUserToView(u.id)}
                          className="px-2.5 py-1.5 text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer min-h-[32px]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </button>
                        {deleteConfirmId === u.id ? (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={deletingId === u.id}
                            className="px-2.5 py-1.5 text-xs bg-rose-600 text-white font-bold rounded-lg cursor-pointer min-h-[32px]"
                          >
                            Confirm Delete
                          </button>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(u.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Structured Table View */
              <div className="bg-[#0f141f] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-[#121929] text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                        <th className="py-3.5 px-4">User ID</th>
                        <th className="py-3.5 px-4">Name</th>
                        <th className="py-3.5 px-4">Age</th>
                        <th className="py-3.5 px-4">Weight</th>
                        <th className="py-3.5 px-4">Goal</th>
                        <th className="py-3.5 px-4">Intensity</th>
                        <th className="py-3.5 px-4">Original Plan</th>
                        <th className="py-3.5 px-4">Updated Plan</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-xs">
                      {isLoading ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400">
                            <div className="inline-flex items-center gap-2">
                              <div className="h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                              <span>Reading fitbuddy.db via SQLite engine...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400">
                            No athletes found matching your search.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr
                            key={u.id}
                            className="hover:bg-[#141b2b]/60 transition-colors group"
                          >
                            <td className="py-3.5 px-4 font-mono font-semibold text-amber-400">
                              {u.id}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                              {u.name}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-300 tabular-nums">
                              {u.age}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-300 tabular-nums">
                              {u.weight}
                            </td>
                            <td className="py-3.5 px-4 text-slate-300 max-w-[160px] truncate" title={u.goal}>
                              {u.goal}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`font-semibold capitalize ${
                                  u.intensity === 'high'
                                    ? 'text-rose-400'
                                    : u.intensity === 'medium'
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {u.intensity}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 max-w-[180px]">
                              <pre className="font-mono text-[11px] text-slate-400 bg-[#080b11] p-1.5 rounded border border-slate-800/80 truncate block whitespace-nowrap overflow-hidden">
                                {u.original_plan.substring(0, 80)}...
                              </pre>
                            </td>
                            <td className="py-3.5 px-4 max-w-[180px]">
                              {u.updated_plan ? (
                                <pre className="font-mono text-[11px] text-emerald-300 bg-emerald-950/20 p-1.5 rounded border border-emerald-900/40 truncate block whitespace-nowrap overflow-hidden">
                                  {u.updated_plan.substring(0, 80)}...
                                </pre>
                              ) : (
                                <span className="text-[11px] text-slate-500 italic">
                                  Not updated
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {u.updated_plan && (
                                  <button
                                    onClick={() => setSelectedUserForComparison(u)}
                                    title="Compare Original vs Updated"
                                    className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                                  >
                                    <GitCompare className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => onSelectUserToView(u.id)}
                                  title="Open full interactive routine"
                                  className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                {deleteConfirmId === u.id ? (
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      onClick={() => handleDeleteUser(u.id)}
                                      disabled={deletingId === u.id}
                                      className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-500 cursor-pointer min-h-[28px]"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="p-1 text-slate-400 hover:text-white"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirmId(u.id)}
                                    title="Delete user record from SQLite"
                                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: SQLite Database Inspector & SQL Console */}
        {activeSubTab === 'sqlite' && (
          <div className="space-y-5 sm:space-y-6">
            {/* Database Metadata Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-xl bg-[#0f141f] border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">SQLite Database File</span>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="font-mono font-bold text-white text-sm">fitbuddy.db</span>
                </div>
                <span className="text-[11px] text-emerald-400 mt-1 block">Active on disk</span>
              </div>

              <div className="p-4 rounded-xl bg-[#0f141f] border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Database File Size</span>
                <span className="font-mono font-bold text-white text-base">
                  {dbInfo?.sizeBytes ? `${(dbInfo.sizeBytes / 1024).toFixed(1)} KB` : 'Dynamic'}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">Binary SQLite format</span>
              </div>

              <div className="p-4 rounded-xl bg-[#0f141f] border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Athletes &amp; Plans</span>
                <span className="font-mono font-bold text-amber-400 text-base">
                  {users.length} Users ({users.filter((u) => u.has_updated_plan).length} Updated)
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">SQLAlchemy schema</span>
              </div>

              <div className="p-4 rounded-xl bg-[#0f141f] border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Download SQLite File</span>
                  <span className="text-xs text-slate-300">Open in DB Browser / SQLite</span>
                </div>
                <a
                  href="/api/database/download"
                  download="fitbuddy.db"
                  className="mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-lg border border-slate-700 transition-colors min-h-[36px]"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download fitbuddy.db</span>
                </a>
              </div>
            </div>

            {/* Schema Tables Explorer */}
            <div className="bg-[#0f141f] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-400 shrink-0" />
                <span>SQLite Database Schema (users, plans, feedback_history)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-[#141b2b] border border-slate-800 space-y-2">
                  <div className="font-bold text-amber-400 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span>TABLE: users</span>
                    <span className="text-[10px] text-slate-500 font-normal">Entity</span>
                  </div>
                  <ul className="space-y-1 text-slate-300 text-[11px]">
                    <li>id (TEXT PK)</li>
                    <li>name (TEXT)</li>
                    <li>age (INTEGER)</li>
                    <li>weight (REAL)</li>
                    <li>goal (TEXT)</li>
                    <li>intensity (TEXT)</li>
                    <li>schedule (INTEGER)</li>
                    <li>created_at (TEXT)</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-[#141b2b] border border-slate-800 space-y-2">
                  <div className="font-bold text-amber-400 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span>TABLE: plans</span>
                    <span className="text-[10px] text-slate-500 font-normal">Entity</span>
                  </div>
                  <ul className="space-y-1 text-slate-300 text-[11px]">
                    <li>user_id (TEXT PK, FK)</li>
                    <li>original_plan (TEXT)</li>
                    <li>updated_plan (TEXT)</li>
                    <li>nutrition_tip (TEXT)</li>
                    <li>created_at (TEXT)</li>
                    <li>updated_at (TEXT)</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-[#141b2b] border border-slate-800 space-y-2">
                  <div className="font-bold text-amber-400 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span>TABLE: feedback_history</span>
                    <span className="text-[10px] text-slate-500 font-normal">Entity</span>
                  </div>
                  <ul className="space-y-1 text-slate-300 text-[11px]">
                    <li>id (INTEGER PK AUTO)</li>
                    <li>user_id (TEXT FK)</li>
                    <li>feedback (TEXT)</li>
                    <li>timestamp (TEXT)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Interactive SQL Query Console */}
            <div className="bg-[#0f141f] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-amber-400 shrink-0" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                    Live SQL Query Console
                  </h3>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="text-slate-400 mr-1 self-center">Presets:</span>
                  <button
                    onClick={() => setSqlQuery('SELECT id, name, goal, intensity FROM users;')}
                    className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer min-h-[28px]"
                  >
                    Select Users
                  </button>
                  <button
                    onClick={() => setSqlQuery('SELECT user_id, updated_plan IS NOT NULL as has_update FROM plans;')}
                    className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer min-h-[28px]"
                  >
                    Select Plans
                  </button>
                  <button
                    onClick={() => setSqlQuery('SELECT * FROM feedback_history;')}
                    className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer min-h-[28px]"
                  >
                    Feedback History
                  </button>
                </div>
              </div>

              <div>
                <textarea
                  rows={3}
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="Enter SQL statement (e.g. SELECT * FROM users;)"
                  className="w-full bg-[#080b11] border border-slate-800 rounded-xl p-3 font-mono text-base sm:text-xs text-amber-300 focus:outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">
                  Runs directly on <code className="text-slate-400 font-mono">fitbuddy.db</code>
                </span>
                <button
                  onClick={handleExecuteSql}
                  disabled={isExecutingSql}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75 min-h-[38px]"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{isExecutingSql ? 'Executing...' : 'Run Query'}</span>
                </button>
              </div>

              {sqlError && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs font-mono">
                  {sqlError}
                </div>
              )}

              {sqlResult && sqlResult.length > 0 ? (
                <div className="border border-slate-800 rounded-xl overflow-hidden mt-3">
                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#141b2b] text-slate-400 border-b border-slate-800 whitespace-nowrap">
                        <tr>
                          {sqlResult[0].columns.map((col: string, i: number) => (
                            <th key={i} className="py-2 px-3">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {sqlResult[0].values.map((row: any[], rIdx: number) => (
                          <tr key={rIdx} className="hover:bg-slate-800/40">
                            {row.map((val: any, cIdx: number) => (
                              <td key={cIdx} className="py-2 px-3 text-slate-300 whitespace-nowrap">
                                {val !== null && val !== undefined ? String(val) : 'NULL'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : sqlResult && (
                <div className="p-3 text-xs text-slate-400 italic font-mono bg-[#080b11] rounded-lg">
                  Query executed successfully. 0 rows returned.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Side-by-Side Comparison Modal - Responsive vertical stack on mobile */}
        {selectedUserForComparison && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
            <div className="bg-[#0f141f] border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl p-4 sm:p-7 space-y-4 sm:space-y-5 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                    <GitCompare className="h-4 w-4" />
                    <span>PLAN EVOLUTION</span>
                  </div>
                  <h2 className="text-base sm:text-xl font-bold text-white mt-1">
                    {selectedUserForComparison.name} (ID: {selectedUserForComparison.id})
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedUserForComparison(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {selectedUserForComparison.feedback_history?.length > 0 && (
                <div className="p-3 rounded-lg bg-[#141b2b] border border-slate-800 text-xs">
                  <span className="font-semibold text-amber-400">User Feedback Prompt:</span>{' '}
                  <span className="text-slate-200">
                    &ldquo;{selectedUserForComparison.feedback_history[selectedUserForComparison.feedback_history.length - 1].feedback}&rdquo;
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-1 border-b border-slate-800">
                    <span>Original Plan (Registration)</span>
                    <span className="font-mono text-slate-500">v1.0</span>
                  </div>
                  <pre className="font-mono text-xs text-slate-300 bg-[#080b11] p-3 sm:p-4 rounded-xl border border-slate-800 whitespace-pre-wrap leading-relaxed max-h-[350px] sm:max-h-[450px] overflow-y-auto">
                    {selectedUserForComparison.original_plan}
                  </pre>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400 pb-1 border-b border-slate-800">
                    <span>Updated Plan (AI Feedback Revisions)</span>
                    <span className="font-mono text-emerald-500">v2.0 (Active)</span>
                  </div>
                  <pre className="font-mono text-xs text-emerald-200 bg-emerald-950/20 p-3 sm:p-4 rounded-xl border border-emerald-900/50 whitespace-pre-wrap leading-relaxed max-h-[350px] sm:max-h-[450px] overflow-y-auto">
                    {selectedUserForComparison.updated_plan || 'No revisions made yet.'}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-800">
                <button
                  onClick={() => setSelectedUserForComparison(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer min-h-[38px]"
                >
                  Close Comparison
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
