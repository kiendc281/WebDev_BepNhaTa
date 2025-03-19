const Favorite = require('../models/favorite');
const mongoose = require('mongoose');
const Blog = require('../models/blog');
const Recipe = require('../models/recipe');
const Ingredient = require('../models/ingredient');

// Chuyển đổi ID sản phẩm (ingredients) từ định dạng GNLxx thành ObjectId
function convertProductId(id) {
    // Nếu id đã là ObjectId hợp lệ, trả về nguyên gốc
    if (mongoose.Types.ObjectId.isValid(id)) {
        return id;
    }
    
    // Xử lý đặc biệt cho trường hợp GNL01, GNL05 hoặc AC05
    if (id === 'GNL01' || id === 'GNL05' || id === 'AC05') {
        console.log('Xử lý đặc biệt cho ID cụ thể:', id);
        const fakeObjectId = `product0000000000000${id}`;
        console.log('Đã tạo ObjectId giả:', fakeObjectId);
        if (mongoose.Types.ObjectId.isValid(fakeObjectId)) {
            return fakeObjectId;
        }
    }
    
    // Kiểm tra nếu id có thể là mã sản phẩm dạng GNLxx, AC05
    if (typeof id === 'string' && /^[A-Z0-9]{2,10}$/.test(id)) {
        console.log('Chuyển đổi mã sản phẩm:', id);
        // Tạo một ObjectId giả dựa trên mã sản phẩm
        // Format: "product" + padding zeros + mã sản phẩm để đạt 24 ký tự
        const paddingLength = 24 - 7 - id.length; // 7 = "product".length
        const padding = '0'.repeat(Math.max(0, paddingLength));
        const fakeObjectId = `product${padding}${id}`;
        
        // Kiểm tra xem chuỗi đã tạo có đúng định dạng ObjectId không
        if (mongoose.Types.ObjectId.isValid(fakeObjectId)) {
            console.log('Đã tạo ObjectId hợp lệ:', fakeObjectId);
            return fakeObjectId;
        }
    }
    
    // Nếu id bắt đầu bằng "product", có thể đây là id đã được chuyển đổi từ client
    if (typeof id === 'string' && id.startsWith('product') && id.length === 24) {
        console.log('ID đã được chuyển đổi từ client:', id);
        if (mongoose.Types.ObjectId.isValid(id)) {
            return id;
        }
    }
    
    console.error('Không thể chuyển đổi ID:', id);
    // Trường hợp không thể chuyển đổi
    return id;
}

// Chuyển đổi ID công thức từ định dạng CTxx thành định dạng phù hợp
function convertRecipeId(id) {
    // Nếu id đã là ObjectId hợp lệ, trả về nguyên gốc
    if (mongoose.Types.ObjectId.isValid(id)) {
        return id;
    }
    
    // Kiểm tra nếu id có định dạng CTxx
    if (typeof id === 'string' && /^CT[0-9]{2,5}$/.test(id)) {
        console.log('Chuyển đổi mã công thức:', id);
        // Với công thức, giữ nguyên định dạng CTxx vì model Recipe có _id là String
        return id;
    }
    
    console.log('ID công thức không cần chuyển đổi:', id);
    return id;
}

class FavoriteService {
    // Thêm vào yêu thích
    async addFavorite(data) {
        try {
            // Chuyển đổi accountId sang ObjectId 
            data.accountId = new mongoose.Types.ObjectId(data.accountId);
            
            const newFavorite = new Favorite(data);
            const savedFavorite = await newFavorite.save();
            return savedFavorite;
        } catch (error) {
            // ... existing code ...
        }
    }
    
    // Xóa khỏi yêu thích
    async removeFavorite(accountId, targetId, type) {
        try {
            // Chuyển đổi accountId sang ObjectId
            accountId = new mongoose.Types.ObjectId(accountId);
            
            const result = await Favorite.deleteOne({ accountId, targetId, type });
            return result;
        } catch (error) {
            // ... existing code ...
        }
    }
    
