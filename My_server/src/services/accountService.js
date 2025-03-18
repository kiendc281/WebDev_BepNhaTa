const Account = require("../models/account");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

class AccountService {
  // Xử lý đăng ký
  async register(userData) {
    const { password, name, email, phone, role, gender, birthOfDate } =
      userData;

    // Kiểm tra email tồn tại
    const existingEmail = await Account.findOne({ email });
    if (existingEmail) {
      throw new Error("Email đã được sử dụng");
    }

    // Kiểm tra phone tồn tại
    const existingPhone = await Account.findOne({ phone });
    if (existingPhone) {
      throw new Error("Số điện thoại đã được sử dụng");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo tài khoản mới
    const account = new Account({
      password: hashedPassword,
      name,
      email,
      phone,
      gender,
      birthOfDate,
    });

    const savedAccount = await account.save();

    // Tạo token
    const token = this.generateToken(savedAccount._id);

    return {
      token,
      account: {
        id: savedAccount._id,
        name: savedAccount.name,
        email: savedAccount.email,
        phone: savedAccount.phone,
        gender: savedAccount.gender,
        birthOfDate: savedAccount.birthOfDate,
      },
    };
  }

  // Xử lý đăng nhập
  async login(credentials) {
    try {
      const { account, password } = credentials; // account có thể là email hoặc phone

      // Tìm tài khoản theo email hoặc số điện thoại
      const foundAccount = await Account.findOne({
        $or: [{ email: account }, { phone: account }],
      });

      // Nếu không tìm thấy tài khoản
      if (!foundAccount) {
        throw new Error("Email/Số điện thoại hoặc mật khẩu không đúng");
      }

      // Kiểm tra password
      const isMatch = await bcrypt.compare(password, foundAccount.password);
      if (!isMatch) {
        throw new Error("Email/Số điện thoại hoặc mật khẩu không đúng");
      }

      // Tạo token
      const token = this.generateToken(foundAccount._id);

      return {
        success: true,
        message: "Đăng nhập thành công",
        token,
        account: {
          id: foundAccount._id,
          name: foundAccount.name,
          email: foundAccount.email,
          phone: foundAccount.phone,
          gender: foundAccount.gender,
          birthOfDate: foundAccount.birthOfDate,
          role: foundAccount.role,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Tạo account mới
  async createAccount(accountData) {
    try {
      const { password, name, birthOfDate, email, phone, gender, role } =
        accountData;

      // Kiểm tra email và phone tồn tại
      const existingAccount = await Account.findOne({
        $or: [{ email }, { phone }],
      });
      if (existingAccount) {
        throw new Error("Email hoặc số điện thoại đã tồn tại");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Tạo account với _id
      const account = new Account({
        _id: new mongoose.Types.ObjectId(),
        password: hashedPassword,
        name,
        birthOfDate,
        email,
        phone,
        gender,
        role: role || "customer",
      });

      const savedAccount = await account.save();
      return savedAccount;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Lấy tất cả accounts
  async getAllAccounts() {
    try {
      return await Account.find().select("-password"); // Không trả về password
    } catch (error) {
      throw new Error("Không thể lấy danh sách tài khoản");
    }
  }

  // Lấy account theo ID
  async getAccountById(id) {
    try {
      const account = await Account.findById(id).select("-password");
      if (!account) {
        throw new Error("Không tìm thấy tài khoản");
      }
      return account;
    } catch (error) {
      throw new Error("Không tìm thấy tài khoản");
    }
  }

  // Cập nhật account
  async updateAccount(id, updateData) {
    try {
      // Nếu có password trong dữ liệu cập nhật, hash nó
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const account = await Account.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: Date.now() },
        { new: true }
      ).select("-password");

      if (!account) {
        throw new Error("Không tìm thấy tài khoản");
      }

      return account;
    } catch (error) {
      throw new Error("Cập nhật thất bại: " + error.message);
    }
  }

  // Xóa account
  async deleteAccount(id) {
    try {
      const account = await Account.findByIdAndDelete(id);
      if (!account) {
        throw new Error("Không tìm thấy tài khoản");
      }
      return account;
    } catch (error) {
      throw new Error("Xóa thất bại: " + error.message);
    }
  }

  // Cập nhật mật khẩu
  async updatePassword(id, passwordData) {
    try {
      const { oldPassword, newPassword } = passwordData;

      // Tìm tài khoản
      const account = await Account.findById(id);
      if (!account) {
        throw new Error("Không tìm thấy tài khoản");
      }

      // Kiểm tra mật khẩu cũ
      const isMatch = await bcrypt.compare(oldPassword, account.password);
      if (!isMatch) {
        throw new Error(
          "Bạn đã nhập sai mật khẩu cũ. Vui lòng kiểm tra và thử lại."
        );
      }

      // Hash mật khẩu mới
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Cập nhật mật khẩu
      account.password = hashedPassword;
      await account.save();

      return { message: "Cập nhật mật khẩu thành công" };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Tạo JWT token
  generateToken(accountId) {
    return jwt.sign({ accountId }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
  }
}

module.exports = new AccountService();
