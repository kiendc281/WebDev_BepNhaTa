const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');

// Blog Management Routes
router.post('/blogs', blogController.createBlog);
router.post('/blogs/bulk', blogController.createManyBlogs);
router.get('/blogs', blogController.getAllBlogs);
router.get('/blogs/:id', blogController.getBlogById);
router.patch('/blogs/:id', blogController.updateBlog);
router.delete('/blogs/:id', blogController.deleteBlog);

// Additional Blog Features
router.post('/blogs/:id/toggle-like', blogController.toggleLike);
router.post('/blogs/:id/increment-views', blogController.incrementViews);



module.exports = router; 