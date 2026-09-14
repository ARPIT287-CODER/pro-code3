import React, { useState, useEffect } from 'react';
import { ShieldCheck, PlusCircle, Trash2, Edit3, Search, X, Save, CheckCircle2, Sparkles, Award, Layers } from 'lucide-react';

export default function AdminPage({ initialEditingProblem, onClearInitialEditingProblem }) {
  const [stats, setStats] = useState({ totalUsers: 0, totalProblems: 0, totalReports: 0 });
  const [problems, setProblems] = useState([]);
  const [reports, setReports] = useState([]);
  const [topicsList, setTopicsList] = useState(['Arrays', 'Strings', 'Recursion', 'Searching', 'Sorting', 'Linked Lists', 'Stacks & Queues', 'Trees', 'Graphs', 'Dynamic Programming']);
  const [newTopicName, setNewTopicName] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('manage'); // 'manage', 'create', 'reports', 'topics'
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('All');
  const [feedback, setFeedback] = useState('');
  const [editingProblem, setEditingProblem] = useState(null);

  // Question Form State
  const [form, setForm] = useState({
    title: '', topic: 'Arrays', difficulty: 'Easy', points: 10,
    examUnit: 'Unit 1: Linear Data Structures',
    collegeExamReference: 'Mid-Sem 2024 (5 Marks)', description: '',
    constraints: '1 <= N <= 10^5', sampleInput: '', sampleOutput: '',
    hiddenInput: '', hiddenOutput: '', isGraduationProblem: false, leetcodeUrl: ''
  });

  const notify = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3500);
  };

  async function fetchData() {
    try {
      setLoading(true);
      const token = localStorage.getItem('procode_token');
      const h = token ? { 'Authorization': `Bearer ${token}` } : {};
      const [sRes, pRes, rRes, topRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: h }),
        fetch('/api/admin/problems', { headers: h }),
        fetch('/api/admin/reports', { headers: h }),
        fetch('/api/admin/topics', { headers: h })
      ]);

      if (sRes.ok) setStats(await sRes.json());
      if (pRes.ok) {
        const pData = await pRes.json();
        setProblems(pData.problems || []);
      }
      if (rRes.ok) {
        const rData = await rRes.json();
        setReports(rData.reports || []);
      }
      if (topRes.ok) {
        const topData = await topRes.json();
        if (topData.topics && Array.isArray(topData.topics)) {
          setTopicsList(topData.topics);
        }
      }
    } catch (e) {
      console.error('Failed to load admin data', e);
    } finally {
      setLoading(false);
    }
  }

  const handleAddTopic = async (e) => {
    e.preventDefault();
    const trimmed = newTopicName.trim();
    if (!trimmed) return;
    try {
      const token = localStorage.getItem('procode_token');
      const res = await fetch('/api/admin/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: trimmed })
      });
      const data = await res.json();
      if (res.ok) {
        notify(`Topic "${trimmed}" added!`);
        setNewTopicName('');
        if (data.topics && Array.isArray(data.topics)) {
          setTopicsList(data.topics);
        }
        fetchData();
      } else {
        alert(data.error || 'Failed to add topic');
      }
    } catch (err) {
      console.error('Failed to add topic', err);
      alert('Network error while adding topic');
    }
  };

  const handleDeleteTopic = async (topicName) => {
    if (!window.confirm(`Are you sure you want to remove topic "${topicName}"? Existing questions with this topic will remain until reclassified.`)) return;
    try {
      const token = localStorage.getItem('procode_token');
      const res = await fetch(`/api/admin/topics`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: topicName })
      });
      const data = await res.json();
      if (res.ok) {
        notify(`Topic "${topicName}" deleted.`);
        if (data.topics && Array.isArray(data.topics)) {
          setTopicsList(data.topics);
        } else {
          setTopicsList(prev => prev.filter(t => t.toLowerCase() !== topicName.toLowerCase()));
        }
        fetchData();
      } else {
        alert(data.error || 'Failed to delete topic');
      }
    } catch (err) {
      console.error('Failed to delete topic', err);
      alert('Network error while deleting topic');
    }
  };

  function handleOpenEditModal(problem) {
    const sample = (problem.sampleTestCases && problem.sampleTestCases[0]) || { input: '', expectedOutput: '' };
    const hidden = (problem.hiddenTestCases && problem.hiddenTestCases[0]) || { input: '', expectedOutput: '' };
    setEditingProblem({
      ...problem,
      sampleInput: sample.input || '',
      sampleOutput: sample.expectedOutput || '',
      hiddenInput: hidden.input || '',
      hiddenOutput: hidden.expectedOutput || ''
    });
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (initialEditingProblem) {
      handleOpenEditModal(initialEditingProblem);
      setActiveTab('manage');
    }
  }, [initialEditingProblem]);

  // --- PROBLEM HANDLERS ---
  const handleDeleteProblem = async (id, title) => {
    if (!window.confirm(`Permanently delete problem "${title}"?`)) return;
    const token = localStorage.getItem('procode_token');
    const res = await fetch(`/api/admin/problems/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      notify(`Deleted "${title}" successfully.`);
      fetchData();
    }
  };

  const handleCreateProblem = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('procode_token');
    const payload = {
      ...form,
      points: Number(form.points),
      sampleTestCases: [{ input: form.sampleInput, expectedOutput: form.sampleOutput, explanation: 'Sample derived test case' }],
      hiddenTestCases: [{ input: form.hiddenInput, expectedOutput: form.hiddenOutput }]
    };
    const res = await fetch('/api/admin/problems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      notify(`Question "${form.title}" added to curriculum!`);
      setForm({
        title: '', topic: 'Arrays', difficulty: 'Easy', points: 10,
        examUnit: 'Unit 1: Linear Data Structures',
        collegeExamReference: 'Mid-Sem 2024 (5 Marks)', description: '',
        constraints: '1 <= N <= 10^5', sampleInput: '', sampleOutput: '',
        hiddenInput: '', hiddenOutput: '', isGraduationProblem: false, leetcodeUrl: ''
      });
      fetchData();
      setActiveTab('manage');
    }
  };

  const handleSaveEditProblem = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('procode_token');
    const payload = {
      ...editingProblem,
      sampleTestCases: [{ input: editingProblem.sampleInput || '', expectedOutput: editingProblem.sampleOutput || '' }],
      hiddenTestCases: [{ input: editingProblem.hiddenInput || '', expectedOutput: editingProblem.hiddenOutput || '' }]
    };
    const res = await fetch(`/api/admin/problems/${editingProblem._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      notify(`Updated "${editingProblem.title}"!`);
      setEditingProblem(null);
      if (onClearInitialEditingProblem) onClearInitialEditingProblem();
      fetchData();
    }
  };

  const filtered = problems.filter(p => {
    if (topicFilter !== 'All' && p.topic !== topicFilter) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={13} className="text-sky-500" />
            <span>Host Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Curriculum Command Center</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Create questions, manage curriculum DSA topics, and review anti-cheat reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('create')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <PlusCircle size={14} /> + Add Question
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2 shadow-2xs animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Registered Students</span>
          <p className="text-xl font-black text-slate-900 font-mono">{stats.totalUsers || 0}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Curriculum Problems</span>
          <p className="text-xl font-black text-blue-600 font-mono">{problems.length}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Cheat Reports</span>
          <p className="text-xl font-black text-rose-500 font-mono">{reports.length}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap bg-white p-1.5 rounded-2xl border border-slate-200 gap-1 shadow-2xs">
        <button
          onClick={() => setActiveTab('manage')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all ${
            activeTab === 'manage' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:text-blue-600 hover:bg-sky-50'
          }`}
        >
          Questions ({problems.length})
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all ${
            activeTab === 'create' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:text-blue-600 hover:bg-sky-50'
          }`}
        >
          + Add Question
        </button>
        <button
          onClick={() => setActiveTab('topics')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 ${
            activeTab === 'topics' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:text-blue-600 hover:bg-sky-50'
          }`}
        >
          <Layers size={14} className={activeTab === 'topics' ? 'text-white' : 'text-sky-500'} />
          <span>DSA Topics ({topicsList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all ${
            activeTab === 'reports' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:text-blue-600 hover:bg-sky-50'
          }`}
        >
          Reports ({reports.length})
        </button>
      </div>

      {/* --- TAB 1: MANAGE QUESTIONS --- */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search question titles..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {['All', ...topicsList].map(t => (
                <button
                  key={t}
                  onClick={() => setTopicFilter(t)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                    topicFilter === t ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-sky-50 hover:text-sky-700 border border-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {filtered.map(p => (
              <div key={p._id} className="p-4 bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md hover:-translate-y-0.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs transition-all duration-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{p.title}</h3>
                    {p.isGraduationProblem && (
                      <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full font-bold">⭐ Solid Basics</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold text-slate-700">{p.topic}</span>
                    <span className="text-sky-600 font-bold">{p.difficulty} ({p.points} pts)</span>
                    {p.collegeExamReference && <span className="text-slate-600">🎓 {p.collegeExamReference}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenEditModal(p)}
                    className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProblem(p._id, p.title)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl cursor-pointer transition-all"
                    title="Delete question"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 2: CREATE QUESTION --- */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateProblem} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-2">Publish New Curriculum Question</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Problem Title</label>
              <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Detect Cycle in Linked List" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Topic</label>
              <select value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500">
                {topicsList.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Difficulty &amp; Points</label>
              <select value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value, points: e.target.value === 'Easy' ? 10 : e.target.value === 'Medium' ? 25 : 50})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500">
                <option value="Easy">Easy (10 pts)</option>
                <option value="Medium">Medium (25 pts)</option>
                <option value="Hard">Hard (50 pts)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">College Exam Citation</label>
              <input value={form.collegeExamReference} onChange={e => setForm({...form, collegeExamReference: e.target.value})} placeholder="e.g. Mid-Term Oct 2024 (Q2, 5 Marks)" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Constraints</label>
              <input value={form.constraints} onChange={e => setForm({...form, constraints: e.target.value})} placeholder="e.g. 1 <= N <= 10^5" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Problem Description</label>
            <textarea rows={3} required value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Explain problem specification clearly..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="text-xs font-bold text-sky-700">Sample Test Case (Visible to Students)</p>
              <input required value={form.sampleInput} onChange={e => setForm({...form, sampleInput: e.target.value})} placeholder="Input (stdin)..." className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-900 font-mono" />
              <input required value={form.sampleOutput} onChange={e => setForm({...form, sampleOutput: e.target.value})} placeholder="Expected Output..." className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-900 font-mono" />
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="text-xs font-bold text-slate-600">Hidden Test Case (Judge Scoring)</p>
              <input required value={form.hiddenInput} onChange={e => setForm({...form, hiddenInput: e.target.value})} placeholder="Hidden Input..." className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-900 font-mono" />
              <input required value={form.hiddenOutput} onChange={e => setForm({...form, hiddenOutput: e.target.value})} placeholder="Hidden Expected Output..." className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-900 font-mono" />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="cGrad" checked={form.isGraduationProblem} onChange={e => setForm({...form, isGraduationProblem: e.target.checked})} className="rounded text-sky-600" />
            <label htmlFor="cGrad" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Mark as Core Basics Mastery Problem (Strengthens student foundations)
            </label>
          </div>

          <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-sky-500/25 transition-all hover:scale-105 active:scale-95">
            Publish Question
          </button>
        </form>
      )}

      {/* --- TAB 3: CHEATING REPORTS --- */}
      {activeTab === 'reports' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-2">Student Cheating Reports</h3>
          {reports.length === 0 ? (
            <p className="text-xs text-slate-500">No cheating reports. All submissions are authentic!</p>
          ) : (
            reports.map(r => (
              <div key={r._id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-rose-600">Target: {r.targetUserName}</p>
                  <p className="text-xs text-slate-600">{r.reason}</p>
                </div>
                <span className="text-[10px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded">{r.status}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* --- TAB 8: MANAGE DSA TOPICS --- */}
      {activeTab === 'topics' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Layers size={14} className="text-sky-500" />
              <span>Curriculum Organization</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900">
              DSA Topics Management ({topicsList.length})
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              Add new Data Structures &amp; Algorithms topics or remove previous ones. Changes automatically sync to student problem lists and filters.
            </p>
          </div>

          {/* Add New Topic Form */}
          <form onSubmit={handleAddTopic} className="p-4 bg-sky-50/50 border border-sky-100 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                required
                placeholder="Enter new DSA topic name (e.g. Heaps, Dynamic Programming, Backtracking)..."
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-2xs"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <PlusCircle size={15} /> + Add DSA Topic
            </button>
          </form>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {topicsList.map((topic) => {
              const questionCount = problems.filter(p => p.topic && p.topic.toLowerCase() === topic.toLowerCase()).length;
              return (
                <div
                  key={topic}
                  className="bg-white border border-slate-200 hover:border-sky-300 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-2xs hover:shadow-md transition-all group"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">{topic}</h4>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {questionCount} {questionCount === 1 ? 'question' : 'questions'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteTopic(topic)}
                    className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl transition cursor-pointer"
                    title={`Delete topic "${topic}"`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EDIT QUESTION MODAL */}
      {editingProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="max-w-xl w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 size={16} className="text-sky-500" /> Edit: {editingProblem.title}
              </h3>
              <button onClick={() => setEditingProblem(null)} className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveEditProblem} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                  <input required value={editingProblem.title} onChange={e => setEditingProblem({...editingProblem, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:border-sky-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Topic</label>
                  <select value={editingProblem.topic} onChange={e => setEditingProblem({...editingProblem, topic: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:border-sky-500">
                    {topicsList.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Difficulty &amp; Points</label>
                  <select value={editingProblem.difficulty} onChange={e => setEditingProblem({...editingProblem, difficulty: e.target.value, points: e.target.value === 'Easy' ? 10 : e.target.value === 'Medium' ? 25 : 50})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:border-sky-500">
                    <option value="Easy">Easy (10 pts)</option>
                    <option value="Medium">Medium (25 pts)</option>
                    <option value="Hard">Hard (50 pts)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Exam Citation</label>
                  <input value={editingProblem.collegeExamReference || ''} onChange={e => setEditingProblem({...editingProblem, collegeExamReference: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:border-sky-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Constraints</label>
                <input value={editingProblem.constraints || ''} onChange={e => setEditingProblem({...editingProblem, constraints: e.target.value})} placeholder="e.g. 1 <= N <= 10^5" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:border-sky-500" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Problem Description</label>
                <textarea rows={3} required value={editingProblem.description} onChange={e => setEditingProblem({...editingProblem, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:border-sky-500" />
              </div>

              {/* Sample Test Case */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">Sample Test Case (Visible to Students)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Input</label>
                    <textarea rows={2} value={editingProblem.sampleInput || ''} onChange={e => setEditingProblem({...editingProblem, sampleInput: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Expected Output</label>
                    <textarea rows={2} value={editingProblem.sampleOutput || ''} onChange={e => setEditingProblem({...editingProblem, sampleOutput: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 font-mono" />
                  </div>
                </div>
              </div>

              {/* Hidden Test Case */}
              <div className="p-3 bg-slate-50 rounded-xl border border-rose-200 space-y-2">
                <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">Hidden Test Case (Judge Scoring - Protected)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Hidden Input</label>
                    <textarea rows={2} value={editingProblem.hiddenInput || ''} onChange={e => setEditingProblem({...editingProblem, hiddenInput: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Hidden Expected Output</label>
                    <textarea rows={2} value={editingProblem.hiddenOutput || ''} onChange={e => setEditingProblem({...editingProblem, hiddenOutput: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 font-mono" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="eGrad" checked={Boolean(editingProblem.isGraduationProblem)} onChange={e => setEditingProblem({...editingProblem, isGraduationProblem: e.target.checked})} />
                <label htmlFor="eGrad" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Mark as Core Basics Mastery Problem (Builds Solid Fundamentals)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => { setEditingProblem(null); if (onClearInitialEditingProblem) onClearInitialEditingProblem(); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-sky-500/20 transition-all hover:scale-105 active:scale-95">
                  <Save size={14} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
