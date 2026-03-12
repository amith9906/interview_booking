const express = require('express');
const { upload, uploadResume, previewResume } = require('../controllers/uploadController');
const authenticate = require('../middlewares/authenticate');
const router = express.Router();
router.post('/resume', authenticate, upload.single('resume'), uploadResume);
router.get('/resume/preview', authenticate, previewResume);
module.exports = router;
