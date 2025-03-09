const mongoose = require('mongoose');
const slugify = require('slugify');

const blogSchema = new mongoose.Schema({
    _id: {
        type: String
    },
    category: {
        name: { type: String, required: true },
        slug: { type: String }
    },
    title: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        unique: true
    },
    author: {
        type: String,
        ref: 'Account',
        required: true
    },
    publishDate: {
        type: Date,
        default: Date.now
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    likedBy: [{
        type: String,
        ref: 'Account'
    }],
    description: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
        required: true
    },
    sections: [{
        content: {
            title: String,
            text: [String],
            imageUrl: String,
            imageCaption: String
        },
        order: { type: Number, required: true }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });

// Chỉ xử lý slug trong middleware
blogSchema.pre('save', async function (next) {
    try {
        if (this.isNew) {
            // Tạo slug từ title
            this.slug = slugify(this.title, {
                lower: true,
                strict: true,
                locale: 'vi'
            });

            // Tạo category slug
            if (this.category && this.category.name) {
                this.category.slug = slugify(this.category.name, {
                    lower: true,
                    strict: true,
                    locale: 'vi'
                });
            }
        }
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Blog', blogSchema);
