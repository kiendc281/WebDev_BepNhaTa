const accountService = require('../services/accountService');
const Account = require('../models/account');
const nodemailer = require('nodemailer');
require('dotenv').config();
const crypto = require('crypto');

// Lưu trữ mã OTP tạm thời (trong thực tế nên lưu vào database)
const otpStore = new Map();

// Cấu hình nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

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
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: emailOrPhone,
        subject: 'Mã xác nhận đặt lại mật khẩu - Bếp Nhà Ta',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #d35400; text-align: center;">Bếp Nhà Ta</h2>
            <p>Xin chào,</p>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã OTP sau để xác nhận:</p>
            <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p>Mã này sẽ hết hạn sau 5 phút.</p>
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #777; text-align: center;">
              ${new Date().getFullYear()} Bếp Nhà Ta. Tất cả các quyền được bảo lưu.
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
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
