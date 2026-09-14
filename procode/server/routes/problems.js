const express = require('express');
const router = express.Router();
const { Problem, Comment, getTopics } = require('../services/db');
const { optionalAuth } = require('../middleware/auth');

// Get all DSA topics
router.get('/topics', async (req, res) => {
  try {
    const topics = getTopics();
    res.json({ topics });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch topics.' });
  }
});

// Get all problems with optional filters & user solved status
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { topic, difficulty, search } = req.query;
    let problems = await Problem.find({});

    if (topic && topic !== 'All') {
      problems = problems.filter(p => p.topic.toLowerCase() === topic.toLowerCase());
    }

    if (difficulty && difficulty !== 'All') {
      problems = problems.filter(p => p.difficulty.toLowerCase() === difficulty.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      problems = problems.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.topic.toLowerCase().includes(q) ||
        (p.examUnit && p.examUnit.toLowerCase().includes(q))
      );
    }

    const solvedSet = new Set(req.user?.solvedProblems || []);

    const sanitized = problems.map(p => {
      const { hiddenTestCases, starterCode, ...rest } = p;
      return {
        ...rest,
        isSolved: solvedSet.has(p._id)
      };
    });

    res.json({ problems: sanitized, total: sanitized.length });
  } catch (err) {
    console.error('Error fetching problems:', err);
    res.status(500).json({ error: 'Failed to fetch problems.' });
  }
});

// Topic ladder view (organized by topic, progressive easy -> hard, with graduation markers)
router.get('/ladder', optionalAuth, async (req, res) => {
  try {
    const allProblems = await Problem.find({});
    const solvedSet = new Set(req.user?.solvedProblems || []);

    const topicsOrder = [
      'Arrays',
      'Strings',
      'Recursion',
      'Searching',
      'Sorting',
      'Linked Lists',
      'Stacks/Queues',
      'Basic Trees'
    ];

    const difficultyWeight = { Easy: 1, Medium: 2, Hard: 3 };

    const grouped = {};
    for (const t of topicsOrder) {
      grouped[t] = [];
    }

    for (const p of allProblems) {
      const { hiddenTestCases, starterCode, ...rest } = p;
      const topicName = p.topic || 'General';
      if (!grouped[topicName]) grouped[topicName] = [];
      grouped[topicName].push({
        ...rest,
        isSolved: solvedSet.has(p._id)
      });
    }

    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => (difficultyWeight[a.difficulty] || 1) - (difficultyWeight[b.difficulty] || 1));
    }

    res.json({ ladder: grouped });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load topic ladder.' });
  }
});

// Get single problem by ID (includes sampleTestCases, starterCode, LeetCode graduation info)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found.' });
    }

    const { hiddenTestCases, starterCode, ...safeProblem } = problem;
    const isSolved = req.user ? (req.user.solvedProblems || []).includes(problem._id) : false;

    res.json({
      problem: {
        ...safeProblem,
        isSolved,
        totalHiddenCount: (hiddenTestCases || []).length
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch problem details.' });
  }
});

// --- PROBLEM COMMENTS / DISCUSSION ENDPOINTS ---
// Get comments for a problem
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ problemId: req.params.id });
    comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ comments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments.' });
  }
});

// Post a comment for a problem
router.post('/:id/comments', optionalAuth, async (req, res) => {
  try {
    const rawText = req.body.content || req.body.text;
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: 'Comment text is required.' });
    }

    const authorName = req.user?.name || req.user?.alias || req.body.userName || 'Anonymous Coder';
    const authorAvatar = req.user?.avatar || req.body.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authorName)}`;
    const authorPoints = req.user?.careerPoints !== undefined ? req.user.careerPoints : (req.body.userPoints || 0);
    const authorTier = req.user?.rankTier || req.body.userRankTier || 'Bronze';
    const authorBatch = req.user?.batch || req.body.userBatch || 'CSE';
    const authorId = req.user?._id || req.body?.userId || null;
    const authorRole = req.user?.role || (authorName.toLowerCase().includes('host') ? 'admin' : 'student');

    const newComment = await Comment.create({
      problemId: req.params.id,
      text: rawText.trim(),
      content: rawText.trim(),
      userName: authorName,
      userAvatar: authorAvatar,
      userPoints: authorPoints,
      userRankTier: authorTier,
      userBatch: authorBatch,
      userRole: authorRole,
      userId: authorId,
      createdAt: new Date().toISOString()
    });

    const allComments = await Comment.find({ problemId: req.params.id });
    allComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(201).json({ message: 'Comment posted!', comment: newComment, comments: allComments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to post comment.' });
  }
});

// Delete a comment
router.delete('/:id/comments/:commentId', optionalAuth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });

    // Allow author or admin to delete
    if (req.user && req.user.role !== 'admin' && String(comment.userId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized to delete this comment.' });
    }

    await Comment.deleteOne({ _id: req.params.commentId });
    res.json({ message: 'Comment deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment.' });
  }
});

module.exports = router;
