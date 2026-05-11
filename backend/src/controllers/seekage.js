// src/controllers/group.controller.js

const db = require('../config/db');
const bcrypt = require('bcrypt');

// Create school (admin only)
exports.createSchool = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can create school' });
    }

    const { school_name, registration_type, school_code, name, place } = req.body;
    const schoolName = (school_name || name || '').trim();
    const normalizedSchoolCode = school_code?.trim().toUpperCase();

    if (registration_type && registration_type !== 'school') {
      return res.status(400).json({ message: 'Registration type must be school' });
    }

    if (!schoolName || !normalizedSchoolCode || !place) {
      return res.status(400).json({ message: 'School name, school code, and place are required' });
    }

    const [result] = await db.query(
      `INSERT INTO Schools (school_code, name, place)
       VALUES (?, ?, ?)`,
      [normalizedSchoolCode, schoolName, place]
    );

    res.status(201).json({
      message: 'School created',
      schoolId: result.insertId,
      schoolCode: normalizedSchoolCode,
    });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'School code already exists' });
    }

    res.status(500).json({
      message: 'Server error',
      error: e.message,
    });
  }
};

// ✅ Get all groups
exports.getAllGroups = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Study_Groups ORDER BY group_name'
    );

    res.json(rows);

  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Get groups by school
