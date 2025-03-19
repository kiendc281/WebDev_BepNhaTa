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
            
            // Xử lý targetId tùy theo type
            let processedTargetId = data.targetId;
            
            if (data.type === 'product') {
                processedTargetId = convertProductId(data.targetId);
            } else if (data.type === 'recipe') {
                processedTargetId = convertRecipeId(data.targetId);
            } else if (data.type === 'blog') {
                // Kiểm tra nếu targetId là ID ngắn (BLxx), chuyển về MongoDB ID
                if (/^BL\d+$/.test(data.targetId)) {
                    const blogIdMap = {
                        'BL01': '507f1f77bcf86cd799439011',
                        'BL02': '507f1f77bcf86cd799439012',
                        'BL03': '507f1f77bcf86cd799439013',
                        'BL04': '507f1f77bcf86cd799439014',
                        'BL05': '507f1f77bcf86cd799439015'
                    };
                    processedTargetId = blogIdMap[data.targetId] || data.targetId;
                }
                // Nếu là MongoDB ID, giữ nguyên
                else if (mongoose.Types.ObjectId.isValid(data.targetId)) {
                    processedTargetId = data.targetId;
                }
            }
            
            console.log(`Adding favorite: accountId=${data.accountId}, targetId=${processedTargetId}, type=${data.type}`);
            
            // Cập nhật targetId đã được xử lý
            data.targetId = processedTargetId;
            
            // Kiểm tra xem đã tồn tại chưa
            const existingFavorite = await Favorite.findOne({
                accountId: data.accountId,
                targetId: data.targetId,
                type: data.type
            });
            
            if (existingFavorite) {
                console.log('Favorite already exists, skipping insert');
                return { 
                    _id: existingFavorite._id,
                    message: 'Đã tồn tại trong danh sách yêu thích',
                    alreadyExists: true
                };
            }
            
            const newFavorite = new Favorite(data);
            const savedFavorite = await newFavorite.save();
            return savedFavorite;
        } catch (error) {
            console.error('Error in addFavorite:', error);
            throw error;
        }
    }
    
    // Xóa khỏi yêu thích
    async removeFavorite(accountId, targetId, type) {
        try {
            // Chuyển đổi accountId sang ObjectId
            accountId = new mongoose.Types.ObjectId(accountId);
            
            // Xử lý targetId tùy theo type trước khi xóa
            let processedTargetId = targetId;
            
            if (type === 'product') {
                processedTargetId = convertProductId(targetId);
            } else if (type === 'recipe') {
                processedTargetId = convertRecipeId(targetId);
            } else if (type === 'blog') {
                // Kiểm tra nếu targetId là ID ngắn (BLxx), chuyển về MongoDB ID
                if (/^BL\d+$/.test(targetId)) {
                    const blogIdMap = {
                        'BL01': '507f1f77bcf86cd799439011',
                        'BL02': '507f1f77bcf86cd799439012',
                        'BL03': '507f1f77bcf86cd799439013',
                        'BL04': '507f1f77bcf86cd799439014',
                        'BL05': '507f1f77bcf86cd799439015'
                    };
                    processedTargetId = blogIdMap[targetId] || targetId;
                }
                // Nếu là MongoDB ID, giữ nguyên
                else if (mongoose.Types.ObjectId.isValid(targetId)) {
                    processedTargetId = targetId;
                }
            }
            
            console.log(`Removing favorite: accountId=${accountId}, targetId=${processedTargetId}, type=${type}`);
            
            const result = await Favorite.deleteOne({ 
                accountId, 
                targetId: processedTargetId, 
                type 
            });
            
            console.log(`Delete result:`, result);
            
            if (result.deletedCount === 0) {
                throw new Error('Không tìm thấy mục yêu thích để xóa');
            }
            
            return result;
        } catch (error) {
            console.error('Error in removeFavorite:', error);
            throw error;
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
            // Kiểm tra nếu targetId là ID ngắn (BLxx), chuyển về MongoDB ID
            if (/^BL\d+$/.test(targetId)) {
                const blogIdMap = {
                    'BL01': '507f1f77bcf86cd799439011',
                    'BL02': '507f1f77bcf86cd799439012',
                    'BL03': '507f1f77bcf86cd799439013',
                    'BL04': '507f1f77bcf86cd799439014',
                    'BL05': '507f1f77bcf86cd799439015'
                };
                processedTargetId = blogIdMap[targetId] || targetId;
            }
            // Kiểm tra MongoDB ID
            else if (!mongoose.Types.ObjectId.isValid(targetId)) {
                console.error('TargetId blog không hợp lệ:', targetId);
                throw new Error('TargetId blog không hợp lệ');
            }
        }
        
        console.log(`Checking favorite: accountId=${accountId}, targetId=${processedTargetId}, type=${type}`);
        
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
                        let blogId = favorite.targetId;
                        // Kiểm tra xem targetId có đúng định dạng MongoDB ID không
                        if (mongoose.Types.ObjectId.isValid(blogId)) {
                            details = await Blog.findById(blogId);
                            // Nếu không tìm thấy và có thể là ID dạng ngắn, cần chuyển đổi
                            if (!details && /^BL\d+$/.test(blogId)) {
                                const blogIdMap = {
                                    'BL01': '507f1f77bcf86cd799439011',
                                    'BL02': '507f1f77bcf86cd799439012',
                                    'BL03': '507f1f77bcf86cd799439013',
                                    'BL04': '507f1f77bcf86cd799439014',
                                    'BL05': '507f1f77bcf86cd799439015'
                                };
                                const mongoId = blogIdMap[blogId];
                                if (mongoId) {
                                    details = await Blog.findById(mongoId);
                                }
                            }
                        } else if (/^BL\d+$/.test(blogId)) {
                            // Xử lý targetId đặc biệt cho blog nếu là ID ngắn
                            const blogIdMap = {
                                'BL01': '507f1f77bcf86cd799439011',
                                'BL02': '507f1f77bcf86cd799439012',
                                'BL03': '507f1f77bcf86cd799439013',
                                'BL04': '507f1f77bcf86cd799439014',
                                'BL05': '507f1f77bcf86cd799439015'
                            };
                            const mongoId = blogIdMap[blogId];
                            if (mongoId) {
                                details = await Blog.findById(mongoId);
                            }
                        }
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