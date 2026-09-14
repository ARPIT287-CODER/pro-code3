const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { SavedCode, UserFolder } = require('../services/db');
const { optionalAuth, authenticateToken } = require('../middleware/auth');
const { submissionLimiter } = require('../middleware/rateLimiter');

const TEMP_DIR = path.join(__dirname, '..', 'data', 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// 1. Run custom standalone code (like CodeChef / Programiz)
router.post('/run', submissionLimiter, async (req, res) => {
  const { language = 'cpp', code = '', customInput = '' } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: 'Code cannot be empty.' });
  }

  const lang = language.toLowerCase();
  const fileId = 'exec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const startTime = Date.now();

  const cleanup = (files) => {
    files.forEach((f) => {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch (_) {}
    });
  };

  const runProcess = (cmd, args, inputStr, timeoutMs = 7000) => {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const proc = spawn(cmd, args, { cwd: TEMP_DIR, shell: false });

      const timer = setTimeout(() => {
        timedOut = true;
        try {
          proc.kill('SIGKILL');
        } catch (_) {}
      }, timeoutMs);

      if (inputStr) {
        try {
          proc.stdin.write(inputStr);
          proc.stdin.end();
        } catch (_) {}
      } else {
        try {
          proc.stdin.end();
        } catch (_) {}
      }

      proc.stdout.on('data', (d) => {
        stdout += d.toString();
      });
      proc.stderr.on('data', (d) => {
        stderr += d.toString();
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        resolve({ stdout, stderr: err.message, code: 1, timedOut: false });
      });

      proc.on('close', (code) => {
        clearTimeout(timer);
        resolve({ stdout, stderr, code, timedOut });
      });
    });
  };

  try {
    if (lang === 'c' || lang === 'cpp') {
      const isCpp = lang === 'cpp';
      const srcFile = path.join(TEMP_DIR, `${fileId}.${isCpp ? 'cpp' : 'c'}`);
      const exeFile = path.join(TEMP_DIR, `${fileId}.exe`);

      fs.writeFileSync(srcFile, code, 'utf-8');

      const compiler = isCpp ? 'g++' : 'gcc';
      const compileArgs = [srcFile, '-o', exeFile, '-O2'];
      if (isCpp) compileArgs.push('-std=c++17');

      const compileResult = await runProcess(compiler, compileArgs, '', 8000);

      if (compileResult.code !== 0 || !fs.existsSync(exeFile)) {
        cleanup([srcFile, exeFile]);
        return res.json({
          success: false,
          status: 'Compilation Error',
          output: compileResult.stderr || compileResult.stdout || 'Compilation failed.',
          runtime: Date.now() - startTime
        });
      }

      const execResult = await runProcess(exeFile, [], customInput, 7000);
      cleanup([srcFile, exeFile]);

      if (execResult.timedOut) {
        return res.json({
          success: false,
          status: 'Time Limit Exceeded (7s)',
          output: 'Process timed out after 7.0 seconds. Possible infinite loop in your code.',
          runtime: 7000
        });
      }

      const totalTime = Date.now() - startTime;
      return res.json({
        success: execResult.code === 0,
        status: execResult.code === 0 ? 'Success' : 'Runtime Error',
        output: execResult.stdout || execResult.stderr || '(No output produced)',
        error: execResult.stderr || null,
        runtime: totalTime
      });
    }

    if (lang === 'python') {
      const srcFile = path.join(TEMP_DIR, `${fileId}.py`);
      fs.writeFileSync(srcFile, code, 'utf-8');

      let pyCmd = 'python';
      let execResult = await runProcess(pyCmd, [srcFile], customInput, 7000);

      if (execResult.stderr && execResult.stderr.includes('Python was not found')) {
        execResult = await runProcess('py', ['-3', srcFile], customInput, 7000);
      }

      cleanup([srcFile]);

      if (execResult.timedOut) {
        return res.json({
          success: false,
          status: 'Time Limit Exceeded (7s)',
          output: 'Python script timed out after 7 seconds.',
          runtime: 7000
        });
      }

      const totalTime = Date.now() - startTime;
      return res.json({
        success: execResult.code === 0,
        status: execResult.code === 0 ? 'Success' : 'Execution Output',
        output: execResult.stdout || execResult.stderr || '(No output produced)',
        error: execResult.stderr || null,
        runtime: totalTime
      });
    }

    if (lang === 'java') {
      const srcFile = path.join(TEMP_DIR, `Main_${fileId.replace(/[^a-zA-Z0-9]/g, '')}.java`);
      const className = `Main_${fileId.replace(/[^a-zA-Z0-9]/g, '')}`;
      let adjustedCode = code.replace(/public\s+class\s+\w+/, `public class ${className}`);
      fs.writeFileSync(srcFile, adjustedCode, 'utf-8');

      const compileRes = await runProcess('javac', [srcFile], '', 8000);
      if (compileRes.code !== 0) {
        cleanup([srcFile]);
        return res.json({
          success: false,
          status: 'Compilation Error',
          output: compileRes.stderr || 'Java compilation failed or JDK not found in PATH.',
          runtime: Date.now() - startTime
        });
      }

      const classFile = path.join(TEMP_DIR, `${className}.class`);
      const execRes = await runProcess('java', ['-cp', TEMP_DIR, className], customInput, 7000);
      cleanup([srcFile, classFile]);

      return res.json({
        success: execRes.code === 0,
        status: execRes.code === 0 ? 'Success' : 'Runtime Error',
        output: execRes.stdout || execRes.stderr || '(No output produced)',
        runtime: Date.now() - startTime
      });
    }

    // Default node / js
    const srcFile = path.join(TEMP_DIR, `${fileId}.js`);
    fs.writeFileSync(srcFile, code, 'utf-8');
    const execRes = await runProcess('node', [srcFile], customInput, 7000);
    cleanup([srcFile]);

    return res.json({
      success: execRes.code === 0,
      status: execRes.code === 0 ? 'Success' : 'Runtime Error',
      output: execRes.stdout || execRes.stderr || '(No output produced)',
      runtime: Date.now() - startTime
    });
  } catch (err) {
    console.error('Compiler execution failed:', err);
    return res.status(500).json({ error: 'Compiler execution failed: ' + err.message });
  }
});

