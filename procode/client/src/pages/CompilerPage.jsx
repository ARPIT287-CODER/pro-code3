import React, { useState, useEffect } from 'react';
import { Play, Save, Folder, FolderPlus, Trash2, Copy, Check, RotateCcw, Terminal, FileCode2, Clock, CheckCircle2, AlertCircle, ChevronRight, Search, Plus, X } from 'lucide-react';

const STARTER_CODE = {
  c: `#include <stdio.h>

int main() {
    printf("Hello from C!\\n");
    return 0;
}`,
  cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    cout << "Hello from C++!" << endl;
    return 0;
}`,
  java: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
    }
}`,
  python: `# Write your Python code here
name = input() if False else "Student"
print(f"Hello, {name} from Python!")`
};

export default function CompilerPage({ user, onOpenAuth }) {
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState(STARTER_CODE.cpp);
  const [customInput, setCustomInput] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('');
  const [runtime, setRuntime] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  // Folder & Saved Snippets
  const [savedCodes, setSavedCodes] = useState([]);
  const [folders, setFolders] = useState(['General']);
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [snippetTitle, setSnippetTitle] = useState('');
  const [saveTargetFolder, setSaveTargetFolder] = useState('General');
  const [isCustomFolder, setIsCustomFolder] = useState(false);
  const [customFolderName, setCustomFolderName] = useState('');
  const [activeSnippetId, setActiveSnippetId] = useState(null);
  const [searchSnippet, setSearchSnippet] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  async function fetchFolders() {
    try {
      const token = localStorage.getItem('procode_token');
      const res = await fetch('/api/compiler/folders', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.folders) && data.folders.length > 0) {
          setFolders(data.folders);
        }
      }
    } catch (err) {
      console.error('Failed to load folders', err);
    }
  }

  async function fetchSavedCodes() {
    try {
      const token = localStorage.getItem('procode_token');
      const res = await fetch('/api/compiler/saved', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.savedCodes || [];
        setSavedCodes(list);
      }
    } catch (err) {
      console.error('Failed to load saved codes', err);
    }
  }

  useEffect(() => {
    fetchFolders();
    fetchSavedCodes();
  }, [user]);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    // If not modified drastically, set starter
    if (!code || code === STARTER_CODE.c || code === STARTER_CODE.cpp || code === STARTER_CODE.java || code === STARTER_CODE.python) {
      setCode(STARTER_CODE[newLang] || '');
    }
  };

  const handleRun = async () => {
    if (!code.trim()) {
      setOutput('Error: Code is empty.');
      return;
    }

    setIsRunning(true);
    setOutput('Compiling and executing your code...');
    setStatus('Running...');

    try {
      const token = localStorage.getItem('procode_token');
      const res = await fetch('/api/compiler/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          language,
          code,
          customInput
        })
      });

      const data = await res.json();
      setOutput(data.output || data.error || '(No output returned)');
      setStatus(data.status || (data.success ? 'Success' : 'Failed'));
      setRuntime(data.runtime !== undefined ? data.runtime : null);
    } catch (err) {
      setOutput('Execution failed: Unable to connect to server.');
      setStatus('Error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleCreateFolder = async (folderNameToAdd) => {
    const name = (folderNameToAdd || newFolderName).trim();
    if (!name) return null;

    try {
      const token = localStorage.getItem('procode_token');
      const res = await fetch('/api/compiler/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.folders) setFolders(data.folders);
        setSelectedFolder(name);
        setSaveTargetFolder(name);
        setNewFolderName('');
        setShowNewFolderInput(false);
        showToast(`Folder "${name}" created!`);
        return name;
      }
    } catch (err) {
      console.error('Failed to create folder', err);
      if (!folders.includes(name)) {
        setFolders(prev => [...prev, name]);
      }
      setSelectedFolder(name);
      setSaveTargetFolder(name);
      setNewFolderName('');
      setShowNewFolderInput(false);
      showToast(`Folder "${name}" created!`);
      return name;
    }
    return null;
  };

  const handleDeleteFolder = async (folderName, e) => {
    e.stopPropagation();
    if (folderName === 'General') {
      showToast('The "General" folder is default and cannot be deleted.');
      return;
    }
    if (!window.confirm(`Delete folder "${folderName}"? Any code files inside will be moved to "General".`)) {
      return;
    }

    try {
      const token = localStorage.getItem('procode_token');
      const res = await fetch(`/api/compiler/folders/${encodeURIComponent(folderName)}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.folders) setFolders(data.folders);
        else setFolders(prev => prev.filter(f => f !== folderName));
        if (selectedFolder === folderName) setSelectedFolder('All');
        if (saveTargetFolder === folderName) setSaveTargetFolder('General');
        showToast(`Folder "${folderName}" deleted`);
        fetchSavedCodes();
      }
    } catch (err) {
      console.error('Failed to delete folder', err);
      setFolders(prev => prev.filter(f => f !== folderName));
      if (selectedFolder === folderName) setSelectedFolder('All');
      if (saveTargetFolder === folderName) setSaveTargetFolder('General');
    }
  };

  const handleSaveCode = async (e) => {
    e.preventDefault();
    if (!snippetTitle.trim()) return;

    let targetFolder = saveTargetFolder;
    if (isCustomFolder && customFolderName.trim()) {
      targetFolder = customFolderName.trim();
      await handleCreateFolder(targetFolder);
    }

    try {
      const token = localStorage.getItem('procode_token');
      const payload = {
        title: snippetTitle.trim(),
        folder: targetFolder || 'General',
        language,
        code
      };

      if (activeSnippetId) {
        // Update existing
        const res = await fetch(`/api/compiler/saved/${activeSnippetId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showToast(`Updated snippet in folder "${payload.folder}"`);
        }
      } else {
        // Create new
        const res = await fetch('/api/compiler/saved', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          setActiveSnippetId(data.savedCode?._id || data.savedCode?.id);
          showToast(`Saved code to folder "${payload.folder}"`);
        }
      }

      setSaveModalOpen(false);
      setIsCustomFolder(false);
      setCustomFolderName('');
      fetchSavedCodes();
      fetchFolders();
    } catch (err) {
      console.error('Failed to save', err);
      alert('Error saving code');
    }
  };

  const handleLoadSnippet = (s) => {
    setCode(s.code);
    setLanguage(s.language || 'cpp');
    setSnippetTitle(s.title);
    setSaveTargetFolder(s.folder || 'General');
    setActiveSnippetId(s._id || s.id);
    showToast(`Loaded "${s.title}"`);
  };

  const handleDeleteSnippet = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this saved code snippet?')) return;
    try {
      const token = localStorage.getItem('procode_token');
      await fetch(`/api/compiler/saved/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (activeSnippetId === id) setActiveSnippetId(null);
      showToast('Deleted snippet');
      fetchSavedCodes();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredSnippets = savedCodes.filter(s => {
    const matchFolder = selectedFolder === 'All' || s.folder === selectedFolder;
    const matchSearch = !searchSnippet || s.title.toLowerCase().includes(searchSnippet.toLowerCase());
    return matchFolder && matchSearch;
  });

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-4">
      {/* Top Bar Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
            <Terminal size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Online Compiler &amp; Code Studio</h2>
            </div>
            <p className="text-xs text-slate-500">
              Write, compile, run code with custom inputs, and organize your work across custom folders.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (window.confirm('Reset editor to starter boilerplate?')) {
                setCode(STARTER_CODE[language] || '');
                setActiveSnippetId(null);
                setSnippetTitle('');
              }
            }}
            title="Reset boilerplate"
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            <RotateCcw size={15} />
          </button>

          <button
            onClick={handleCopyCode}
            title="Copy code"
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
          </button>

          <button
            onClick={() => {
              setSaveModalOpen(true);
              if (!snippetTitle) setSnippetTitle(`My ${language.toUpperCase()} Code`);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-sky-50 text-slate-700 border border-slate-200 hover:border-sky-300 rounded-xl text-xs font-semibold transition shadow-xs cursor-pointer"
          >
            <Save size={14} className="text-sky-500" />
            <span>{activeSnippetId ? 'Save As / Update' : 'Save to Folder'}</span>
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Play size={14} className={isRunning ? 'animate-spin' : 'fill-white'} />
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 size={15} className="text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Folders & Saved Codes Explorer (3 cols on desktop) */}
        <div className="lg:col-span-3 flex flex-col bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-xs max-h-[820px] overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Folder size={16} className="text-sky-500" />
              <span>My Folders &amp; Files</span>
            </div>
            <button
              onClick={() => setShowNewFolderInput(!showNewFolderInput)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-sky-600 hover:text-blue-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition cursor-pointer"
              title="Create new folder"
            >
              <Plus size={14} />
              <span>New Folder</span>
            </button>
          </div>

          {showNewFolderInput && (
            <form onSubmit={(e) => { e.preventDefault(); handleCreateFolder(); }} className="p-2.5 bg-slate-50 border border-sky-200 rounded-xl space-y-2 animate-in fade-in">
              <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <FolderPlus size={13} className="text-sky-600" />
                <span>Create New Custom Folder</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Graph Algorithms, Lab 3..."
                  className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNewFolderInput(false); setNewFolderName(''); }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg text-xs font-bold transition cursor-pointer"
                  title="Cancel"
                >
                  <X size={14} />
                </button>
              </div>
            </form>
          )}

          {/* Folder Chips */}
          <div className="flex flex-wrap gap-1.5 pb-1 max-h-[140px] overflow-y-auto">
            <button
              onClick={() => setSelectedFolder('All')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedFolder === 'All' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({savedCodes.length})
            </button>
            {folders.map(f => {
              const count = savedCodes.filter(s => s.folder === f).length;
              const isSelected = selectedFolder === f;
              return (
                <div
                  key={f}
                  onClick={() => setSelectedFolder(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 group ${
                    isSelected ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Folder size={11} className={isSelected ? 'text-white' : 'text-sky-500'} />
                  <span>{f}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-blue-700/80 text-white' : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    {count}
                  </span>
                  {f !== 'General' && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteFolder(f, e)}
                      title={`Delete folder "${f}"`}
                      className={`p-0.5 rounded transition ${
                        isSelected ? 'hover:bg-blue-700 text-blue-200 hover:text-white' : 'hover:bg-slate-300 text-slate-400 hover:text-rose-600'
                      }`}
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Search Snippet Input */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchSnippet}
              onChange={(e) => setSearchSnippet(e.target.value)}
              placeholder="Filter saved codes..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Snippets List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredSnippets.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl p-4 space-y-1">
                <FileCode2 size={24} className="mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600">No saved files</p>
                <p className="text-[11px]">Click "Save to Folder" to store your code snippets!</p>
              </div>
            ) : (
              filteredSnippets.map(s => {
                const isSelected = activeSnippetId === (s._id || s.id);
                return (
                  <div
                    key={s._id || s.id}
                    onClick={() => handleLoadSnippet(s)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer text-xs group flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-sky-50 border-sky-300 text-blue-900 shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="space-y-0.5 truncate">
                      <p className="font-bold truncate group-hover:text-blue-600">{s.title}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                        <span className="uppercase font-bold text-sky-700">{s.language}</span>
                        <span>&bull;</span>
                        <span className="truncate">{s.folder}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSnippet(s._id || s.id, e)}
                      title="Delete file"
                      className="p-1 text-slate-400 hover:text-rose-500 rounded transition shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center/Right Column: Code Editor & I/O Terminal (9 cols on desktop) */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          {/* Editor Card */}
          <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800">
              {/* Language Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Language:</span>
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                  {['c', 'cpp', 'java', 'python'].map(l => (
                    <button
                      key={l}
                      onClick={() => handleLanguageChange(l)}
                      className={`px-3 py-1 text-xs font-mono font-semibold rounded-lg uppercase transition cursor-pointer ${
                        language === l ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {l === 'cpp' ? 'C++' : l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs text-slate-400 font-mono">
                {activeSnippetId ? (
                  <span className="text-sky-400 font-semibold">{snippetTitle} ({saveTargetFolder})</span>
                ) : (
                  <span>main.{language === 'cpp' ? 'cpp' : language === 'c' ? 'c' : language === 'java' ? 'java' : 'py'}</span>
                )}
              </div>
            </div>

            {/* Code Input Area */}
            <div className="relative min-h-[360px] max-h-[500px]">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                placeholder="// Write your code here..."
                className="w-full h-full min-h-[360px] max-h-[500px] bg-slate-950 text-slate-100 p-4 font-mono text-xs sm:text-sm resize-y focus:outline-none leading-relaxed border-none selection:bg-blue-600/30"
              />
            </div>
          </div>

          {/* I/O Split Deck: Standard Input (stdin) & Output / Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Custom Input (stdin) */}
            <div className="flex flex-col bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">
                  Custom Input (stdin)
                </span>
                <span className="text-[10px] text-slate-400">Optional inputs for scanf / cin / input()</span>
              </div>
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                rows={4}
                placeholder="Enter input for your program here..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:border-sky-500 resize-none leading-relaxed"
              />
            </div>

            {/* Program Output Terminal */}
            <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200 uppercase font-mono tracking-wider">Output / Terminal</span>
                  {status && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      status === 'Success' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      {status}
                    </span>
                  )}
                </div>
                {runtime !== null && (
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock size={11} /> {runtime}ms
                  </span>
                )}
              </div>

              <pre className="flex-1 p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap min-h-[96px] max-h-[160px] leading-relaxed">
                {output || '// Run your program to see the output here...'}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Save Code Snippet Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderPlus size={18} className="text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Save Code to Folder</h3>
              </div>
              <button
                onClick={() => setSaveModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCode} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Snippet Title / File Name</label>
                <input
                  type="text"
                  required
                  value={snippetTitle}
                  onChange={(e) => setSnippetTitle(e.target.value)}
                  placeholder="e.g. Quick Sort Implementation"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 text-slate-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-bold">Folder of Your Choice</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomFolder(!isCustomFolder);
                      if (!isCustomFolder) setCustomFolderName('');
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>{isCustomFolder ? 'Choose Existing Folder' : '+ Create New Folder'}</span>
                  </button>
                </div>

                {isCustomFolder ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      autoFocus
                      required
                      value={customFolderName}
                      onChange={(e) => setCustomFolderName(e.target.value)}
                      placeholder="Type custom folder name (e.g. Graph Algorithms)..."
                      className="w-full px-3 py-2 bg-slate-50 border border-sky-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 text-slate-900"
                    />
                    <p className="text-[10px] text-slate-500">A new folder with this name will be created for your code.</p>
                  </div>
                ) : (
                  <select
                    value={saveTargetFolder}
                    onChange={(e) => setSaveTargetFolder(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 text-slate-900 cursor-pointer font-medium"
                  >
                    {folders.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSaveModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Save File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