    // Kiểm tra đã yêu thích chưa
    async checkFavorite(accountId, targetId, type) {
        if (!accountId || !targetId || !type) {
            throw new Error('Thiếu thông tin cần thiết');
        }
        
        // Chỉ kiểm tra accountId là ObjectId
        if (!mongoose.Types.ObjectId.isValid(accountId)) {
            throw new Error('AccountId không hợp lệ');
        }
        
        // Xử lý targetId tùy theo type
        let processedTargetId = targetId;
        
        if (type === 'product') {
            processedTargetId = convertProductId(targetId);
        } else if (type === 'recipe') {
            processedTargetId = convertRecipeId(targetId);
            
            // Recipe có _id là String, cho phép cả định dạng CTxx
            if (!/^CT[0-9]{2,5}$/.test(processedTargetId) && !mongoose.Types.ObjectId.isValid(processedTargetId)) {
                console.error('TargetId recipe không hợp lệ:', targetId);
                throw new Error('TargetId không hợp lệ');
            }
        } else if (type === 'blog') {
            // Kiểm tra blog vẫn yêu cầu ObjectId
            if (!mongoose.Types.ObjectId.isValid(targetId)) {
                throw new Error('TargetId không hợp lệ');
            }
        }
        
        const favorite = await Favorite.findOne({ 
            accountId,
            targetId: processedTargetId,
            type 
        });
        return !!favorite;
    }
    
    // Lấy danh sách yêu thích
    async getFavorites(accountId, type) {
        if (!accountId) {
            throw new Error('Thiếu ID tài khoản');
        }
        
        if (!mongoose.Types.ObjectId.isValid(accountId)) {
            throw new Error('ID không hợp lệ');
        }
        
        const query = { accountId };
        
        if (type && ['blog', 'recipe', 'product'].includes(type)) {
            query.type = type;
        }
        
        const favorites = await Favorite.find(query).sort({ createdAt: -1 });
        
        // Lấy chi tiết cho từng loại favorite
        const detailedFavorites = await Promise.all(
            favorites.map(async (favorite) => {
                let details = null;
                
                if (favorite.type === 'blog') {
                    details = await Blog.findById(favorite.targetId).select('title thumbnail description category');
                } else if (favorite.type === 'recipe') {
                    details = await Recipe.findById(favorite.targetId).select('title thumbnail description difficulty');
                } else if (favorite.type === 'product') {
                    // Cần thêm model Product
                    // details = await Product.findById(favorite.targetId).select('title thumbnail description price');
                }
                
                return {
                    _id: favorite._id,
                    accountId: favorite.accountId,
                    targetId: favorite.targetId,
                    type: favorite.type,
                    createdAt: favorite.createdAt,
                    details
                };
            })
        );
        
        return detailedFavorites;
    }

    // Lấy danh sách yêu thích với chi tiết đầy đủ theo loại
    async getFavoritesWithDetails(accountId, type) {
        if (!accountId) {
            throw new Error('Thiếu ID tài khoản');
        }
        
        if (!mongoose.Types.ObjectId.isValid(accountId)) {
            throw new Error('ID tài khoản không hợp lệ');
        }
        
        if (!type || !['blog', 'recipe', 'product'].includes(type)) {
            throw new Error('Loại không hợp lệ. Chỉ hỗ trợ: blog, recipe, product');
        }
        
        // Lấy danh sách yêu thích theo loại
        const query = { 
            accountId: new mongoose.Types.ObjectId(accountId),
            type 
        };
        
        const favorites = await Favorite.find(query).sort({ createdAt: -1 });
        console.log(`Đã tìm thấy ${favorites.length} mục yêu thích loại ${type}`);
        
        // Lấy chi tiết cho từng mục yêu thích
        const detailedFavorites = await Promise.all(
            favorites.map(async (favorite) => {
                let details = null;
                
                try {
                    if (type === 'blog') {
                        details = await Blog.findById(favorite.targetId);
                    } else if (type === 'recipe') {
                        // Xử lý targetId đặc biệt cho công thức
                        let recipeId = favorite.targetId;
                        recipeId = convertRecipeId(recipeId);
                        details = await Recipe.findById(recipeId);
                    } else if (type === 'product') {
                        // Xử lý targetId đặc biệt cho sản phẩm
                        let productId = favorite.targetId;
                        productId = convertProductId(productId);
                        details = await Ingredient.findById(productId);
                    }
                    
                    console.log(`Chi tiết cho ${type} với ID ${favorite.targetId}:`, details ? 'Đã tìm thấy' : 'Không tìm thấy');
                } catch (error) {
                    console.error(`Lỗi khi lấy chi tiết cho ${type} với ID ${favorite.targetId}:`, error.message);
                }
                
                return {
                    _id: favorite._id,
                    accountId: favorite.accountId,
                    targetId: favorite.targetId, 
                    type: favorite.type,
                    createdAt: favorite.createdAt,
                    details
                };
            })
        );
        
        return detailedFavorites;
    }
}

module.exports = new FavoriteService(); 