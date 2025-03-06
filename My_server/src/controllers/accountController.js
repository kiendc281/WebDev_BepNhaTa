const Account = require('../models/account');

// Định nghĩa các phương thức xử lý
const accountController = {
    // Lấy tất cả accounts
    getAllAccounts: async (req, res) => {
        try {
            let accounts = await Account.find();
            res.json(accounts);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Lấy account theo id
    getAccountById: async (req, res) => {
        try {
            let account = await Account.findById(req.params.id);
            res.json(account);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Tạo account mới
    createAccount: async (req, res) => {
        const account = new Account({
            name: req.body.name,
            price: req.body.price
        });
        try {
            const savedAccount = await account.save();
            console.log(savedAccount);
            res.json({ message: "success" });
        } catch (error) {
            res.json({ message: error.message });
        }
    },

    // Cập nhật account
    updateAccount: async (req, res) => {
        try {
            await Account.updateOne(
                { _id: req.params.id },
                { $set: { name: req.body.name, price: req.body.price } }
            );
            res.json({ message: "success" });
        } catch (error) {
            res.json({ message: error.message });
        }
    },

    // Xóa account
    deleteAccount: async (req, res) => {
        try {
            await Account.deleteOne({ _id: req.params.id });
            res.json({ message: "success" });
        } catch (error) {
            res.json({ message: error.message });
        }
    }
};

module.exports = accountController;
