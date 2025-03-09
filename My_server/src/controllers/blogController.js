const blogService = require('../services/blogService');

const blogController = {
    // Tạo blog mới
    createBlog: async (req, res) => {
        try {
            const blog = await blogService.createBlog(req.body);
            res.status(201).json({
                message: 'Tạo blog thành công',
                blog
            });
        } catch (error) {
            res.status(400).json({
                message: error.message
            });
        }
    },

    // Lấy tất cả blogs
    getAllBlogs: async (req, res) => {
        try {
            const blogs = await blogService.getAllBlogs(req.query);
            res.json(blogs);
        } catch (error) {
            res.status(500).json({
                message: error.message
            });
        }
    },

    // Lấy blog theo id
    getBlogById: async (req, res) => {
        try {
            const blog = await blogService.getBlogById(req.params.id);
            res.json(blog);
        } catch (error) {
            res.status(404).json({
                message: error.message
            });
        }
    },

    // Cập nhật blog
    updateBlog: async (req, res) => {
        try {
            const blog = await blogService.updateBlog(req.params.id, req.body);
            res.json({
                message: "Cập nhật thành công",
                blog
            });
        } catch (error) {
            res.status(400).json({
                message: error.message
            });
        }
    },

    // Xóa blog
    deleteBlog: async (req, res) => {
        try {
            await blogService.deleteBlog(req.params.id);
            res.json({
                message: "Xóa thành công"
            });
        } catch (error) {
            res.status(400).json({
                message: error.message
            });
        }
    },

    // Like/Unlike blog
    toggleLike: async (req, res) => {
        try {
            const blog = await blogService.toggleLike(req.params.id, req.body.accountId);
            res.json({
                message: "Thao tác thành công",
                blog
            });
        } catch (error) {
            res.status(400).json({
                message: error.message
            });
        }
    },

    // Tăng lượt xem
    incrementViews: async (req, res) => {
        try {
            const blog = await blogService.incrementViews(req.params.id);
            res.json({
                message: "Cập nhật lượt xem thành công",
                blog
            });
        } catch (error) {
            res.status(400).json({
                message: error.message
            });
        }
    },

    // Thêm method mới
    createManyBlogs: async (req, res) => {
        try {
            const blogs = await blogService.createManyBlogs(req.body);
            res.status(201).json({
                message: 'Tạo nhiều blog thành công',
                blogs
            });
        } catch (error) {
            res.status(400).json({
                message: error.message
            });
        }
    }
};

module.exports = blogController; 