import React, { useState, useEffect } from 'react';
import { CheckCircle2, Terminal, Edit3, Save } from 'lucide-react';
import TierBadge from '../components/TierBadge';
import AvatarFrame from '../components/AvatarFrame';
import ActivityHeatmap from '../components/ActivityHeatmap';
import { REGISTRATION_BRANCHES } from '../constants/branches';

export default function ProfilePage({ user, onUserUpdated, onSelectProblem }) {
  const [submissions, setSubmissions] = useState([]);
  const [solvedProblemsList, setSolvedProblemsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [alias, setAlias] = useState(user?.alias || '');
  const [batch, setBatch] = useState(user?.batch || 'CSE-1A');
  const [saveMessage, setSaveMessage] = useState('');

  async function fetchProfileData() {
    try {
      setLoading(true);
      const token = localStorage.getItem('procode_token');
      if (!token) return;

      const [subRes, probRes] = await Promise.all([
        fetch('/api/submissions/my', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/problems', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const subData = await subRes.json();
      const probData = await probRes.json();

      setSubmissions(subData.submissions || []);
      const solvedSet = new Set(user?.solvedProblems || []);
      const solvedProbs = (probData.problems || []).filter(p => solvedSet.has(p._id));
      setSolvedProblemsList(solvedProbs);
    } catch (err) {
      console.error('Failed to load profile data', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('procode_token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ alias, batch })
      });
      const data = await res.json();
      if (res.ok) {
        onUserUpdated(data.user);
        setIsEditing(false);
        setSaveMessage('Profile saved!');
        setTimeout(() => setSaveMessage(''), 2500);
      }
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  // Tier progression logic
  const currentTier = user?.rankTier || 'Bronze';
  const points = user?.careerPoints || 0;

  const nextTierThresholds = {
    Bronze: { next: 'Silver Knight', target: 100, prev: 0 },
    'Silver Knight': { next: 'Gold Coder', target: 250, prev: 100 },
    Silver: { next: 'Gold Coder', target: 250, prev: 100 },
    'Gold Coder': { next: 'Cosmic Grandmaster', target: 701, prev: 250 },
    Gold: { next: 'Cosmic Grandmaster', target: 701, prev: 250 },
    'Cosmic Grandmaster': { next: 'Supreme Legend', target: 701, prev: 701 }
  };

  const currentTierConfig = nextTierThresholds[currentTier] || nextTierThresholds.Bronze;
  const neededPoints = Math.max(0, currentTierConfig.target - points);
  const tierProgress = currentTier === 'Conqueror'
    ? 100
    : Math.min(100, Math.round(((points - currentTierConfig.prev) / (currentTierConfig.target - currentTierConfig.prev)) * 100));

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-8">
      {/* Profile Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <AvatarFrame
              avatar={user?.avatar}
              name={user?.name}
              points={user?.careerPoints || 0}
              size="lg"
              showBadge
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{user?.name}</h1>
                <TierBadge tier={user?.rankTier} size="xs" />
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Alias: <span className="text-blue-600 font-medium">{user?.alias || user?.name}</span> &bull; Batch: <span className="text-slate-800 font-semibold">{user?.batch}</span>
              </p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 transition cursor-pointer"
          >
            <Edit3 size={13} />
            <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
          </button>
        </div>

        {/* Edit Form Drawer */}
        {isEditing && (
          <form onSubmit={handleUpdateProfile} className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1 font-medium">Public Alias</label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1 font-medium">College Branch</label>
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white font-medium cursor-pointer"
              >
                {REGISTRATION_BRANCHES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition cursor-pointer shadow-xs"
              >
                <Save size={13} /> Save Profile Changes
              </button>
            </div>
          </form>
        )}

        {saveMessage && (
          <p className="text-xs text-emerald-600 font-medium mt-3">{saveMessage}</p>
        )}

        {/* Rank Tier Progression Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700">
              Tier Journey: <span className="text-blue-600">{currentTier}</span> &rarr; <span className="text-slate-800">{currentTierConfig.next}</span>
            </span>
            <span className="font-mono text-slate-500">
              {currentTier === 'Conqueror' ? 'Max Tier Reached' : `${neededPoints} pts to ${currentTierConfig.next}`}
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-sky-500 rounded-full transition-all duration-500"
              style={{ width: `${tierProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs hover:border-sky-300 hover:shadow-md transition">
          <p className="text-xs font-mono text-slate-500 uppercase">Career Points</p>
          <p className="text-2xl font-bold text-blue-600 font-mono mt-1">{points} pts</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Cumulative lifetime points</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs hover:border-sky-300 hover:shadow-md transition">
          <p className="text-xs font-mono text-slate-500 uppercase">Problems Solved</p>
          <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">
            {(user?.solvedProblems || []).length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Curriculum DSA ladder</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs hover:border-sky-300 hover:shadow-md transition">
          <p className="text-xs font-mono text-slate-500 uppercase">College Branch</p>
          <p className="text-2xl font-bold text-slate-800 font-mono mt-1">{user?.batch}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Section leaderboard member</p>
        </div>
      </div>

      {/* Daily Consistency & Activity Engine */}
      <ActivityHeatmap submissions={submissions} solvedProblems={solvedProblemsList} />

      {/* Solved Problems List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span>Solved Syllabus Problems</span>
        </div>

        {solvedProblemsList.length === 0 ? (
          <p className="text-xs text-slate-500">You haven't solved any problems yet. Start with the Arrays unit in the problem ladder!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {solvedProblemsList.map((prob) => (
              <div
                key={prob._id}
                onClick={() => onSelectProblem(prob._id)}
                className="p-3.5 bg-slate-50 border border-slate-200 hover:border-sky-300 hover:bg-sky-50/30 rounded-xl flex items-center justify-between cursor-pointer transition group"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">{prob.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{prob.topic} &bull; {prob.difficulty}</p>
                </div>
                <span className="text-xs font-mono font-bold text-blue-600">+{prob.points} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submission Logs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
          <Terminal size={18} className="text-blue-600" />
          <span>Recent Submissions</span>
        </div>

        {submissions.length === 0 ? (
          <p className="text-xs text-slate-500">No submissions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-slate-500 border-b border-slate-200 uppercase bg-slate-50">
                <tr>
                  <th className="py-2.5 px-3">Problem</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Language</th>
                  <th className="py-2.5 px-3">Runtime</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.slice(0, 10).map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 text-slate-800 font-semibold">{sub.problemTitle}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded font-bold ${sub.status === 'Accepted' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-rose-700 bg-rose-50 border border-rose-200'}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 uppercase">{sub.language}</td>
                    <td className="py-2.5 px-3 text-slate-600">{sub.runtime || 15} ms</td>
                    <td className="py-2.5 px-3 text-slate-500">{new Date(sub.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
