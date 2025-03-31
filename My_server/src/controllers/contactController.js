const emailService = require('../services/emailService');
require('dotenv').config();

// Controller xử lý gửi email liên hệ
exports.sendContactEmail = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!name || !email || !phone || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng cung cấp đầy đủ thông tin' 
      });
    }

    // Gửi email liên hệ sử dụng email service
    const result = await emailService.sendContactEmail({ name, email, phone, message });
    
    if (!result) {
      return res.status(500).json({ 
        success: false, 
        message: 'Không thể gửi thắc mắc. Vui lòng thử lại sau' 
      });
    }

    // Trả về kết quả thành công
    return res.status(200).json({ 
      success: true, 
      message: 'Gửi thắc mắc thành công' 
    });
  } catch (error) {
    console.error('Lỗi khi gửi email thắc mắc:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Đã xảy ra lỗi khi gửi email', 
      error: error.message 
    });
  }
};
