const favoriteService = require('../services/favoriteService');

const favoriteController = {
    // Thêm vào yêu thích
    addToFavorites: async (req, res) => {
        try {
            // Kiểm tra dữ liệu đầu vào
            const { accountId, targetId, type } = req.body;
            
            if (!accountId || !targetId || !type) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin cần thiết: accountId, targetId, hoặc type'
                });
            }
            
            const result = await favoriteService.addFavorite(req.body);
            
            // Kiểm tra nếu đã tồn tại
            if (result.alreadyExists) {
                return res.status(200).json({
                    success: true,
                    message: 'Đã tồn tại trong danh sách yêu thích',
                    favoriteId: result._id
                });
            }
            
            res.status(201).json({
                success: true,
                message: 'Đã thêm vào yêu thích',
                favoriteId: result._id
            });
        } catch (error) {
            console.error('Error in addToFavorites:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Xóa khỏi yêu thích
    removeFromFavorites: async (req, res) => {
        try {
            const { accountId, targetId, type } = req.query;
            
            if (!accountId || !targetId || !type) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin cần thiết: accountId, targetId, hoặc type'
                });
            }
            
            await favoriteService.removeFavorite(accountId, targetId, type);
            res.status(200).json({
                success: true,
                message: 'Đã xóa khỏi yêu thích'
            });
        } catch (error) {
            console.error('Error in removeFromFavorites:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Kiểm tra đã yêu thích chưa
    checkFavorite: async (req, res) => {
        try {
            const { accountId, targetId, type } = req.query;
            
            if (!accountId || !targetId || !type) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin cần thiết: accountId, targetId, hoặc type'
                });
            }
            
            const exists = await favoriteService.checkFavorite(accountId, targetId, type);
            res.status(200).json({
                success: true,
                exists
            });
        } catch (error) {
            console.error('Error in checkFavorite:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Lấy danh sách yêu thích
    getFavorites: async (req, res) => {
        try {
            const { accountId, type } = req.query;
            
            if (!accountId) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin cần thiết: accountId'
                });
            }
            
            const favorites = await favoriteService.getFavorites(accountId, type);
            res.status(200).json(favorites);
        } catch (error) {
            console.error('Error in getFavorites:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Lấy danh sách yêu thích với chi tiết đầy đủ theo loại
    getFavoritesWithDetails: async (req, res) => {
        try {
            const { accountId } = req.query;
            const { type } = req.params;
            
            if (!accountId) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin cần thiết: accountId'
                });
            }
            
            if (!type || !['blog', 'recipe', 'product'].includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Loại không hợp lệ. Chỉ hỗ trợ: blog, recipe, product'
                });
            }
            
            const favorites = await favoriteService.getFavoritesWithDetails(accountId, type);
            res.status(200).json(favorites);
        } catch (error) {
            console.error(`Error in getFavoritesWithDetails for ${req.params.type}:`, error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    toggleFavorite: async (req, res) => {
        try {
            const { accountId, targetId, type } = req.body;
            
            // Kiểm tra favorite đã tồn tại chưa
            const existingFavorite = await favoriteService.checkFavorite(accountId, targetId, type);
            
            if (existingFavorite) {
                // Nếu đã tồn tại, xóa khỏi favorites
                await favoriteService.removeFavorite(accountId, targetId, type);
                res.status(200).json({ message: 'Removed from favorites' });
            } else {
                // Nếu chưa tồn tại, thêm vào favorites  
                const newFavorite = await favoriteService.addFavorite(req.body);
                res.status(200).json(newFavorite);
            }
        } catch (error) {
            console.error('Error in toggleFavorite:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = favoriteController; 