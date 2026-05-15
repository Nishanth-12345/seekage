const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const MAX_STUDENTS_PER_GROUP = 100;

const AGE_GROUPS = [
  { min: 8, max: 9 },
  { min: 10, max: 11 },
  { min: 12, max: 13 },
  { min: 14, max: 16 },
];

const parseAge = (age) => {
  if (age === undefined || age === null || age === '') return null;
  const parsedAge = Number(age);
  return Number.isInteger(parsedAge) ? parsedAge : null;
};

const getAgeGroup = (age) => AGE_GROUPS.find(
  (group) => age >= group.min && age <= group.max
);

const getBatchName = (index) => {
  let batchName = '';
  let remaining = index;

  do {
    batchName = String.fromCharCode(65 + (remaining % 26)) + batchName;
    remaining = Math.floor(remaining / 26) - 1;
  } while (remaining >= 0);

  return batchName;
};

const findOrCreateAvailableGroup = async (connection, {
  groupType,
  ageGroup,
  schoolId = null,
}) => {
  const groupNamePrefix = `Age ${ageGroup.min}-${ageGroup.max}`;
  const params = [groupType, `${groupNamePrefix}%`];
  let schoolClause = 'AND school_id IS NULL';

  if (schoolId) {
    schoolClause = 'AND school_id = ?';
    params.push(schoolId);
  }

  const [groups] = await connection.query(
    `SELECT group_id, student_count
     FROM Study_Groups
     WHERE group_type = ?
       AND group_name LIKE ?
       ${schoolClause}
     ORDER BY group_id
     FOR UPDATE`,
    params
  );

  const availableGroup = groups.find(
    (group) => group.student_count < MAX_STUDENTS_PER_GROUP
  );

  if (availableGroup) {
    return availableGroup.group_id;
  }

  const groupName = `${groupNamePrefix} Batch ${getBatchName(groups.length)}`;
  const [result] = await connection.query(
    `INSERT INTO Study_Groups (group_type, group_name, school_id)
     VALUES (?, ?, ?)`,
    [groupType, groupName, schoolId]
  );

  return result.insertId;
};

// Register User
exports.createUser = async (req, res) => {
  const { name, phone, password, age, state, schoolCode, registrationType, role } = req.body;
  const connection = await db.getConnection();

  try {
    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'Name, phone, and password are required' });
    }

    if (!['seekage', 'school'].includes(registrationType)) {
      return res.status(400).json({ message: 'Registration type must be seekage or school' });
    }

    const normalizedSchoolCode = schoolCode?.trim().toUpperCase();
    const requestedRole = role || 'student';
    const ageNumber = parseAge(age);

    let groupId = null;
    let schoolId = null;
    let studentId = null;
    let userRole = 'student';
    let shouldIncrementStudentCount = false;

    if (role && !['student', 'teacher', 'parent'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    if (registrationType === 'school' && !normalizedSchoolCode) {
      return res.status(400).json({ message: 'School code is required' });
    }

    if (registrationType === 'school' && !['student', 'teacher'].includes(requestedRole)) {
      return res.status(400).json({ message: 'School registration role must be student or teacher' });
    }

    if (registrationType === 'seekage' && requestedRole !== 'student') {
      return res.status(400).json({ message: 'Seekage registration role must be student' });
    }

    if(schoolCode){
      const [schools] = await connection.query(
        'SELECT school_id FROM Schools WHERE school_code = ?',
        [normalizedSchoolCode]
      );

      if (!schools.length) {
        return res.status(400).json({ message: 'Invalid school code' });
      }
    }
    

    if (requestedRole === 'student') {
      if (!ageNumber) {
        return res.status(400).json({ message: 'Age is required for student registration' });
      }

      if (!getAgeGroup(ageNumber)) {
        return res.status(400).json({ message: 'Age must be between 8 and 16' });
      }
    }

    const hash = await bcrypt.hash(password, 10);

    await connection.beginTransaction();

    if (registrationType === 'school' && normalizedSchoolCode) {
      userRole = requestedRole;

      const [schools] = await connection.query(
        'SELECT school_id FROM Schools WHERE school_code = ?',
        [normalizedSchoolCode]
      );

      if (!schools.length) {
        await connection.rollback();
        return res.status(400).json({ message: 'Invalid school code' });
      }

      schoolId = schools[0].school_id;

      if (userRole === 'student') {
        groupId = await findOrCreateAvailableGroup(connection, {
          groupType: 'school_based',
          ageGroup: getAgeGroup(ageNumber),
          schoolId,
        });
        shouldIncrementStudentCount = true;
      }
    } else if (registrationType === 'seekage') {
      groupId = await findOrCreateAvailableGroup(connection, {
        groupType: 'age_based',
        ageGroup: getAgeGroup(ageNumber),
      });
      shouldIncrementStudentCount = true;
    }

    let userId = null;

    if (userRole === 'student') {
      const [studentResult] = await connection.query(
        `INSERT INTO Students
        (name, phone_number, password_hash, school_id, group_id, age, state, preferred_language)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, phone, hash, schoolId, groupId, ageNumber, state, 'en']
      );

      studentId = studentResult.insertId;
    } else {
      const [result] = await connection.query(
        `INSERT INTO Users
        (name, role, phone_number, password_hash, age, state, preferred_language, group_id, school_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, userRole, phone, hash, ageNumber, state, 'en', groupId, schoolId]
      );

      userId = result.insertId;
    }

    if (shouldIncrementStudentCount) {
      await connection.query(
        'UPDATE Study_Groups SET student_count = student_count + 1 WHERE group_id = ?',
        [groupId]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: 'Registered successfully',
      userId,
      studentId,
      role: userRole,
      schoolId,
      groupId,
    });
  } catch (e) {
    await connection.rollback();

    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Phone already registered' });
    }

    res.status(500).json({
      message: 'Server error',
      error: e.message,
    });
  } finally {
    connection.release();
  }
};

