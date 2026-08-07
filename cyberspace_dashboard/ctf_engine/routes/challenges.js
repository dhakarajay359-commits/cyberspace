const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireTeam } = require('../middleware/auth');
const { broadcastScoreboard } = require('./scoreboard');
const state = require('../state');
const discord = require('../utils/discord');
const { exec } = require('child_process');

module.exports = function (io) {
  const router = express.Router();

  const bruteForceTracker = {};

  // Get current anomaly state
  router.get('/anomaly/current', (req, res) => {
    res.json(state.anomaly || { active: false });
  });

  // Global Network Health
  router.get('/health', (req, res) => {
    const totalSolvesRes = db.prepare('SELECT count(*) as count FROM solves').get();
    const totalTeamsRes = db.prepare('SELECT count(*) as count FROM teams').get();
    const totalChalsRes = db.prepare('SELECT count(*) as count FROM challenges WHERE visible = 1').get();
    
    const solves = totalSolvesRes.count;
    const maxSolves = totalTeamsRes.count * totalChalsRes.count;
    
    let health = 100;
    if (maxSolves > 0) {
      health = Math.max(0, 100 - ((solves / maxSolves) * 100));
    }
    
    res.json({ health: health.toFixed(1) });
  });

  // Middleware to check if CTF has started
  const checkCTFStarted = (req, res, next) => {
    const startRow = db.prepare("SELECT value FROM settings WHERE key = 'ctf_start_time'").get();
    if (startRow && startRow.value) {
      const startTime = Number(startRow.value);
      if (Date.now() < startTime) {
        return res.status(403).json({ error: 'CTF has not started yet.', upcoming: true, startTime });
      }
    }
    next();
  };

  // List all visible challenges, with per-team solve/hint state
  router.get('/', checkCTFStarted, (req, res) => {
    const teamId = req.session.teamId || null;

    const challenges = db.prepare(`
      SELECT c.id, c.title, c.category_id, cat.name AS category, c.description,
             c.points, c.difficulty, c.link, c.requires, c.docker_image
      FROM challenges c
      LEFT JOIN categories cat ON cat.id = c.category_id
      WHERE c.visible = 1
      ORDER BY cat.name, c.points ASC
    `).all();

    const solvedIds = teamId
      ? new Set(db.prepare('SELECT challenge_id FROM solves WHERE team_id = ?').all(teamId).map(r => r.challenge_id))
      : new Set();

    const revealedHintIds = teamId
      ? new Set(db.prepare('SELECT hint_id FROM hint_reveals WHERE team_id = ?').all(teamId).map(r => r.hint_id))
      : new Set();

    const hintsByChallenge = db.prepare('SELECT * FROM hints ORDER BY order_index ASC').all();

    const result = challenges.map(c => {
      const hints = hintsByChallenge
        .filter(h => h.challenge_id === c.id)
        .map(h => ({
          id: h.id,
          cost: h.cost,
          revealed: revealedHintIds.has(h.id),
          text: revealedHintIds.has(h.id) ? h.text : null
        }));
      return { ...c, solved: solvedIds.has(c.id), hints };
    });

    res.json(result);
  });

  // Submit a flag
  router.post('/:id/submit', requireTeam, checkCTFStarted, (req, res) => {
    const challengeId = Number(req.params.id);
    const { flag } = req.body;
    const teamId = req.session.teamId;

    const challenge = db.prepare('SELECT * FROM challenges WHERE id = ? AND visible = 1').get(challengeId);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found.' });

    if (flag && /(<script>|' OR 1=1|UNION SELECT|alert\()/i.test(flag.trim())) {
      io.to('admin_room').emit('admin:alert', {
        type: 'PLATFORM_ATTACK',
        message: `Team "${req.session.teamName}" attempted to attack the platform via flag submission! Payload: ${flag.substring(0,50)}`,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({ error: 'Attack payload detected. This incident has been logged.' });
    }

    if (!flag || !/^(flag|FLAG)\{.*\}$/.test(flag.trim())) {
      return res.status(400).json({ error: 'Invalid format: Flags must match flag{...}' });
    }

    const already = db.prepare('SELECT 1 FROM solves WHERE team_id = ? AND challenge_id = ?').get(teamId, challengeId);
    if (already) return res.status(409).json({ error: 'Already solved.' });

    const now = new Date();
    const settings = db.prepare("SELECT value FROM settings WHERE key = 'end_time'").get();
    if (settings && settings.value) {
      if (now > new Date(settings.value)) {
        return res.status(403).json({ error: 'Event has ended. Practice mode is read-only.' });
      }
    }

    if (challenge.requires) {
      const reqSolved = db.prepare('SELECT 1 FROM solves WHERE team_id = ? AND challenge_id = ?').get(teamId, challenge.requires);
      if (!reqSolved) {
        return res.status(403).json({ error: 'Prerequisite challenge not solved.' });
      }
    }

    const correct = bcrypt.compareSync((flag || '').trim(), challenge.flag_hash);

    if (!correct) {
      db.prepare('INSERT INTO wrong_attempts (team_id, challenge_id) VALUES (?, ?)').run(teamId, challengeId);
      io.emit('heat:update', { type: 'attempt', challengeId });

      // Brute-force detection
      const nowTs = Date.now();
      if (!bruteForceTracker[teamId]) bruteForceTracker[teamId] = [];
      bruteForceTracker[teamId].push(nowTs);
      
      // Keep only last 10 seconds
      bruteForceTracker[teamId] = bruteForceTracker[teamId].filter(ts => nowTs - ts < 10000);
      
      if (bruteForceTracker[teamId].length >= 5) {
        io.to('admin_room').emit('admin:alert', {
          type: 'BRUTE_FORCE_ATTACK',
          message: `Team "${req.session.teamName}" submitted ${bruteForceTracker[teamId].length} incorrect flags in 10 seconds! Possible script detected.`,
          timestamp: new Date().toISOString()
        });
        bruteForceTracker[teamId] = []; // reset to avoid spamming
      }

      return res.status(200).json({ correct: false });
    }

    // First Blood Check & Dynamic Scoring Decay
    const solveCount = db.prepare('SELECT COUNT(*) as count FROM solves WHERE challenge_id = ?').get(challengeId).count;
    let isFirstBlood = (solveCount === 0);
    
    // Decay multiplier drops 5% per solve, bottoming out at 20% of original points
    const decayMultiplier = Math.max(0.2, 1 - (solveCount * 0.05));
    const basePoints = Math.floor(challenge.points * decayMultiplier);

    // Momentum scoring logic
    let streak = 0;
    const lastSolve = db.prepare('SELECT solved_at, streak FROM solves WHERE team_id = ? ORDER BY solved_at DESC LIMIT 1').get(teamId);
    const lastWrong = db.prepare('SELECT attempted_at FROM wrong_attempts WHERE team_id = ? ORDER BY attempted_at DESC LIMIT 1').get(teamId);
    
    let lastSolveTime = 0;
    let lastWrongTime = 0;
    if (lastSolve) lastSolveTime = new Date(lastSolve.solved_at).getTime();
    if (lastWrong) lastWrongTime = new Date(lastWrong.attempted_at).getTime();

    if (lastSolve && lastSolveTime > lastWrongTime) {
      const diffMins = (now.getTime() - lastSolveTime) / (1000 * 60);
      if (diffMins <= 30) {
        streak = (lastSolve.streak || 0) + 1;
      }
    }
    
    let multiplier = 1 + Math.min(streak * 0.05, 0.25);
    
    let anomalySurge = false;
    if (state.anomaly && state.anomaly.categoryId === challenge.category_id && state.anomaly.endTime > Date.now()) {
      multiplier *= state.anomaly.multiplier;
      anomalySurge = true;
    }

    let awarded_points = Math.floor(basePoints * multiplier);

    // First Blood Bounty Bonus (+50 flat)
    if (isFirstBlood) {
      awarded_points += 50;
    }

    db.prepare('INSERT INTO solves (team_id, challenge_id, awarded_points, streak) VALUES (?, ?, ?, ?)').run(teamId, challengeId, awarded_points, streak);

    if (isFirstBlood) {
      io.emit('first_blood', {
        team: req.session.teamName,
        challenge: challenge.title,
        bounty: 50
      });
      discord.sendFirstBlood(req.session.teamName, challenge.title, awarded_points);
    }

    broadcastScoreboard(io);
    io.emit('activity', {
      team: req.session.teamName,
      challenge: challenge.title,
      points: awarded_points,
      at: now.toISOString(),
      anomalySurge
    });
    io.emit('heat:update', { type: 'solve', challengeId });

    res.json({ correct: true, points: awarded_points, streak });
  });

  // Deploy Docker Sandbox
  router.post('/:id/deploy', requireTeam, checkCTFStarted, (req, res) => {
    const challengeId = Number(req.params.id);
    const challenge = db.prepare('SELECT * FROM challenges WHERE id = ? AND visible = 1').get(challengeId);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found.' });

    if (challenge.difficulty !== 'hard') {
      return res.status(400).json({ error: 'Only hard challenges have isolated sandboxes.' });
    }

    const image = challenge.docker_image;
    if (!image) {
      return res.status(400).json({ error: 'This challenge does not use a Docker sandbox. Please read the description carefully to solve it.' });
    }

    // Attempt to spawn docker
    exec(`docker run -d -P ${image}`, (error, stdout, stderr) => {
      if (error) {
        console.error('Docker run error:', error.message, stderr);
        if (error.message.includes('not recognized') || error.message.includes('not found') || error.message.includes('ENOENT') || (stderr && stderr.includes('not recognized'))) {
          return res.status(500).json({ error: 'Docker is not installed or running on the host server. Please install Docker to use real sandboxes.' });
        }
        return res.status(500).json({ error: `Failed to provision container. Make sure the ${image} image is built.` });
      }

      const containerId = stdout.trim();
      exec(`docker port ${containerId}`, (err, out, serr) => {
        if (err) {
          return res.status(500).json({ error: 'Container spawned but failed to map ports.' });
        }
        try {
          const port = out.split(':')[1].trim();
          res.json({ ip: '127.0.0.1', port, containerId });
        } catch (e) {
          res.status(500).json({ error: 'Failed to parse exposed port.' });
        }
      });
    });
  });

  // Reveal a hint (deducts points by marking a "cost" — enforced at scoreboard calc time)
  router.post('/hints/:hintId/reveal', requireTeam, checkCTFStarted, (req, res) => {
    const hintId = Number(req.params.hintId);
    const teamId = req.session.teamId;

    const hint = db.prepare('SELECT * FROM hints WHERE id = ?').get(hintId);
    if (!hint) return res.status(404).json({ error: 'Hint not found.' });

    const already = db.prepare('SELECT 1 FROM hint_reveals WHERE team_id = ? AND hint_id = ?').get(teamId, hintId);
    if (already) return res.json({ text: hint.text });

    db.prepare('INSERT INTO hint_reveals (team_id, hint_id) VALUES (?, ?)').run(teamId, hintId);
    if (hint.cost > 0) broadcastScoreboard(io);

    res.json({ text: hint.text });
  });

  // Ghost replay route
  router.get('/:id/ghosts', (req, res) => {
    const challengeId = Number(req.params.id);
    const settings = db.prepare("SELECT value FROM settings WHERE key = 'end_time'").get();
    if (!settings || !settings.value || new Date() <= new Date(settings.value)) {
      return res.status(403).json({ error: 'Ghost replay only available after event ends.' });
    }

    // Get top 5 teams based on current scoreboard computation
    // Actually, computeScoreboard is somewhat expensive, but ghost replay only happens post-event.
    const { computeScoreboard } = require('./scoreboard');
    const board = computeScoreboard();
    const top5TeamIds = board.slice(0, 5).map(t => t.teamId);

    if (top5TeamIds.length === 0) return res.json([]);

    const placeholders = top5TeamIds.map(() => '?').join(',');
    const solves = db.prepare(`
      SELECT s.solved_at, t.name as team
      FROM solves s
      JOIN teams t ON t.id = s.team_id
      WHERE s.challenge_id = ? AND s.team_id IN (${placeholders})
      ORDER BY s.solved_at ASC
    `).all(challengeId, ...top5TeamIds);

    res.json(solves);
  });

  return router;
};
