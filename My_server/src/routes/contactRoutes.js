const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Route cho việc gửi email liên hệ
router.post('/send-contact', contactController.sendContactEmail);

module.exports = router;
