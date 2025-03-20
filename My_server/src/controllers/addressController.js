const Address = require('../models/address');
const mongoose = require('mongoose');

/**
 * Lấy tất cả địa chỉ không phân biệt người dùng
 */
exports.getAllAddresses = async (req, res) => {
    try {
        const addresses = await Address.find().sort({ createdAt: -1 });
        
        return res.status(200).json({
            status: 'success',
            count: addresses.length,
            data: addresses
        });
    } catch (error) {
        console.error('Lỗi khi lấy tất cả địa chỉ:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi lấy tất cả địa chỉ: ' + error.message
        });
    }
};

/**
 * Lấy tất cả địa chỉ của 1 người dùng
 */
exports.getAddressesByUser = async (req, res) => {
    try {
        const { accountId } = req.params;
        
        if (!accountId) {
            return res.status(400).json({
                status: 'error',
                message: 'ID tài khoản không được để trống'
            });
        }

        const addresses = await Address.find({ accountId }).sort({ isDefault: -1, createdAt: -1 });
        
        return res.status(200).json({
            status: 'success',
            data: addresses
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách địa chỉ:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi lấy danh sách địa chỉ: ' + error.message
        });
    }
};

/**
 * Lấy 1 địa chỉ theo ID
 */
exports.getAddressById = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                status: 'error',
                message: 'ID địa chỉ không được để trống'
            });
        }

        // Kiểm tra ID có hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'ID địa chỉ không hợp lệ'
            });
        }

        const address = await Address.findById(id);
        
        if (!address) {
            return res.status(404).json({
                status: 'error',
                message: 'Địa chỉ không tồn tại'
            });
        }
        
        return res.status(200).json({
            status: 'success',
            data: address
        });
    } catch (error) {
        console.error('Lỗi khi lấy thông tin địa chỉ:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi lấy thông tin địa chỉ: ' + error.message
        });
    }
};

/**
 * Thêm địa chỉ mới
 */
exports.createAddress = async (req, res) => {
    try {
        const { accountId, recipientName, recipientPhone, city, district, ward, detail, isDefault, email } = req.body;
        
        // Kiểm tra các trường bắt buộc
        if (!accountId || !recipientName || !recipientPhone || !city || !district || !ward || !detail) {
            return res.status(400).json({
                status: 'error',
                message: 'Vui lòng nhập đầy đủ thông tin địa chỉ'
            });
        }

        // Nếu đây là địa chỉ mặc định, cần cập nhật các địa chỉ khác
        if (isDefault) {
            await Address.updateMany(
                { accountId, isDefault: true },
                { $set: { isDefault: false } }
            );
        }

        // Tạo địa chỉ mới
        const newAddress = new Address({
            accountId,
            recipientName,
            recipientPhone,
            email,
            city,
            district,
            ward,
            detail,
            isDefault: isDefault || false
        });

        // Lưu vào database
        const savedAddress = await newAddress.save();
        
        return res.status(201).json({
            status: 'success',
            message: 'Thêm địa chỉ thành công',
            data: savedAddress
        });
    } catch (error) {
        console.error('Lỗi khi thêm địa chỉ mới:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi thêm địa chỉ mới: ' + error.message
        });
    }
};

/**
 * Cập nhật địa chỉ
 */
exports.updateAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const { recipientName, recipientPhone, city, district, ward, detail, isDefault, email } = req.body;
        
        if (!id) {
            return res.status(400).json({
                status: 'error',
                message: 'ID địa chỉ không được để trống'
            });
        }

        // Kiểm tra ID có hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'ID địa chỉ không hợp lệ'
            });
        }

        // Kiểm tra địa chỉ có tồn tại không
        const address = await Address.findById(id);
        if (!address) {
            return res.status(404).json({
                status: 'error',
                message: 'Địa chỉ không tồn tại'
            });
        }

        // Nếu đây là địa chỉ mặc định, cần cập nhật các địa chỉ khác
        if (isDefault) {
            await Address.updateMany(
                { accountId: address.accountId, isDefault: true },
                { $set: { isDefault: false } }
            );
        }

        // Cập nhật địa chỉ
        const updatedAddress = await Address.findByIdAndUpdate(id, {
            recipientName: recipientName || address.recipientName,
            recipientPhone: recipientPhone || address.recipientPhone,
            email: email !== undefined ? email : address.email,
            city: city || address.city,
            district: district || address.district,
            ward: ward || address.ward,
            detail: detail || address.detail,
            isDefault: isDefault !== undefined ? isDefault : address.isDefault
        }, { new: true });
        
        return res.status(200).json({
            status: 'success',
            message: 'Cập nhật địa chỉ thành công',
            data: updatedAddress
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật địa chỉ:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi cập nhật địa chỉ: ' + error.message
        });
    }
};

/**
 * Xóa địa chỉ
 */
exports.deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                status: 'error',
                message: 'ID địa chỉ không được để trống'
            });
        }

        // Kiểm tra ID có hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'ID địa chỉ không hợp lệ'
            });
        }

        // Kiểm tra địa chỉ có tồn tại không
        const address = await Address.findById(id);
        if (!address) {
            return res.status(404).json({
                status: 'error',
                message: 'Địa chỉ không tồn tại'
            });
        }

        // Xóa địa chỉ
        await Address.findByIdAndDelete(id);
        
        return res.status(200).json({
            status: 'success',
            message: 'Xóa địa chỉ thành công'
        });
    } catch (error) {
        console.error('Lỗi khi xóa địa chỉ:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi xóa địa chỉ: ' + error.message
        });
    }
};

/**
 * Đặt một địa chỉ là mặc định
 */
exports.setDefaultAddress = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                status: 'error',
                message: 'ID địa chỉ không được để trống'
            });
        }

        // Kiểm tra ID có hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'ID địa chỉ không hợp lệ'
            });
        }

        // Kiểm tra địa chỉ có tồn tại không
        const address = await Address.findById(id);
        if (!address) {
            return res.status(404).json({
                status: 'error',
                message: 'Địa chỉ không tồn tại'
            });
        }

        // Cập nhật tất cả địa chỉ của người dùng thành không mặc định
        await Address.updateMany(
            { accountId: address.accountId },
            { $set: { isDefault: false } }
        );

        // Cập nhật địa chỉ được chọn thành mặc định
        const updatedAddress = await Address.findByIdAndUpdate(id, {
            isDefault: true
        }, { new: true });
        
        return res.status(200).json({
            status: 'success',
            message: 'Đặt địa chỉ mặc định thành công',
            data: updatedAddress
        });
    } catch (error) {
        console.error('Lỗi khi đặt địa chỉ mặc định:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi đặt địa chỉ mặc định: ' + error.message
        });
    }
}; 