// ─── SEEKAGE Backend Server ───────────────────────────────────────────────────
// Stack: Node.js + Express + Socket.io + MySQL
// Run:   node server.js   (after npm install)
// ─────────────────────────────────────────────────────────────────────────────

const express     = require('express');
const http        = require('http');
const { Server }  = require('socket.io');
const mysql       = require('mysql2/promise');
const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');
const multer      = require('multer');
const cors        = require('cors');
const path        = require('path');
require('dotenv').config();

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// ─── MySQL Pool ───────────────────────────────────────────────────────────────
const db = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASS     || '',
  database: process.env.DB_NAME     || 'seekage_db',
  waitForConnections: true,
  connectionLimit:    10,
});

// ─── Multer (file upload — store locally; swap to S3 for production) ──────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// ─── JWT Middleware ───────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'seekage_dev_secret';

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { name, phone, password, age, state, schoolCode, registrationType } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);

    // Find or create school group if school path
    let groupId = null;
    if (registrationType === 'school' && schoolCode) {
      const [schools] = await db.query('SELECT school_id FROM Schools WHERE school_code = ?', [schoolCode]);
      if (!schools.length) return res.status(400).json({ message: 'Invalid school code' });
      const schoolId = schools[0].school_id;
      // Find a non-full group for this school
      const [groups] = await db.query(
        'SELECT group_id FROM Study_Groups WHERE school_id = ? AND student_count < 100 LIMIT 1', [schoolId]
      );
      if (groups.length) {
        groupId = groups[0].group_id;
        await db.query('UPDATE Study_Groups SET student_count = student_count + 1 WHERE group_id = ?', [groupId]);
      }
    } else if (registrationType === 'seekage' && age) {
      // Auto-assign to age-based batch
      const [groups] = await db.query(
        "SELECT group_id FROM Study_Groups WHERE group_type = 'age_based' AND group_name LIKE ? AND student_count < 100 LIMIT 1",
        [`%${Math.floor(age / 2) * 2}%`]
      );
      if (groups.length) {
        groupId = groups[0].group_id;
        await db.query('UPDATE Study_Groups SET student_count = student_count + 1 WHERE group_id = ?', [groupId]);
      }
    }

    await db.query(
      'INSERT INTO Users (name, role, phone_number, password_hash, age, state, preferred_language) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, 'student', phone, hash, age || null, state, 'en']
    );
    res.json({ message: 'Registered successfully' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Phone already registered' });
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { phone, password, role } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM Users WHERE phone_number = ? AND role = ?', [phone, role]);
    if (!users.length) return res.status(401).json({ message: 'User not found' });
    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: 'Wrong password' });
    const token = jwt.sign({ id: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.user_id, name: user.name, role: user.role, phone: user.phone_number } });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

// POST /api/auth/verify-parent-password
app.post('/api/auth/verify-parent-password', async (req, res) => {
  const { userId, password } = req.body;
  try {
    const [rows] = await db.query('SELECT parent_password FROM Users WHERE user_id = ?', [userId]);
    if (!rows.length || !rows[0].parent_password)
      return res.status(400).json({ message: 'No parent password set' });
    const match = await bcrypt.compare(password, rows[0].parent_password);
    if (!match) return res.status(401).json({ message: 'Incorrect parent password' });
    res.json({ verified: true });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GROUPS ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/groups
app.get('/api/groups', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Study_Groups ORDER BY group_name');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/groups/school/:schoolId
app.get('/api/groups/school/:schoolId', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Study_Groups WHERE school_id = ?', [req.params.schoolId]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/groups  (admin/school only)
app.post('/api/groups', authMiddleware, async (req, res) => {
  const { group_name, group_type, school_id } = req.body;
  if (!['admin', 'school'].includes(req.user.role))
    return res.status(403).json({ message: 'Forbidden' });
  try {
    await db.query(
      'INSERT INTO Study_Groups (group_name, group_type, school_id, student_count) VALUES (?, ?, ?, 0)',
      [group_name, group_type || 'school_based', school_id || null]
    );
    res.json({ message: 'Group created' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/content/:groupId
app.get('/api/content/:groupId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Content WHERE group_id = ? ORDER BY content_id DESC', [req.params.groupId]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/content/upload  (admin/teacher/school)
app.post('/api/content/upload', authMiddleware, upload.single('file'), async (req, res) => {
  const allowed = ['admin', 'teacher', 'school'];
  if (!allowed.includes(req.user.role))
    return res.status(403).json({ message: 'Forbidden' });
  const { content_type, subject_name, title, group_id } = req.body;
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : '';
  try {
    await db.query(
      'INSERT INTO Content (group_id, uploader_id, content_type, subject_name, title, file_url) VALUES (?, ?, ?, ?, ?, ?)',
      [group_id || null, req.user.id, content_type, subject_name, title, fileUrl]
    );
    res.json({ message: 'Uploaded', url: fileUrl });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

// PATCH /api/content/:id/hide  (admin/parent)
app.patch('/api/content/:id/hide', authMiddleware, async (req, res) => {
  const { hidden } = req.body;
  try {
    await db.query('UPDATE Content SET is_hidden_by_parent = ? WHERE content_id = ?', [hidden, req.params.id]);
    res.json({ message: 'Updated' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Q&A ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/qa/:groupId
app.get('/api/qa/:groupId', async (req, res) => {
  try {
    const [questions] = await db.query(
      `SELECT q.*, u.name AS asked_by_name,
         (SELECT JSON_ARRAYAGG(JSON_OBJECT('text', a.answer_text, 'by', au.name))
          FROM QA_Answers a JOIN Users au ON a.answerer_id = au.user_id
          WHERE a.question_id = q.question_id) AS answers
       FROM QA_Questions q JOIN Users u ON q.asker_id = u.user_id
       WHERE q.group_id = ? ORDER BY q.question_id DESC`,
      [req.params.groupId]
    );
    res.json(questions);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/qa
app.post('/api/qa', authMiddleware, async (req, res) => {
  const { groupId, question } = req.body;
  try {
    await db.query(
      'INSERT INTO QA_Questions (group_id, asker_id, question_text) VALUES (?, ?, ?)',
      [groupId, req.user.id, question]
    );
    res.json({ message: 'Question posted' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/qa/:id/answer
app.post('/api/qa/:id/answer', authMiddleware, async (req, res) => {
  const { answer } = req.body;
  try {
    await db.query(
      'INSERT INTO QA_Answers (question_id, answerer_id, answer_text) VALUES (?, ?, ?)',
      [req.params.id, req.user.id, answer]
    );
    res.json({ message: 'Answer posted' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CHAT via Socket.io
// ═══════════════════════════════════════════════════════════════════════════════
io.on('connection', (socket) => {
  socket.on('joinGroup', (groupId) => {
    socket.join(`group_${groupId}`);
  });

  socket.on('message', async ({ groupId, text, senderName, senderId }) => {
    const msg = {
      id:         Date.now(),
      text,
      senderName,
      senderId,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    };
    // Broadcast to room
    io.to(`group_${groupId}`).emit('message', msg);
    // Optionally persist to DB:
    // await db.query('INSERT INTO Messages (group_id, sender_id, message_text) VALUES (?,?,?)', [groupId, senderId, text]);
  });

  socket.on('disconnect', () => {});
});

// ─── Serve uploaded files ────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'SEEKAGE API running' }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`SEEKAGE server running on port ${PORT}`));