exports.getGroupsBySchool = async (req, res) => {
  const { schoolId } = req.params;

  try {
    const [rows] = await db.query(
      'SELECT * FROM Study_Groups WHERE school_id = ?',
      [schoolId]
    );

    res.json(rows);

  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Create group (admin / school only)
exports.createGroup = async (req, res) => {
  const { group_name, group_type, school_id } = req.body;

  // 🔐 Role check
  if (!['admin', 'school', 'teacher'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const normalizedGroupName = group_name?.trim();
    const normalizedGroupType = group_type || (req.user.role === 'admin' ? 'age_based' : 'school_based');
    const normalizedSchoolId = school_id || null;

    if (!normalizedGroupName) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    if (!['age_based', 'school_based'].includes(normalizedGroupType)) {
      return res.status(400).json({ message: 'Group type must be age_based or school_based' });
    }

    if (normalizedGroupType === 'age_based' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can create Seekage age groups' });
    }

    if (normalizedGroupType === 'age_based' && normalizedSchoolId) {
      return res.status(400).json({ message: 'Age-based groups should not have school_id' });
    }

    if (normalizedGroupType === 'school_based' && !normalizedSchoolId) {
      return res.status(400).json({ message: 'school_id is required for school-based groups' });
    }

    const [result] = await db.query(
      `INSERT INTO Study_Groups 
      (group_name, group_type, school_id, student_count) 
      VALUES (?, ?, ?, 0)`,
      [normalizedGroupName, normalizedGroupType, normalizedSchoolId]
    );

    res.status(201).json({
      message: 'Group created',
      groupId: result.insertId,
      groupName: normalizedGroupName,
      groupType: normalizedGroupType,
      schoolId: normalizedSchoolId,
    });

  } catch (e) {
    res.status(500).json({
      message: 'Server error',
      error: e.message,
    });
  }
};
// src/controllers/content.controller.js

const getGroupForContent = async (groupId) => {
  const [groups] = await db.query(
    `SELECT group_id, group_type, school_id
     FROM Study_Groups
     WHERE group_id = ?`,
    [groupId]
  );

  return groups[0] || null;
};

const createSubject = async (req, res, instructorName) => {
  try {
    const { group_id, school_id, subject_name } = req.body;
    const normalizedSubjectName = subject_name?.trim();

    if (!group_id || !normalizedSubjectName) {
      return res.status(400).json({ message: 'group_id and subject_name are required' });
    }

    const group = await getGroupForContent(group_id);

    if (!group) {
      return res.status(400).json({ message: 'Invalid group_id' });
    }

    if (instructorName === 'seekage') {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Only admin can create Seekage subjects' });
      }

      if (group.group_type !== 'age_based') {
        return res.status(400).json({ message: 'Seekage subjects can only be created for age-based groups' });
      }

      if (school_id) {
        return res.status(400).json({ message: 'school_id is not allowed for Seekage subjects' });
      }
    }

    if (instructorName === 'school') {
      if (!['admin', 'teacher', 'school'].includes(req.user?.role)) {
        return res.status(403).json({ message: 'Only school users can create school subjects' });
      }

      if (group.group_type !== 'school_based' || !group.school_id) {
        return res.status(400).json({ message: 'School subjects can only be created for school groups' });
      }

      if (!school_id) {
        return res.status(400).json({ message: 'school_id is required for school subjects' });
      }

      if (Number(school_id) !== Number(group.school_id)) {
        return res.status(400).json({ message: 'school_id does not match this group_id' });
      }
    }

    const subjectSchoolId = instructorName === 'school' ? group.school_id : null;

    const [result] = await db.query(
      `INSERT INTO Subjects (group_id, subject_name, instructor_id, instructor_name, school_id)
       VALUES (?, ?, ?, ?, ?)`,
      [group.group_id, normalizedSubjectName, req.user.id, instructorName, subjectSchoolId]
    );

    res.status(201).json({
      message: 'Subject created',
      subjectId: result.insertId,
      groupId: group.group_id,
      schoolId: group.school_id,
      subjectName: normalizedSubjectName,
      instructorId: req.user.id,
      instructorName,
    });
  } catch (e) {
    res.status(500).json({
      message: 'Server error',
      error: e.message,
    });
  }
};



// ✅ Get content by group
exports.getContentByGroup = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Content WHERE group_id = ? ORDER BY content_id DESC',
      [req.params.groupId]
    );

    res.json(rows);

  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createContentBySeekage = async (req, res) => {
  return createSubject(req, res, 'seekage');
};

exports.createContentBySchool = async (req, res) => {
  return createSubject(req, res, 'school');
};


exports.getContentByGroupForParent = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT *, is_hidden_by_parent AS hidden FROM Content WHERE group_id = ? ORDER BY content_id DESC',
      [req.params.groupId]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Upload content
exports.uploadContent = async (req, res) => {
  const allowed = ['admin', 'teacher', 'school'];

  if (!allowed.includes(req.user?.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { subject_id, content_type, subject_name, title, group_id, file_url } = req.body;
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : file_url?.trim();

  try {
    if (!group_id) {
      return res.status(400).json({ message: 'group_id is required' });
    }

    if (!subject_id) {
      return res.status(400).json({ message: 'subject_id is required' });
    }

    if (!title?.trim()) {
      return res.status(400).json({ message: 'title is required' });
    }

    if (!fileUrl) {
      return res.status(400).json({ message: 'file_url is required' });
    }

    if (!['video', 'document', 'note', 'assignment'].includes(content_type)) {
      return res.status(400).json({ message: 'content_type must be video, document, note, or assignment' });
    }

    const group = await getGroupForContent(group_id);

    if (!group) {
      return res.status(400).json({ message: 'Invalid group_id' });
    }

    if (group.group_type === 'school_based' && !group.school_id) {
      return res.status(400).json({ message: 'School group must be linked to a school' });
    }

    if (req.user.role !== 'admin' && group.group_type !== 'school_based') {
      return res.status(403).json({ message: 'Only admin can upload Seekage content' });
    }

    const [subjects] = await db.query(
      `SELECT subject_id, subject_name, group_id, instructor_name
       FROM Subjects
       WHERE subject_id = ? AND group_id = ?`,
      [subject_id, group.group_id]
    );

    if (!subjects.length) {
      return res.status(400).json({ message: 'Invalid subject_id for this group_id' });
    }

    const subject = subjects[0];
    const instructorName = group.group_type === 'school_based' ? 'school' : 'seekage';

    if (subject.instructor_name !== instructorName) {
      return res.status(400).json({ message: 'Subject instructor type does not match group type' });
    }

    if (subject_name && subject_name.trim() !== subject.subject_name) {
      return res.status(400).json({ message: 'subject_name does not match subject_id' });
    }

    const [result] = await db.query(
      `INSERT INTO Content 
      (subject_id, group_id, uploader_id, instructor_id, instructor_name, content_type, subject_name, title, file_url) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        subject.subject_id,
        group.group_id,
        req.user.id,
        req.user.id,
        instructorName,
        content_type,
        subject.subject_name,
        title.trim(),
        fileUrl,
      ]
    );

    res.json({
      message: 'Uploaded',
      contentId: result.insertId,
      subjectId: subject.subject_id,
      subjectName: subject.subject_name,
      groupId: group.group_id,
      schoolId: group.school_id,
      instructorId: req.user.id,
      instructorName,
      url: fileUrl,
    });

  } catch (e) {
    res.status(500).json({
      message: 'Server error',
      error: e.message,
    });
  }
};

exports.createPasswordForParent = async (req, res) => {
  const { student_phone, student_number, phone, password } = req.body;
  const studentPhone = student_phone || student_number || phone;

  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can create parent password' });
  }

  try {
    if (!studentPhone || !password) {
      return res.status(400).json({ message: 'student phone and password are required' });
    }

    const [students] = await db.query(
      'SELECT student_id, name FROM Students WHERE phone_number = ?',
      [studentPhone]
    );

    if (!students.length) {
      return res.status(400).json({ message: 'Student not found' });
    }

    const student = students[0];
    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO Passwords (student_id, student_name, password_hash, created_by)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         student_name = VALUES(student_name),
         password_hash = VALUES(password_hash),
         created_by = VALUES(created_by)`,
      [student.student_id, student.name, passwordHash, req.user.id]
    );

    res.status(result.insertId ? 201 : 200).json({
      message: result.insertId ? 'Parent password created' : 'Parent password updated',
      studentId: student.student_id,
      studentName: student.name,
    });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

// ✅ Hide content (parent/admin)
exports.hideContentByParent = async (req, res) => {
  const { content_id, group_id, subject_id, password } = req.body;

  if (req.user?.role !== 'student') {
    return res.status(403).json({ message: 'Only student account can hide content by parent password' });
  }

  try {
    if (!content_id || !group_id || !subject_id || !password) {
      return res.status(400).json({
        message: 'content_id, group_id, subject_id, and password are required',
      });
    }

    const [students] = await db.query(
      `SELECT student_id, school_id, group_id
       FROM Students
       WHERE student_id = ?`,
      [req.user.id]
    );

    if (!students.length) {
      return res.status(400).json({ message: 'Student not found' });
    }

    const student = students[0];

    if (Number(student.group_id) !== Number(group_id)) {
      return res.status(403).json({ message: 'Student does not belong to this group' });
    }

    const [passwordRows] = await db.query(
      `SELECT password_hash
       FROM Passwords
       WHERE student_id = ?`,
      [student.student_id]
    );

    if (!passwordRows.length) {
      return res.status(400).json({ message: 'No parent password set for this student' });
    }

    const passwordMatches = await bcrypt.compare(password, passwordRows[0].password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Incorrect parent password' });
    }

    const [contents] = await db.query(
      `SELECT c.content_id, c.group_id, c.subject_id, s.school_id
       FROM Content c
       JOIN Subjects s ON s.subject_id = c.subject_id
       JOIN Study_Groups g ON g.group_id = c.group_id
       WHERE c.content_id = ?
         AND c.group_id = ?
         AND c.subject_id = ?
         AND s.group_id = c.group_id
         AND g.school_id = ?`,
      [content_id, group_id, subject_id, student.school_id]
    );

    if (!contents.length) {
      return res.status(400).json({
        message: 'Content, group, subject, and student school do not match',
      });
    }

    await db.query(
      'UPDATE Content SET is_hidden_by_parent = 1 WHERE content_id = ?',
      [content_id]
    );

    res.json({
      message: 'Content hidden by parent',
      contentId: Number(content_id),
      groupId: Number(group_id),
      subjectId: Number(subject_id),
      studentId: student.student_id,
      schoolId: student.school_id,
      hidden: true,
    });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

exports.hideContent = async (req, res) => {
  const { hidden } = req.body;

  try {
    await db.query(
      'UPDATE Content SET is_hidden_by_parent = ? WHERE content_id = ?',
      [hidden, req.params.id]
    );

    res.json({ message: 'Updated' });

  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// src/controllers/qa.controller.js



// ✅ Get questions + answers by group
exports.getQAByGroup = async (req, res) => {
  try {
    const [questions] = await db.query(
      `SELECT q.*, u.name AS asked_by_name,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT('text', a.answer_text, 'by', au.name)
          )
          FROM QA_Answers a
          JOIN Users au ON a.answerer_id = au.user_id
          WHERE a.question_id = q.question_id
        ) AS answers
       FROM QA_Questions q
       JOIN Users u ON q.asker_id = u.user_id
       WHERE q.group_id = ?
       ORDER BY q.question_id DESC`,
      [req.params.groupId]
    );

    res.json(questions);

  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Post a question
exports.createQuestion = async (req, res) => {
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
};

// ✅ Post an answer
exports.postAnswer = async (req, res) => {
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
};
