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
const passwordResetRoutes = require('./routes/passwordReset.routes');
const cors = require('cors');

// Kiểm tra JWT_SECRET
if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    process.exit(1);
}

// config cors
app.use(cors());
app.use(express.json());

// Khai báo route
app.use('/api', accountRoutes);
app.use('/api', blogRoutes);
app.use('/api', recipeRoutes);
app.use('/api', menuRoutes);
app.use('/api', ingredientRoutes);
app.use('/api', cartRoutes);
app.use('/api', passwordResetRoutes);

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
