import React from 'react';
import { Flame, Zap, Calendar, Target, CheckCircle2 } from 'lucide-react';

export default function ActivityHeatmap({ submissions = [], solvedProblems = [] }) {
  // Generate past 16 weeks (112 days)
  const daysToShow = 112;
  const now = new Date();
  
  // Aggregate submissions by YYYY-MM-DD
  const subMap = {};
  submissions.forEach(s => {
    if (s.createdAt) {
      const dateKey = s.createdAt.substring(0, 10);
      subMap[dateKey] = (subMap[dateKey] || 0) + 1;
    }
  });

  const days = [];
  for (let i = daysToShow - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().substring(0, 10);
    days.push({
      date: dateKey,
      count: subMap[dateKey] || 0,
      dayOfWeek: d.getDay(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      dayOfMonth: d.getDate()
    });
  }

  // Calculate Streak & Active Days
  const activeDaysCount = Object.keys(subMap).length;
  let currentStreak = 0;
  let checkDate = new Date(now);
  while (true) {
    const key = checkDate.toISOString().substring(0, 10);
    if (subMap[key]) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (currentStreak === 0) {
      // Check if yesterday had submissions
      checkDate.setDate(checkDate.getDate() - 1);
      const yKey = checkDate.toISOString().substring(0, 10);
      if (subMap[yKey]) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    } else {
      break;
    }
  }

  // Problem breakdown
  const easyCount = solvedProblems.filter(p => p.difficulty === 'Easy').length;
  const medCount = solvedProblems.filter(p => p.difficulty === 'Medium').length;
  const hardCount = solvedProblems.filter(p => p.difficulty === 'Hard').length;
  const totalSubmissions = submissions.length;
  const acceptedCount = submissions.filter(s => s.status === 'Accepted').length;
  const acceptanceRate = totalSubmissions > 0 ? Math.round((acceptedCount / totalSubmissions) * 100) : 100;

  const getColorClass = (count) => {
    if (count === 0) return 'bg-slate-100 hover:bg-slate-200 border-slate-200';
    if (count === 1) return 'bg-sky-200 hover:bg-sky-300 border-sky-300 text-sky-900';
    if (count === 2) return 'bg-blue-400 hover:bg-blue-500 border-blue-400 text-white';
    return 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white shadow-xs shadow-blue-500/20';
  };

  return (
    <div className="space-y-6">
      {/* 1. Consistency & Streak Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-xs hover:border-amber-300 hover:shadow-md transition">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
            <Flame size={20} className="fill-amber-400/20" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-slate-400">Current Streak</p>
            <p className="text-xl font-black text-slate-900 font-mono">{currentStreak > 0 ? `${currentStreak} Days` : '1 Day'}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-xs hover:border-blue-300 hover:shadow-md transition">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-slate-400">Active Days</p>
            <p className="text-xl font-black text-slate-900 font-mono">{Math.max(activeDaysCount, 1)} Days</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-xs hover:border-sky-300 hover:shadow-md transition">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
            <Zap size={20} />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-slate-400">Submissions</p>
            <p className="text-xl font-black text-slate-900 font-mono">{totalSubmissions}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-xs hover:border-emerald-300 hover:shadow-md transition">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Target size={20} />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-slate-400">Acceptance Rate</p>
            <p className="text-xl font-black text-emerald-600 font-mono">{acceptanceRate}%</p>
          </div>
        </div>
      </div>

      {/* 2. Activity Heatmap */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" />
              <span>Coding Activity &amp; Daily Consistency</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Every solved syllabus problem and test execution logged over the past 16 weeks.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded-xs bg-slate-100 border border-slate-200" />
            <div className="w-2.5 h-2.5 rounded-xs bg-sky-200 border border-sky-300" />
            <div className="w-2.5 h-2.5 rounded-xs bg-blue-400 border border-blue-400" />
            <div className="w-2.5 h-2.5 rounded-xs bg-blue-600 border border-blue-600" />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 p-1">
            {days.map((day, idx) => (
              <div
                key={idx}
                title={`${day.date}: ${day.count} submission(s)`}
                className={`w-3.5 h-3.5 rounded-xs border transition-transform hover:scale-125 cursor-pointer ${getColorClass(day.count)}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 3. Difficulty Breakdown Bars */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>Curriculum Mastery by Difficulty</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-emerald-700">Easy Problems</span>
              <span className="font-mono text-slate-800 font-bold">{easyCount} Solved</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (easyCount / 4) * 100)}%` }} />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-amber-700">Medium Problems</span>
              <span className="font-mono text-slate-800 font-bold">{medCount} Solved</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (medCount / 2) * 100)}%` }} />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-blue-700">Hard / Core Basics Mastery</span>
              <span className="font-mono text-slate-800 font-bold">{hardCount} Solved</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, (hardCount / 2) * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