// Login
exports.login = async (req, res) => {
  const { phone, password, role } = req.body;

  try {
    if (role === 'student') {
      const [students] = await db.query(
        'SELECT * FROM Students WHERE phone_number = ?',
        [phone]
      );

      if (!students.length) {
        return res.status(401).json({ message: 'User not found' });
      }

      const student = students[0];
      const match = await bcrypt.compare(password, student.password_hash);

      if (!match) {
        return res.status(401).json({ message: 'Wrong password' });
      }

      const token = jwt.sign(
        { id: student.student_id, role: 'student' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: student.student_id,
          name: student.name,
          role: 'student',
          schoolId: student.school_id,
          groupId: student.group_id,
          phone: student.phone_number,
        },
      });
    }

    const [users] = await db.query(
      'SELECT * FROM Users WHERE phone_number = ? AND role = ?',
      [phone, role]
    );

    if (!users.length) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = users[0];

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Wrong password' });
    }

    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.user_id,
        name: user.name,
        role: user.role,
        schoolId: user.school_id,
        phone: user.phone_number,
      },
    });
  } catch (e) {
    res.status(500).json({
      message: 'Server error',
      error: e.message,
    });
  }
};

exports.me = async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const [students] = await db.query(
        `SELECT s.student_id, s.name, s.phone_number, s.school_id, s.group_id,
                s.age, sc.school_code
         FROM Students s
         LEFT JOIN Schools sc ON sc.school_id = s.school_id
         WHERE s.student_id = ?`,
        [req.user.id]
      );

      if (!students.length) {
        return res.status(404).json({ message: 'User not found' });
      }

      const student = students[0];
      return res.json({
        user: {
          id: student.student_id,
          name: student.name,
          role: 'student',
          schoolId: student.school_id,
          schoolCode: student.school_code,
          groupId: student.group_id,
          age: student.age,
          phone: student.phone_number,
        },
      });
    }

    const [users] = await db.query(
      `SELECT u.user_id, u.name, u.role, u.phone_number, u.school_id,
              u.group_id, u.age, sc.school_code
       FROM Users u
       LEFT JOIN Schools sc ON sc.school_id = u.school_id
       WHERE u.user_id = ?`,
      [req.user.id]
    );

    if (!users.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    res.json({
      user: {
        id: user.user_id,
        name: user.name,
        role: user.role,
        schoolId: user.school_id,
        schoolCode: user.school_code,
        groupId: user.group_id,
        age: user.age,
        phone: user.phone_number,
      },
    });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

// Verify Parent Password
exports.verifyParentPassword = async (req, res) => {
  const { studentId, studentPhone, phone, password } = req.body;
  const lookupPhone = studentPhone || phone;

  try {
    if ((!studentId && !lookupPhone) || !password) {
      return res.status(400).json({ message: 'studentId or studentPhone, and password are required' });
    }

    const params = studentId ? [studentId] : [lookupPhone];
    const whereClause = studentId ? 'p.student_id = ?' : 's.phone_number = ?';

    const [rows] = await db.query(
      `SELECT p.password_hash
       FROM Passwords p
       JOIN Students s ON s.student_id = p.student_id
       WHERE ${whereClause}`,
      params
    );

    if (!rows.length) {
      return res.status(400).json({ message: 'No parent password set' });
    }

    const match = await bcrypt.compare(password, rows[0].password_hash);

    if (!match) {
      return res.status(401).json({ message: 'Incorrect parent password' });
    }

    res.json({ verified: true });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};
