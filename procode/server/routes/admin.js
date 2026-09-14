const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { Problem, Paper, Note, Report, User, getTopics, addTopic, deleteTopic } = require('../services/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public or student route to report suspected cheating
router.post('/report-cheat', authenticateToken, async (req, res) => {
  try {
    const { targetUserId, targetUserName, problemId, reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Please provide reason for suspected cheating.' });
    }

    const report = await Report.create({
      reporterId: req.user._id,
      reporterName: req.user.name,
      targetUserId,
      targetUserName,
      problemId,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ message: 'Cheating report submitted for faculty review. Thank you for keeping ProCode fair.', reportId: report._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit cheat report.' });
  }
});

// --- ADMIN ONLY ROUTES ---
router.use(authenticateToken, requireAdmin);

// Topics Management
router.get('/topics', async (req, res) => {
  try {
    res.json({ topics: getTopics() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch topics.' });
  }
});

router.post('/topics', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Topic name is required.' });
    }
    const updated = addTopic(name);
    res.status(201).json({ message: `Topic "${name.trim()}" added successfully.`, topics: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add topic.' });
  }
});

router.delete('/topics', async (req, res) => {
  try {
    const topicName = req.body?.name || req.query?.name;
    if (!topicName) {
      return res.status(400).json({ error: 'Topic name is required.' });
    }
    const updated = deleteTopic(topicName);
    res.json({ message: `Topic "${topicName}" deleted successfully.`, topics: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete topic.' });
  }
});

router.delete('/topics/:name', async (req, res) => {
  try {
    const topicName = req.params.name;
    const updated = deleteTopic(topicName);
    res.json({ message: `Topic "${topicName}" deleted successfully.`, topics: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete topic.' });
  }
});

// Get all problems with FULL details (including hidden test cases for editing)
router.get('/problems', async (req, res) => {
  try {
    const problems = await Problem.find({});
    res.json({ problems, total: problems.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch problems for administration.' });
  }
});

// Add new problem
router.post('/problems', async (req, res) => {
  try {
    const {
      title, topic, difficulty, points, examUnit, collegeExamReference,
      description, constraints, inputFormat, outputFormat,
      sampleTestCases, hiddenTestCases, starterCode,
      isGraduationProblem, leetcodeUrl, suggestedLeetcode
    } = req.body;

    if (!title || !topic || !description) {
      return res.status(400).json({ error: 'Title, topic, and description are required.' });
    }

    const problem = await Problem.create({
      title: title.trim(),
      topic: topic.trim(),
      difficulty: difficulty || 'Easy',
      points: Number(points) || 10,
      examUnit: examUnit || 'Unit 1: Linear Data Structures',
      collegeExamReference: collegeExamReference || '',
      description: description.trim(),
      constraints: constraints || '',
      inputFormat: inputFormat || '',
      outputFormat: outputFormat || '',
      sampleTestCases: sampleTestCases || [],
      hiddenTestCases: hiddenTestCases || [],
      starterCode: starterCode || {},
      isGraduationProblem: Boolean(isGraduationProblem),
      leetcodeUrl: leetcodeUrl || '',
      suggestedLeetcode: suggestedLeetcode || []
    });

    res.status(201).json({ message: 'Problem created successfully.', problem });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create problem.' });
  }
});

// Update problem
router.put('/problems/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.points) updateData.points = Number(updateData.points);
    if (updateData.isGraduationProblem !== undefined) updateData.isGraduationProblem = Boolean(updateData.isGraduationProblem);

    const updated = await Problem.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Problem not found.' });
    res.json({ message: 'Problem updated successfully.', problem: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update problem.' });
  }
});

// Delete problem
router.delete('/problems/:id', async (req, res) => {
  try {
    const result = await Problem.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Problem not found.' });
    res.json({ message: 'Problem deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete problem.' });
  }
});

// Upload PDF file for PYQ Papers or Course Materials
router.post('/upload-pdf', async (req, res) => {
  try {
    const { filename, base64Data } = req.body;
    if (!filename || !base64Data) {
      return res.status(400).json({ error: 'Filename and base64Data are required.' });
    }

    const uploadsDir = path.join(__dirname, '..', 'data', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Clean data URL prefix if present
    const cleanBase64 = base64Data.replace(/^data:application\/pdf;base64,/, '').replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}_${safeName}`;
    const filePath = path.join(uploadsDir, uniqueName);

    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${uniqueName}`;
    res.json({ message: 'PDF uploaded successfully.', url: fileUrl, filename: uniqueName });
  } catch (err) {
    console.error('PDF upload error:', err);
    res.status(500).json({ error: 'Failed to upload PDF file.' });
  }
});

// Add previous year paper
router.post('/papers', async (req, res) => {
  try {
    const paper = await Paper.create(req.body);
    res.status(201).json({ message: 'Paper added successfully.', paper });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add paper.' });
  }
});

// Delete paper
router.delete('/papers/:id', async (req, res) => {
  try {
    const result = await Paper.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Paper not found.' });
    res.json({ message: 'Paper deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete paper.' });
  }
});

// Add concept note
router.post('/notes', async (req, res) => {
  try {
    const note = await Note.create(req.body);
    res.status(201).json({ message: 'Concept note added successfully.', note });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add note.' });
  }
});

// Delete concept note
router.delete('/notes/:id', async (req, res) => {
  try {
    const result = await Note.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Note not found.' });
    res.json({ message: 'Concept note deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note.' });
  }
});

// View cheat reports
router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find({});
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
});

// Overview statistics for Admin
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'student' });
    const totalProblems = await Problem.countDocuments();
    const totalPapers = await Paper.countDocuments();
    const totalNotes = await Note.countDocuments();
    const totalReports = await Report.countDocuments();

    res.json({
      totalUsers,
      totalProblems,
      totalPapers,
      totalNotes,
      totalReports
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin stats.' });
  }
});

module.exports = router;
