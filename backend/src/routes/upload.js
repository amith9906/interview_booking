const express = require('express');
const { upload, uploadResume } = require('../controllers/uploadController');
const authenticate = require('../middlewares/authenticate');
const router = express.Router();
router.post('/resume', authenticate, upload.single('resume'), uploadResume);
module.exports = router;