// 2. Folder Management
router.get('/folders', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?._id || 'guest';
    const folderDocs = await UserFolder.find({ userId });
    let folders = folderDocs.map(f => f.name);

    // Also include any folders user used in their saved codes
    const saved = await SavedCode.find({ userId });
    saved.forEach(s => {
      if (s.folder && !folders.includes(s.folder)) {
        folders.push(s.folder);
      }
    });

    if (!folders.includes('General')) {
      folders.unshift('General');
    }

    res.json({ folders });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch folders.' });
  }
});

router.post('/folders', optionalAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Folder name is required.' });
    }
    const cleanName = name.trim().slice(0, 40);
    const userId = req.user?._id || 'guest';

    const existing = await UserFolder.findOne({ userId, name: cleanName });
    if (!existing) {
      await UserFolder.create({
        userId,
        name: cleanName,
        createdAt: new Date().toISOString()
      });
    }

    const all = await UserFolder.find({ userId });
    const saved = await SavedCode.find({ userId });
    const folderSet = new Set(['General', ...all.map(f => f.name), ...saved.map(s => s.folder).filter(Boolean)]);

    res.status(201).json({
      message: `Folder "${cleanName}" created!`,
      folder: cleanName,
      folders: Array.from(folderSet)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create folder.' });
  }
});

router.delete('/folders/:name', optionalAuth, async (req, res) => {
  try {
    const folderName = decodeURIComponent(req.params.name).trim();
    const userId = req.user?._id || 'guest';

    await UserFolder.deleteOne({ userId, name: folderName });

    // Move any snippets inside this folder to 'General' so user's code is not lost
    const userCodes = await SavedCode.find({ userId, folder: folderName });
    for (const codeItem of userCodes) {
      await SavedCode.findByIdAndUpdate(codeItem._id, { folder: 'General' });
    }

    const all = await UserFolder.find({ userId });
    const saved = await SavedCode.find({ userId });
    const folderSet = new Set(['General', ...all.map(f => f.name), ...saved.map(s => s.folder).filter(Boolean)]);
    folderSet.delete(folderName);
    if (!folderSet.has('General')) folderSet.add('General');

    res.json({
      message: `Folder "${folderName}" removed. Any snippets inside were moved to General.`,
      folders: Array.from(folderSet)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete folder.' });
  }
});

// 3. Saved Codes Management
router.get('/saved', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?._id || 'guest';
    const items = await SavedCode.find({ userId });
    items.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    res.json({ savedCodes: items });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch saved codes.' });
  }
});

router.post('/saved', optionalAuth, async (req, res) => {
  try {
    const { title, folder = 'General', language, code } = req.body;
    if (!title || !code) {
      return res.status(400).json({ error: 'Title and code are required.' });
    }

    const userId = req.user?._id || 'guest';
    const saved = await SavedCode.create({
      userId,
      title: title.trim(),
      folder: (folder || 'General').trim(),
      language: language || 'cpp',
      code,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.status(201).json({ message: 'Code saved to folder!', savedCode: saved });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save code snippet.' });
  }
});

router.put('/saved/:id', optionalAuth, async (req, res) => {
  try {
    const { title, folder, language, code } = req.body;
    const existing = await SavedCode.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Saved code not found.' });

    const updated = await SavedCode.findByIdAndUpdate(req.params.id, {
      ...(title && { title: title.trim() }),
      ...(folder && { folder: folder.trim() }),
      ...(language && { language }),
      ...(code && { code }),
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'Updated successfully!', savedCode: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update code.' });
  }
});

router.delete('/saved/:id', optionalAuth, async (req, res) => {
  try {
    await SavedCode.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete saved code.' });
  }
});

module.exports = router;