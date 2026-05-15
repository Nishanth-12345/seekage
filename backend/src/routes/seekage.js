const express = require('express');
const router = express.Router();
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_MB || 500) * 1024 * 1024,
  },
});

const groupController = require('../controllers/seekage');
const authMiddleware = require('../middlewares/auth'); // ✅ FIX path

// Get all groups
router.get('/', authMiddleware, groupController.getAllGroups);

// Get groups by school
router.get('/school/:schoolId', authMiddleware, groupController.getGroupsBySchool);

// Create school
router.post('/school', authMiddleware, groupController.createSchool);

// Create/update parent password for a student
router.post('/parent-password', authMiddleware, groupController.createPasswordForParent);

// Create group
router.post('/', authMiddleware, groupController.createGroup);

// Get content by group
router.get('/content/:groupId', authMiddleware, groupController.getContentByGroup);

// Stream uploaded content file from MySQL
router.get('/content/:contentId/file', authMiddleware, groupController.getContentFile);

// Get subjects by group
router.get('/:groupId/subjects', authMiddleware, groupController.getSubjectsByGroup);

// Hide content by parent password from a student account
router.patch('/content/parent-hide', authMiddleware, groupController.hideContentByParent);

// Create subjects before uploading content
router.post('/content/seekage', authMiddleware, groupController.createContentBySeekage);
router.post('/content/school', authMiddleware, groupController.createContentBySchool);

// Create course content
router.post('/content', authMiddleware, upload.single('file'), groupController.uploadContent);

// Delete uploaded content
router.delete('/content/:id', authMiddleware, groupController.deleteContent);

// Get questions by uploaded content and subject
router.get('/questions/content/:contentId/subject/:subjectId', authMiddleware, groupController.getQuestionsByContent);

// Create question for uploaded content
router.post('/questions', authMiddleware, groupController.createQuestion);

// router.post(
//   '/upload',
//   authMiddleware,
//   upload.single('file'),
//   contentController.uploadContent
// );

// // Hide content
// router.patch(
//   '/:id/hide',
//   authMiddleware,
//   contentController.hideContent
// );
// router.get('/:groupId', qaController.getQAByGroup);

// // POST /api/qa
// router.post('/', authMiddleware, qaController.createQuestion);

// // POST /api/qa/:id/answer
// router.post('/:id/answer', authMiddleware, qaController.postAnswer);

module.exports = router;
