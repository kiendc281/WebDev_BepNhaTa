const Blog = require('../models/blog');
const slugify = require('slugify');

class BlogService {
    // Hàm helper để tạo ID
    async generateCustomId() {
        const lastBlog = await Blog.findOne().sort({ _id: -1 });
        const nextNumber = lastBlog ? parseInt(lastBlog._id.slice(2)) + 1 : 1;
        return `BL${nextNumber.toString().padStart(2, '0')}`;
    }

    // Tạo một blog
    async createBlog(blogData) {
        try {
            const existingBlog = await Blog.findOne({ title: blogData.title });
            if (existingBlog) {
                throw new Error('Tiêu đề blog đã tồn tại');
            }

            const blog = new Blog({
                ...blogData,
                _id: await this.generateCustomId()
            });
            return await blog.save();
        } catch (error) {
            throw new Error(error.message);
        }
    }

    // Lấy tất cả blogs
    async getAllBlogs(query = {}) {
        try {
            const blogs = await Blog.find(query)
                .populate('author', 'name email')
                .populate('likedBy', 'name email')
                .sort({ createdAt: -1 });
            return blogs;
        } catch (error) {
            throw new Error('Không thể lấy danh sách blog');
        }
    }

    // Lấy blog theo ID
    async getBlogById(id) {
        try {
            const blog = await Blog.findById(id)
                .populate('author', 'name email')
                .populate('likedBy', 'name email');
            if (!blog) {
                throw new Error('Không tìm thấy blog');
            }
            return blog;
        } catch (error) {
            throw new Error('Không tìm thấy blog');
        }
    }

    // Cập nhật blog
    async updateBlog(id, updateData) {
        try {
            // Nếu cập nhật title, kiểm tra trùng
            if (updateData.title) {
                const existingBlog = await Blog.findOne({
                    title: updateData.title,
                    _id: { $ne: id }
                });
                if (existingBlog) {
                    throw new Error('Tiêu đề blog đã tồn tại');
                }
            }

            const blog = await Blog.findByIdAndUpdate(
                id,
                { ...updateData, updatedAt: Date.now() },
                { new: true }
            ).populate('author', 'name email')
                .populate('likedBy', 'name email');

            if (!blog) {
                throw new Error('Không tìm thấy blog');
            }

            return blog;
        } catch (error) {
            throw new Error('Cập nhật thất bại: ' + error.message);
        }
    }

    // Xóa blog
    async deleteBlog(id) {
        try {
            const blog = await Blog.findByIdAndDelete(id);
            if (!blog) {
                throw new Error('Không tìm thấy blog');
            }
            return blog;
        } catch (error) {
            throw new Error('Xóa thất bại: ' + error.message);
        }
    }

    // Like/Unlike blog
    async toggleLike(blogId, accountId) {
        try {
            const blog = await Blog.findById(blogId);
            if (!blog) {
                throw new Error('Không tìm thấy blog');
            }

            const likedIndex = blog.likedBy.indexOf(accountId);
            if (likedIndex === -1) {
                // Like
                blog.likedBy.push(accountId);
                blog.likes += 1;
            } else {
                // Unlike
                blog.likedBy.splice(likedIndex, 1);
                blog.likes -= 1;
            }

            return await blog.save();
        } catch (error) {
            throw new Error('Không thể thực hiện thao tác: ' + error.message);
        }
    }

    // Tăng lượt xem
    async incrementViews(blogId) {
        try {
            const blog = await Blog.findByIdAndUpdate(
                blogId,
                { $inc: { views: 1 } },
                { new: true }
            );
            if (!blog) {
                throw new Error('Không tìm thấy blog');
            }
            return blog;
        } catch (error) {
            throw new Error('Không thể cập nhật lượt xem');
        }
    }

    // Tạo nhiều blog
    async createManyBlogs(blogsData) {
        try {
            // Kiểm tra trùng lặp title
            for (const blogData of blogsData) {
                const existingBlog = await Blog.findOne({ title: blogData.title });
                if (existingBlog) {
                    throw new Error(`Blog với tiêu đề "${blogData.title}" đã tồn tại`);
                }
            }

            // Lấy ID cuối cùng để tạo ID mới
            const lastBlog = await Blog.findOne().sort({ _id: -1 });
            const lastNumber = lastBlog ? parseInt(lastBlog._id.slice(2)) : 0;

            // Tạo blogs với ID tự tăng
            const blogDocs = blogsData.map((blogData, index) => {
                const nextNumber = lastNumber + index + 1;
                return new Blog({
                    ...blogData,
                    _id: `BL${nextNumber.toString().padStart(2, '0')}`
                });
            });

            return await Blog.insertMany(blogDocs);
        } catch (error) {
            throw new Error('Tạo blogs thất bại: ' + error.message);
        }
    }
}

module.exports = new BlogService(); 