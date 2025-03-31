const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Email Service - Dịch vụ quản lý và gửi email tập trung
 * Xử lý tất cả các chức năng liên quan đến email trong hệ thống
 */
class EmailService {
  constructor() {
    // Khởi tạo transporter một lần duy nhất khi dịch vụ được tạo
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // Kiểm tra cấu hình email
    this.checkEmailConfig();
  }
  
  /**
   * Kiểm tra cấu hình email khi khởi tạo service
   */
  async checkEmailConfig() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('⚠️ CẢNH BÁO: Thiếu cấu hình email. Các chức năng gửi email sẽ không hoạt động.');
      return false;
    }
    
    try {
      // Kiểm tra kết nối với SMTP server
      await this.transporter.verify();
      console.log('✅ Kết nối máy chủ email thành công, hệ thống email sẵn sàng hoạt động.');
      return true;
    } catch (error) {
      console.error('❌ Không thể kết nối với máy chủ email:', error.message);
      return false;
    }
  }
  
  /**
   * Gửi email với cơ chế thử lại
   * @param {Object} mailOptions - Tùy chọn email
   * @param {number} maxRetries - Số lần thử lại tối đa
   * @returns {Promise<boolean>} - Kết quả gửi email
   */
  async sendEmail(mailOptions, maxRetries = 3) {
    let retries = 0;
    
    const tryToSendEmail = async () => {
      try {
        // Kiểm tra thông tin người nhận
        if (!mailOptions.to) {
          console.error('Không có địa chỉ email người nhận');
          return false;
        }
        
        // Kiểm tra định dạng email
        if (!this.isValidEmail(mailOptions.to)) {
          console.error('Địa chỉ email không hợp lệ:', mailOptions.to);
          return false;
        }
        
        // Đảm bảo có email người gửi
        if (!mailOptions.from) {
          mailOptions.from = process.env.EMAIL_USER;
        }
        
        // Gửi email
        await this.transporter.sendMail(mailOptions);
        console.log(`✅ Đã gửi email thành công đến: ${mailOptions.to}`);
        return true;
      } catch (error) {
        console.error(`❌ Lỗi gửi email lần thử ${retries + 1}/${maxRetries}:`, error.message);
        
        // Thử lại nếu chưa đạt số lần tối đa
        if (retries < maxRetries - 1) {
          retries++;
          console.log(`⏱️ Đang thử lại lần ${retries + 1}...`);
          // Đợi 2 giây trước khi thử lại
          await new Promise(resolve => setTimeout(resolve, 2000));
          return await tryToSendEmail();
        }
        
        console.error('❌ Đã thử gửi email tối đa số lần nhưng thất bại.');
        return false;
      }
    };
    
    return await tryToSendEmail();
  }
  
  /**
   * Kiểm tra định dạng email hợp lệ
   * @param {string} email - Địa chỉ email cần kiểm tra
   * @returns {boolean} - Kết quả kiểm tra
   */
  isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Gửi email xác nhận đơn hàng
   * @param {Object} orderData - Dữ liệu đơn hàng
   * @param {string} emailTo - Email người nhận
   * @returns {Promise<boolean>} - Kết quả gửi email
   */
  async sendOrderConfirmation(orderData, emailTo) {
    try {
      // Định dạng lại ngày đặt hàng
      const orderDate = new Date(orderData.orderDate).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Tạo HTML cho các sản phẩm trong đơn hàng
      const itemsHtml = orderData.itemOrder.map(item => {
        // Kiểm tra URL hình ảnh hợp lệ, nếu không thì hiển thị ảnh thay thế
        const imageUrl = item.img && item.img.startsWith('http') ? 
          item.img : 
          'https://placehold.co/100x100/orange/white?text=BepNhaTa';
         
        return `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
              <div style="display: flex; align-items: center;">
                <img src="${imageUrl}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; margin-right: 10px; border-radius: 4px;">
                <div>
                  <p style="margin: 0; font-weight: 500;">${item.name}</p>
                  <p style="margin: 3px 0 0; color: #666; font-size: 14px;">Khẩu phần: ${item.servingSize}</p>
                </div>
              </div>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">${item.totalPrice.toLocaleString('vi-VN')}₫</td>
          </tr>
      `;}).join('');

      // Địa chỉ giao hàng
      let shippingAddress = '';
      if (orderData.addressId && orderData.addressId.address) {
        shippingAddress = orderData.addressId.address;
      } else if (orderData.guestInfo && orderData.guestInfo.address) {
        shippingAddress = orderData.guestInfo.address;
      }

      // Thông tin người nhận
      const recipientName = orderData.guestInfo ? orderData.guestInfo.fullName : (orderData.addressId ? orderData.addressId.fullName : '');
      const recipientPhone = orderData.guestInfo ? orderData.guestInfo.phone : (orderData.addressId ? orderData.addressId.phone : '');

      // Cấu hình email
      const mailOptions = {
        to: emailTo,
        subject: `Xác nhận đơn hàng #${orderData._id} - Bếp Nhà Ta`,
        html: this.getOrderConfirmationTemplate(
          orderData, 
          recipientName, 
          recipientPhone, 
          shippingAddress, 
          orderDate, 
          itemsHtml
        )
      };

      // Gửi email
      return await this.sendEmail(mailOptions);
    } catch (error) {
      console.error('Lỗi khi tạo email xác nhận đơn hàng:', error);
      return false;
    }
  }
  
  /**
   * Gửi mã OTP để đặt lại mật khẩu
   * @param {string} emailTo - Email người nhận
   * @param {string} otp - Mã OTP
   * @returns {Promise<boolean>} - Kết quả gửi email
   */
  async sendPasswordResetOTP(emailTo, otp) {
    const mailOptions = {
      to: emailTo,
      subject: 'Mã xác nhận đặt lại mật khẩu - Bếp Nhà Ta',
      html: this.getPasswordResetOTPTemplate(otp)
    };
    
    return await this.sendEmail(mailOptions);
  }
  
  /**
   * Gửi email chứa thắc mắc từ khách hàng đến admin
   * @param {Object} contactData Thông tin liên hệ từ khách hàng
   * @returns {Promise<boolean>} Kết quả gửi email
   */
  async sendContactEmail(contactData) {
    try {
      const { name, email, phone, message } = contactData;
      
      // Validate email
      if (!this.isValidEmail(email)) {
        console.log(`❌ Địa chỉ email không hợp lệ: ${email}`);
        return false;
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        replyTo: email,
        subject: `Thắc mắc từ khách hàng: ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #d35400; text-align: center;">Bếp Nhà Ta - Thắc mắc từ khách hàng</h2>
            
            <div style="margin: 20px 0; background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
              <p><strong>Họ tên:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Số điện thoại:</strong> ${phone}</p>
              <p><strong>Nội dung thắc mắc:</strong></p>
              <div style="background-color: #fff; padding: 10px; border-left: 3px solid #d35400;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
            
            <p style="margin-top: 30px; font-size: 12px; color: #777; text-align: center;">
              © ${new Date().getFullYear()} Bếp Nhà Ta. Tất cả các quyền được bảo lưu.
            </p>
          </div>
        `
      };

      return await this.sendEmail(mailOptions);
    } catch (error) {
      console.error('❌ Lỗi khi gửi email thắc mắc:', error);
      return false;
    }
  }
  
  /**
   * Lấy template HTML cho email xác nhận đơn hàng
   */
  getOrderConfirmationTemplate(orderData, recipientName, recipientPhone, shippingAddress, orderDate, itemsHtml) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; background-color: #ff6600; color: white; font-weight: bold; font-size: 28px; padding: 10px 20px; border-radius: 8px; letter-spacing: 1px; margin-bottom: 15px;">
            BẾP NHÀ TA
            <div style="font-size: 14px; font-weight: normal; margin-top: 5px;">Mang yêu thương đến căn bếp của bạn</div>
          </div>
          <h2 style="color: #ff6600; margin-top: 10px;">Xác Nhận Đơn Hàng</h2>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 16px;">Xin chào <strong>${recipientName}</strong>,</p>
          <p style="margin-top: 10px;">Cảm ơn bạn đã đặt hàng tại <strong>Bếp Nhà Ta</strong>. Chúng tôi đã nhận được đơn hàng của bạn và sẽ xử lý trong thời gian sớm nhất!</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #333; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">Thông Tin Đơn Hàng #${orderData._id}</h3>
          <p><strong>Ngày đặt hàng:</strong> ${orderDate}</p>
          <p><strong>Trạng thái:</strong> <span style="background-color: #e6f7ff; color: #0066cc; padding: 3px 8px; border-radius: 4px; font-size: 14px;">${orderData.status}</span></p>
          <p><strong>Phương thức thanh toán:</strong> ${orderData.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng'}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #333; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">Thông Tin Giao Hàng</h3>
          <p><strong>Người nhận:</strong> ${recipientName}</p>
          <p><strong>Số điện thoại:</strong> ${recipientPhone}</p>
          <p><strong>Địa chỉ giao hàng:</strong> ${shippingAddress}</p>
          ${orderData.guestInfo && orderData.guestInfo.note ? `<p><strong>Ghi chú:</strong> ${orderData.guestInfo.note}</p>` : ''}
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #333; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">Chi Tiết Đơn Hàng</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 12px; background-color: #f2f2f2; border-bottom: 2px solid #ddd;">Sản phẩm</th>
                <th style="text-align: center; padding: 12px; background-color: #f2f2f2; border-bottom: 2px solid #ddd;">Số lượng</th>
                <th style="text-align: right; padding: 12px; background-color: #f2f2f2; border-bottom: 2px solid #ddd;">Giá</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>
        
        <div style="margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 8px;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px 0;">Tạm tính:</td>
              <td style="text-align: right; padding: 8px 0;">${orderData.prePrice.toLocaleString('vi-VN')}₫</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">Giảm giá:</td>
              <td style="text-align: right; padding: 8px 0;">-${orderData.discount.toLocaleString('vi-VN')}₫</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">Phí vận chuyển:</td>
              <td style="text-align: right; padding: 8px 0;">${orderData.shippingFee.toLocaleString('vi-VN')}₫</td>
            </tr>
            <tr style="font-weight: bold; font-size: 18px;">
              <td style="padding: 12px 0; border-top: 2px solid #ddd;">Tổng cộng:</td>
              <td style="text-align: right; padding: 12px 0; border-top: 2px solid #ddd; color: #ff6600;">${orderData.totalPrice.toLocaleString('vi-VN')}₫</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi:</p>
          <p>Email: <a href="mailto:bepnhata@gmail.com" style="color: #0066cc;">bepnhata@gmail.com</a> | Điện thoại: <a href="tel:0987654321" style="color: #0066cc;">0987 654 321</a></p>
          <p>&copy; ${new Date().getFullYear()} Bếp Nhà Ta. Đã đăng ký bản quyền.</p>
        </div>
      </div>
    `;
  }
  
  /**
   * Lấy template HTML cho email mã OTP đặt lại mật khẩu
   */
  getPasswordResetOTPTemplate(otp) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; background-color: #ff6600; color: white; font-weight: bold; font-size: 24px; padding: 10px 20px; border-radius: 8px; letter-spacing: 1px; margin-bottom: 15px;">
            BẾP NHÀ TA
          </div>
        </div>
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
    `;
  }
}

module.exports = new EmailService();