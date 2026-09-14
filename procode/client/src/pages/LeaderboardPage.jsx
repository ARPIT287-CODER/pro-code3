import React, { useState, useEffect } from 'react';
import { Trophy, Crown, ShieldAlert, CheckCircle2 } from 'lucide-react';
import TierBadge from '../components/TierBadge';
import AvatarFrame from '../components/AvatarFrame';
import { BRANCHES } from '../constants/branches';

export default function LeaderboardPage({ user, onOpenAuth }) {
  const [activeBoard, setActiveBoard] = useState('career'); // 'career', 'weekly', 'daily'
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCheatModal, setShowCheatModal] = useState(false);
  const [cheatReport, setCheatReport] = useState({ targetName: '', reason: '' });
  const [reportSuccess, setReportSuccess] = useState(false);

  const batches = BRANCHES;

  async function fetchLeaderboard() {
    try {
      setLoading(true);
      const res = await fetch(`/api/leaderboards/${activeBoard}?batch=${selectedBatch}`);
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.error('Failed to load leaderboard', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaderboard();
  }, [activeBoard, selectedBatch]);

  const handleReportCheatSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    try {
      const token = localStorage.getItem('procode_token');
      await fetch('/api/admin/report-cheat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetUserName: cheatReport.targetName,
          reason: cheatReport.reason
        })
      });
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setShowCheatModal(false);
        setCheatReport({ targetName: '', reason: '' });
      }, 2500);
    } catch (err) {
      console.error('Failed to report', err);
    }
  };

  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-8">
      {/* Header */}
      <div className="relative rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 overflow-hidden shadow-xs hover:shadow-md transition-shadow">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-sky-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold uppercase tracking-wider">
              <Trophy size={13} className="text-sky-600" />
              <span>Real Names &bull; Real Competition</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">Batch &amp; Class Leaderboard</h1>
            <p className="text-slate-600 text-xs sm:text-sm max-w-xl">
              Compete directly with classmates in your section. Points awarded once per solved problem (no farming via re-solves).
            </p>
          </div>

          <button
            onClick={() => {
              if (!user) { onOpenAuth(); return; }
              setShowCheatModal(true);
            }}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 bg-rose-50 border border-rose-200 hover:border-rose-300 text-rose-700 rounded-xl text-xs font-semibold transition cursor-pointer hover:shadow-xs"
          >
            <ShieldAlert size={14} className="text-rose-600" />
            <span>Report Suspected Cheating</span>
          </button>
        </div>
      </div>

      {/* Tabs & Batch Selector Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        {/* Leaderboard Duration Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveBoard('career')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeBoard === 'career' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Career (Lifetime)
          </button>
          <button
            onClick={() => setActiveBoard('weekly')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeBoard === 'weekly' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Reset
          </button>
          <button
            onClick={() => setActiveBoard('daily')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeBoard === 'daily' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily (24h)
          </button>
        </div>

        {/* Section / Batch Select */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Batch Filter:</span>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:bg-white font-medium cursor-pointer"
          >
            {batches.map(b => (
              <option key={b} value={b}>{b === 'All' ? 'All College Batches' : b}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Computing live standings...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto shadow-xs">
          <Trophy size={40} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">No Standings Yet</h3>
          <p className="text-xs text-slate-500">Be the first in this batch to solve a problem and claim rank #1!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top 3 Podium (Visual Showcase) */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 items-end">
              {/* Rank 2 (Silver) */}
              {top3[1] && (
                <div className="order-2 sm:order-1 bg-white border border-slate-200 rounded-3xl p-5 text-center flex flex-col items-center justify-between relative shadow-md hover:border-sky-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-mono font-bold text-xs mb-3 shadow-xs">
                    #2
                  </div>
                  <AvatarFrame
                    avatar={top3[1].avatar}
                    name={top3[1].name}
                    points={top3[1].points}
                    size="lg"
                    className="mb-2"
                  />
                  <h3 className="font-bold text-slate-900 text-base truncate max-w-[180px]">{top3[1].alias || top3[1].name}</h3>
                  <span className="text-xs text-slate-500 font-mono">{top3[1].batch}</span>
                  <div className="my-2">
                    <TierBadge tier={top3[1].rankTier} size="xs" />
                  </div>
                  <p className="text-lg font-black text-blue-600 font-mono">{top3[1].points} pts</p>
                </div>
              )}

              {/* Rank 1 (Gold / Crown) */}
              {top3[0] && (
                <div className="order-1 sm:order-2 bg-gradient-to-b from-amber-50/60 via-white to-white border-2 border-amber-400 rounded-3xl p-6 text-center flex flex-col items-center justify-between relative shadow-xl scale-105 z-10 hover:-translate-y-1 transition-all duration-300 animate-float">
                  <div className="absolute -top-3.5 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-md shadow-amber-400/30">
                    <Crown size={14} className="fill-slate-950" /> #1 Champion
                  </div>
                  <AvatarFrame
                    avatar={top3[0].avatar}
                    name={top3[0].name}
                    points={top3[0].points}
                    size="xl"
                    className="mt-2 mb-2"
                  />
                  <h3 className="font-bold text-slate-900 text-lg truncate max-w-[200px]">{top3[0].alias || top3[0].name}</h3>
                  <span className="text-xs text-slate-500 font-mono">{top3[0].batch}</span>
                  <div className="my-2">
                    <TierBadge tier={top3[0].rankTier} size="sm" />
                  </div>
                  <p className="text-2xl font-black text-amber-600 font-mono">{top3[0].points} pts</p>
                </div>
              )}

              {/* Rank 3 (Bronze) */}
              {top3[2] && (
                <div className="order-3 bg-white border border-slate-200 rounded-3xl p-5 text-center flex flex-col items-center justify-between relative shadow-md hover:border-sky-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-300 flex items-center justify-center text-amber-700 font-mono font-bold text-xs mb-3 shadow-xs">
                    #3
                  </div>
                  <AvatarFrame
                    avatar={top3[2].avatar}
                    name={top3[2].name}
                    points={top3[2].points}
                    size="lg"
                    className="mb-2"
                  />
                  <h3 className="font-bold text-slate-900 text-base truncate max-w-[180px]">{top3[2].alias || top3[2].name}</h3>
                  <span className="text-xs text-slate-500 font-mono">{top3[2].batch}</span>
                  <div className="my-2">
                    <TierBadge tier={top3[2].rankTier} size="xs" />
                  </div>
                  <p className="text-lg font-black text-blue-600 font-mono">{top3[2].points} pts</p>
                </div>
              )}
            </div>
          )}

          {/* Full Standings Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 text-center w-16">Rank</th>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Class / Batch</th>
                    <th className="py-3.5 px-4">Rank Tier</th>
                    <th className="py-3.5 px-4 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaderboard.map((student) => (
                    <tr
                      key={student.userId}
                      className={`hover:bg-sky-50/50 transition ${
                        user && user._id === student.userId ? 'bg-sky-50 font-bold border-l-4 border-l-blue-600' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                        {student.rank === 1 ? '🥇' : student.rank === 2 ? '🥈' : student.rank === 3 ? '🥉' : `#${student.rank}`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <AvatarFrame
                            avatar={student.avatar}
                            name={student.name}
                            points={student.points}
                            size="xs"
                          />
                          <div>
                            <p className="font-bold text-slate-900 text-sm">
                              {student.alias || student.name}
                              {user && user._id === student.userId && (
                                <span className="ml-2 text-[10px] text-blue-700 font-mono uppercase bg-blue-100 px-1.5 py-0.5 rounded font-bold">You</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                          {student.batch}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <TierBadge tier={student.rankTier} size="xs" />
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-blue-600 text-sm">
                        {student.points} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Cheating Report Modal */}
      {showCheatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600 font-bold">
              <ShieldAlert size={20} />
              <h3 className="text-lg text-slate-900">Report Suspected Cheating</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Help keep ProCode fair. Reports are strictly confidential and reviewed by department faculty members.
            </p>

            {reportSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-750 text-xs font-semibold text-center space-y-1">
                <CheckCircle2 size={24} className="mx-auto text-emerald-600" />
                <p>Report Submitted Successfully!</p>
                <p className="text-slate-600 font-normal">Thank you for protecting batch integrity.</p>
              </div>
            ) : (
              <form onSubmit={handleReportCheatSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Student / Account Name or Alias</label>
                  <input
                    type="text"
                    required
                    value={cheatReport.targetName}
                    onChange={(e) => setCheatReport({ ...cheatReport, targetName: e.target.value })}
                    placeholder="e.g. CodeNinja99"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Reason / Suspicious Activity Details</label>
                  <textarea
                    rows={3}
                    required
                    value={cheatReport.reason}
                    onChange={(e) => setCheatReport({ ...cheatReport, reason: e.target.value })}
                    placeholder="e.g. Plagiarized identical code from another source, or rapid submissions..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCheatModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
