require('dotenv').config();
const express = require('express');
const app = express(); // Creating an Express app  
const port = process.env.PORT || 3000; // Setting a port number 
const hostname = process.env.HOST_NAME
const db = require('./config/database')
const recipeRoutes = require('./routes/recipe.routes');
const menuRoutes = require('./routes/menu.routes');
const ingredientRoutes = require('./routes/ingredient.routes');
const accountRoutes = require('./routes/account.routes');
const blogRoutes = require('./routes/blog.routes');
const cartRoutes = require('./routes/cart.routes');
const favoriteRoutes = require('./routes/favorite.routes');
const passwordResetRoutes = require('./routes/passwordReset.routes');
const contactRoutes = require('./routes/contactRoutes');
const addressRoutes = require('./routes/address.routes');
const orderRoutes = require('./routes/order.routes');
const cors = require('cors');

// Kiểm tra JWT_SECRET
if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    process.exit(1);
}

// Kiểm tra các biến môi trường cho email
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('WARNING: Email configuration is missing. Contact form will not work.');
}

// config cors
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Khai báo route
app.use('/api', accountRoutes);
app.use('/api', blogRoutes);
app.use('/api', recipeRoutes);
app.use('/api', menuRoutes);
app.use('/api', ingredientRoutes);
app.use('/api', cartRoutes);
app.use('/api', favoriteRoutes);
app.use('/api', passwordResetRoutes);
app.use('/api', contactRoutes);
app.use('/api', addressRoutes);
app.use('/api', orderRoutes);

// Connect to DB
db.connect().then(() => {
    console.log('Connected to MongoDB successfully');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Thêm error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Có lỗi xảy ra: ' + err.message
    });
});

app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/api`);
});
