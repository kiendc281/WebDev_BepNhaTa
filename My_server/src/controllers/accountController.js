const accountService = require("../services/accountService");
const emailService = require("../services/emailService");
const Account = require("../models/account");
const crypto = require('crypto');

// Store OTP codes temporarily (in memory)
// In a production environment, this should be stored in Redis or another database
const otpStore = new Map();

// Helper to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const accountController = {
  // Đăng ký
  register: async (req, res) => {
    try {
      const result = await accountService.register(req.body);
      res.status(201).json({
        message: "Đăng ký thành công",
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  },

  // Đăng nhập
  login: async (req, res) => {
    try {
      const result = await accountService.login(req.body);
      res.json({
        message: "Đăng nhập thành công",
        ...result,
      });
    } catch (error) {
      res.status(401).json({
        message: error.message,
      });
    }
  },

  // Yêu cầu mã OTP đăng ký
  requestRegistrationOTP: async (req, res) => {
    try {
      const { email, name } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email không được để trống' });
      }
      
      // Kiểm tra email đã tồn tại chưa
      const existingAccount = await Account.findOne({ email });
      if (existingAccount) {
        return res.status(400).json({ message: 'Email này đã được đăng ký' });
      }
      
      // Tạo mã OTP
      const otp = generateOTP();
      
      // Lưu OTP vào store với thời gian hết hạn 10 phút
      otpStore.set(email, {
        otp,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 phút
        userData: req.body // Lưu dữ liệu đăng ký
      });
      
      // Gửi email chứa OTP
      const emailSent = await emailService.sendRegistrationOTP(email, otp, name);
      
      if (!emailSent) {
        return res.status(500).json({ message: 'Không thể gửi mã xác nhận qua email. Vui lòng thử lại sau.' });
      }
      
      console.log(`✅ Đã gửi OTP đăng ký đến: ${email}`);
      
      res.status(200).json({ 
        message: 'Mã xác nhận đã được gửi',
        email
      });
    } catch (error) {
      console.error('Lỗi khi gửi OTP đăng ký:', error);
      res.status(500).json({ message: 'Đã xảy ra lỗi khi gửi mã xác nhận' });
    }
  },
  
  // Xác thực OTP đăng ký và hoàn tất đăng ký
  verifyRegistrationOTP: async (req, res) => {
    try {
      const { email, otp, name, phone, password, gender, birthOfDate } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ message: 'Email và mã OTP không được để trống' });
      }
      
      console.log('Verifying OTP for:', email);
      
      // Kiểm tra OTP
      const otpData = otpStore.get(email);
      
      if (!otpData) {
        return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn' });
      }
      
      if (otpData.expiresAt < Date.now()) {
        otpStore.delete(email);
        return res.status(400).json({ message: 'Mã OTP đã hết hạn' });
      }
      
      if (otpData.otp !== otp) {
        return res.status(400).json({ message: 'Mã OTP không chính xác' });
      }
      
      // OTP hợp lệ, tiến hành đăng ký
      // Dữ liệu đăng ký, ưu tiên lấy từ request hiện tại nếu có
      const registrationData = {
        email,
        name: name || otpData.userData.name,
        phone: phone || otpData.userData.phone,
        password: password || otpData.userData.password
      };
      
      // Thêm các trường tùy chọn
      if (gender || otpData.userData.gender) {
        registrationData.gender = gender || otpData.userData.gender;
      }
      
      if (birthOfDate || otpData.userData.birthOfDate) {
        registrationData.birthOfDate = birthOfDate || otpData.userData.birthOfDate;
      }
      
      // Log dữ liệu (ẩn mật khẩu)
      console.log('Registration data:', {
        ...registrationData,
        password: '[PROTECTED]'
      });
      
      // Xóa OTP khỏi store
      otpStore.delete(email);
      
      try {
        // Tạo tài khoản
        const result = await accountService.register(registrationData);
        
        res.status(201).json({
          message: 'Đăng ký thành công',
          ...result
        });
      } catch (registerError) {
        console.error('Lỗi khi đăng ký tài khoản:', registerError);
        // Trả về lỗi cụ thể từ quá trình đăng ký
        return res.status(400).json({ 
          message: registerError.message || 'Lỗi khi đăng ký tài khoản',
          error: registerError.toString()
        });
      }
    } catch (error) {
      console.error('Lỗi khi xác thực OTP đăng ký:', error);
      res.status(500).json({ 
        message: 'Đã xảy ra lỗi khi xác thực đăng ký',
        error: error.toString()
      });
    }
  },

  // Lấy tất cả accounts
  getAllAccounts: async (req, res) => {
    try {
      const accounts = await accountService.getAllAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  },

  // Lấy account theo id
  getAccountById: async (req, res) => {
    try {
      const account = await accountService.getAccountById(req.params.id);
      res.json(account);
    } catch (error) {
      res.status(404).json({
        message: error.message,
      });
    }
  },
  // Tạo account
  createAccount: async (req, res) => {
    try {
      const result = await accountService.createAccount(req.body);
      res.status(201).json({
        message: "Tạo account thành công",
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  },
  // Cập nhật account
  updateAccount: async (req, res) => {
    try {
      await accountService.updateAccount(req.params.id, req.body);
      res.json({
        message: "Cập nhật thành công",
      });
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  },

  // Cập nhật mật khẩu
  updatePassword: async (req, res) => {
    try {
      await accountService.updatePassword(req.params.id, req.body);
      res.json({
        message: "Cập nhật mật khẩu thành công",
      });
    } catch (error) {
      res.status(400).json({
        message: error.message || "Có lỗi xảy ra khi cập nhật mật khẩu",
      });
    }
  },

  // Xóa account
  deleteAccount: async (req, res) => {
    try {
      await accountService.deleteAccount(req.params.id);
      res.json({
        message: "Xóa thành công",
      });
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  },
};

module.exports = accountController;
