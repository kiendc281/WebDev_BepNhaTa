const nodemailer = require('nodemailer');
require('dotenv').config();

// Cấu hình transporter cho Nodemailer
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

    console.log('Attempting to send email with the following config:');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASSWORD length:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 0);
    console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);

    // Cấu hình email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || 'bepnhata@gmail.com', // Email nhận phản hồi
      subject: `Thắc mắc từ khách hàng: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #ff6600; text-align: center; margin-bottom: 20px;">Thắc Mắc Từ Khách Hàng</h2>
          <div style="margin-bottom: 15px;">
            <strong>Họ và tên:</strong> ${name}
          </div>
          <div style="margin-bottom: 15px;">
            <strong>Email:</strong> ${email}
          </div>
          <div style="margin-bottom: 15px;">
            <strong>Số điện thoại:</strong> ${phone}
          </div>
          <div style="margin-bottom: 15px;">
            <strong>Nội dung:</strong>
            <p style="background-color: #f9f9f9; padding: 10px; border-radius: 5px;">${message}</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #888;">
            <p>Email này được gửi tự động từ hệ thống Bếp Nhà Ta</p>
          </div>
        </div>
      `
    };

    // Gửi email
    await transporter.sendMail(mailOptions);

    // Trả về kết quả thành công
    return res.status(200).json({ 
      success: true, 
      message: 'Gửi thắc mắc thành công' 
    });
  } catch (error) {
    console.error('Lỗi khi gửi email:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Đã xảy ra lỗi khi gửi email', 
      error: error.message 
    });
  }
};
