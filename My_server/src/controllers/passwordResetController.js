const accountService = require('../services/accountService');
const Account = require('../models/account');
const emailService = require('../services/emailService');
require('dotenv').config();
const crypto = require('crypto');

// Lưu trữ mã OTP tạm thời (trong thực tế nên lưu vào database)
const otpStore = new Map();

// Hàm tạo OTP ngẫu nhiên 6 chữ số
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Gửi email chứa mã OTP
exports.sendOTP = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;

    if (!emailOrPhone) {
      return res.status(400).json({ message: 'Email hoặc số điện thoại không được để trống' });
    }

    // Kiểm tra xem email/số điện thoại có tồn tại trong hệ thống không
    const account = await Account.findOne({
      $or: [
        { email: emailOrPhone },
        { phone: emailOrPhone }
      ]
    });

    if (!account) {
      return res.status(404).json({ message: 'Tài khoản không tồn tại trong hệ thống' });
    }

    // Tạo mã OTP
    const otp = generateOTP();
    
    // Lưu OTP vào store với thời gian hết hạn 5 phút
    otpStore.set(emailOrPhone, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 phút
      userId: account._id
    });

    // Gửi email chứa OTP
    if (emailOrPhone.includes('@')) {
      // Sử dụng email service để gửi OTP qua email
      const emailSent = await emailService.sendPasswordResetOTP(emailOrPhone, otp);
      
      if (!emailSent) {
        return res.status(500).json({ message: 'Không thể gửi mã xác nhận qua email. Vui lòng thử lại sau.' });
      }
      
      console.log('Email chứa OTP đã được gửi đến:', emailOrPhone);
    } else {
      // Trong trường hợp thực tế, bạn sẽ tích hợp với dịch vụ SMS ở đây
      console.log('Gửi SMS chứa OTP đến số điện thoại:', emailOrPhone, 'với mã:', otp);
    }

    res.status(200).json({ 
      message: 'Mã xác nhận đã được gửi',
      contact: emailOrPhone
    });
  } catch (error) {
    console.error('Lỗi khi gửi OTP:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi gửi mã xác nhận' });
  }
};

// Xác thực OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { emailOrPhone, otp } = req.body;

    if (!emailOrPhone || !otp) {
      return res.status(400).json({ message: 'Email/SĐT và mã OTP không được để trống' });
    }

    // Kiểm tra OTP
    const otpData = otpStore.get(emailOrPhone);
    
    if (!otpData) {
      return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn' });
    }

    if (otpData.expiresAt < Date.now()) {
      otpStore.delete(emailOrPhone);
      return res.status(400).json({ message: 'Mã OTP đã hết hạn' });
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({ message: 'Mã OTP không chính xác' });
    }

    // OTP hợp lệ, trả về token để reset password
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Lưu token vào store
    otpStore.set(emailOrPhone, {
      ...otpData,
      resetToken,
      tokenExpiresAt: Date.now() + 15 * 60 * 1000 // 15 phút
    });

    res.status(200).json({ 
      message: 'Xác thực thành công',
      resetToken,
      userId: otpData.userId
    });
  } catch (error) {
    console.error('Lỗi khi xác thực OTP:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi xác thực mã OTP' });
  }
};

// Đặt lại mật khẩu
exports.resetPassword = async (req, res) => {
  try {
    const { emailOrPhone, resetToken, newPassword } = req.body;

    if (!emailOrPhone || !resetToken || !newPassword) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
    }

    // Kiểm tra token
    const tokenData = otpStore.get(emailOrPhone);
    
    if (!tokenData || tokenData.resetToken !== resetToken) {
      return res.status(400).json({ message: 'Token không hợp lệ' });
    }

    if (tokenData.tokenExpiresAt < Date.now()) {
      otpStore.delete(emailOrPhone);
      return res.status(400).json({ message: 'Token đã hết hạn, vui lòng thực hiện lại quá trình' });
    }

    // Cập nhật mật khẩu
    await accountService.updateAccount(tokenData.userId, { password: newPassword });

    // Xóa token
    otpStore.delete(emailOrPhone);

    res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    console.error('Lỗi khi đặt lại mật khẩu:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi đặt lại mật khẩu' });
  }
};
