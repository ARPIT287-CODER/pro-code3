import React, { useState, useEffect } from 'react';
import { Terminal, CheckCircle2, Circle, Award, Search, ChevronRight, Layers, ShieldCheck, Edit3, ShieldAlert, Sparkles } from 'lucide-react';
import TierBadge from '../components/TierBadge';
import AvatarFrame from '../components/AvatarFrame';

export default function ProblemLadder({ onSelectProblem, user, onOpenAuth, onOpenHostLogin, onEditProblem }) {
  const [problems, setProblems] = useState([]);
  const [topics, setTopics] = useState(['All', 'Arrays', 'Strings', 'Recursion', 'Searching', 'Sorting', 'Linked Lists', 'Stacks & Queues', 'Trees', 'Graphs', 'Dynamic Programming']);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Animated dynamic headline typewriter effect
  const phrases = [
    'make your fundamentals rock-solid.',
    'crack semester coding exams with ease.',
    'master pointers, trees & recursion step-by-step.',
    'turn you into a confident top-tier coder.',
    'build unshakeable problem-solving skills.'
  ];
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    let timer;

    if (!isDeleting && displayText === currentPhrase) {
      timer = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayText === '') {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    } else {
      const speed = isDeleting ? 30 : 55;
      timer = setTimeout(() => {
        setDisplayText(
          isDeleting
            ? currentPhrase.substring(0, displayText.length - 1)
            : currentPhrase.substring(0, displayText.length + 1)
        );
      }, speed);
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, phraseIndex]);

  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  async function fetchProblems() {
    try {
      setLoading(true);
      const token = localStorage.getItem('procode_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const [pRes, tRes] = await Promise.all([
        fetch('/api/problems', { headers }),
        fetch('/api/topics')
      ]);
      if (pRes.ok) {
        const data = await pRes.json();
        setProblems(data.problems || []);
      }
      if (tRes.ok) {
        const ct = tRes.headers.get('content-type');
        if (ct && ct.includes('application/json')) {
          const tData = await tRes.json();
          if (tData.topics && Array.isArray(tData.topics)) {
            setTopics(['All', ...tData.topics]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load problems or topics', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProblems();
  }, [user]);

  const filteredProblems = problems.filter(p => {
    if (selectedTopic !== 'All' && p.topic.toLowerCase() !== selectedTopic.toLowerCase()) return false;
    if (selectedDifficulty !== 'All' && p.difficulty.toLowerCase() !== selectedDifficulty.toLowerCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchTopic = p.topic.toLowerCase().includes(q);
      const matchExam = p.collegeExamReference && p.collegeExamReference.toLowerCase().includes(q);
      if (!matchTitle && !matchTopic && !matchExam) return false;
    }
    return true;
  });

  const solvedCount = problems.filter(p => p.isSolved).length;
  const totalCount = problems.length || 1;
  const progressPercent = Math.round((solvedCount / totalCount) * 100);

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'Easy': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Medium': return 'text-sky-700 bg-sky-50 border-sky-200';
      case 'Hard': return 'text-blue-800 bg-blue-50 border-blue-200';
      default: return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-6">
      {/* Platform Aim Notice & Quick Access */}
      <div className="bg-gradient-to-r from-sky-50 via-white to-blue-50 border border-sky-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              {user?.role === 'admin' ? 'Host Command Active' : 'Aim of ProCode: Build Solid Core Basics'}
            </h4>
            <p className="text-[11px] text-slate-600">
              {user?.role === 'admin'
                ? 'Host permissions enabled. You can create questions and manage curriculum topics.'
                : 'This platform is built specifically to strengthen your fundamentals in C, C++, and DSA for college exams.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {user?.role === 'admin' ? (
            <button
              onClick={() => onEditProblem(null)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 size={13} />
              <span>Admin Console</span>
            </button>
          ) : (
            <button
              onClick={onOpenHostLogin}
              className="px-3.5 py-1.5 bg-white hover:bg-sky-50 text-slate-700 border border-slate-200 hover:border-sky-300 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <ShieldAlert size={14} className="text-sky-500" />
              <span>Host Console</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Banner with Modern White / Sky-Blue Aesthetic & Text Animation */}
      <div className="relative rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-9 overflow-hidden shadow-xs">
        {/* Animated ambient gradient glow orbs */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-88 h-88 bg-gradient-to-br from-sky-400/15 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-gradient-to-tr from-blue-400/10 to-sky-300/10 rounded-full blur-2xl pointer-events-none animate-float" />
        
        <div className="max-w-4xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200/80 text-sky-800 text-xs font-bold shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
            </span>
            <Terminal size={13} className="text-sky-600" />
            <span>Core Foundation DSA Training</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Build Rock-Solid Core DSA Basics.<br />
            <span className="inline-block mt-2 min-h-[44px] sm:min-h-[52px]">
              <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent animate-gradient-text">
                This site will {displayText}
              </span>
              <span className="inline-block w-[3px] h-7 sm:h-9 bg-sky-500 ml-1.5 translate-y-1 sm:translate-y-1.5 animate-cursor rounded-full shadow-xs" />
            </span>
          </h1>

          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-2xl">
            A dedicated platform designed to build strong programming foundations in C, C++, and core Data Structures. Master syllabus problem sets, semester exam questions, and memory concepts step-by-step with authentic test verification.
          </p>

          {/* Quick Stats Progress Bar */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  Problems Solved Progress
                </span>
                <span className="font-mono text-sky-700 font-bold">{solvedCount} of {totalCount} Solved ({progressPercent}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {user ? (
              <div className="flex items-center gap-3.5 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl">
                <AvatarFrame
                  avatar={user.avatar}
                  name={user.name}
                  points={user.careerPoints || 0}
                  size="sm"
                  showBadge
                />
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">{user.alias || user.name}</p>
                  <p className="text-[11px] font-black text-sky-600 font-mono">{user.careerPoints || 0} pts</p>
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white rounded-2xl font-bold text-xs shadow-md shadow-sky-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                Sign In to Save Progress <ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>


      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search problems, topics, or exam years..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition"
          />
        </div>

        {/* Topic Filters */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {topics.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                selectedTopic === t
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-slate-50 text-slate-600 hover:bg-sky-50 hover:text-sky-700 border border-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Difficulty Select */}
        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500 cursor-pointer"
        >
          {difficulties.map(d => (
            <option key={d} value={d}>{d === 'All' ? 'All Difficulties' : d}</option>
          ))}
        </select>
      </div>

      {/* Problem Ladder Listing */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-9 h-9 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium text-slate-500">Loading curriculum problems...</p>
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm">
          <Layers size={36} className="text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No Problems Match Criteria</h3>
          <p className="text-xs text-slate-500 mb-4">Try selecting another topic filter or clearing your search keywords.</p>
          <button
            onClick={() => { setSelectedTopic('All'); setSelectedDifficulty('All'); setSearchQuery(''); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-500 transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProblems.map((prob) => {
            const isSolved = prob.isSolved;
            return (
              <div
                key={prob._id}
                className={`bg-white border border-slate-200/90 hover:border-sky-400 hover:shadow-lg hover:-translate-y-0.5 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between transition-all duration-300 group ${
                  isSolved ? 'bg-emerald-50/20' : ''
                }`}
              >
                {/* Left Side: Solved Icon + Info */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="mt-1 sm:mt-0">
                    {isSolved ? (
                      <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                    ) : (
                      <Circle size={20} className="text-slate-300 shrink-0" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                        {prob.title}
                      </h3>

                      {/* Core Basics Mastery Tag */}
                      {prob.isGraduationProblem && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                          <Award size={11} className="text-sky-500" />
                          ⭐ Solid Basics Mastery
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                        {prob.topic}
                      </span>

                      {prob.collegeExamReference && (
                        <span className="text-slate-600 bg-sky-50/80 px-2 py-0.5 rounded-md border border-sky-100 text-[11px]">
                          🎓 {prob.collegeExamReference}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Difficulty, Points & Action */}
                <div className="mt-3 sm:mt-0 flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border font-mono ${getDifficultyColor(prob.difficulty)}`}>
                    {prob.difficulty}
                  </span>

                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    +{prob.points} pts
                  </span>

                  {user?.role === 'admin' && (
                    <button
                      onClick={() => onEditProblem(prob)}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer flex items-center gap-1"
                      title="Edit this question"
                    >
                      <Edit3 size={12} />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                  )}

                  <button
                    onClick={() => onSelectProblem(prob._id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-sky-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span>{isSolved ? 'Solve Again' : 'Solve Problem'}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
