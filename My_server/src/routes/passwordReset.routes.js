const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordResetController');

// Gửi OTP đến email hoặc số điện thoại
router.post('/send-otp', passwordResetController.sendOTP);

// Xác thực OTP
router.post('/verify-otp', passwordResetController.verifyOTP);

// Đặt lại mật khẩu
router.post('/reset-password', passwordResetController.resetPassword);

module.exports = router;
