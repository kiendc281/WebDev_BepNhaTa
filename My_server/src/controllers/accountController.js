const accountService = require("../services/accountService");

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
