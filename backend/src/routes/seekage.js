const express = require('express');
const router = express.Router();

const groupController = require('../controllers/seekage');
const authMiddleware = require('../middlewares/auth'); // ✅ FIX path

// Get all groups
router.get('/', authMiddleware, groupController.getAllGroups);

// Get groups by school
router.get('/school/:schoolId', authMiddleware, groupController.getGroupsBySchool);

// Create school
router.post('/school', authMiddleware, groupController.createSchool);

// Create group
router.post('/', authMiddleware, groupController.createGroup);

// Get content by group
router.get('/content/:groupId', authMiddleware, groupController.getContentByGroup);

// Create subjects before uploading content
router.post('/content/seekage', authMiddleware, groupController.createContentBySeekage);
router.post('/content/school', authMiddleware, groupController.createContentBySchool);

// Create course content
router.post('/content', authMiddleware, groupController.uploadContent);

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
