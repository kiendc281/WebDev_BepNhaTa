require('dotenv').config();
const express = require('express');
const path = require("path");
const accountRoutes = require('./routes/account.routes');
const blogRoutes = require('./routes/blog.routes');
const app = express(); // Creating an Express app  
const port = process.env.PORT || 3000; // Setting a port number 
const hostname = process.env.HOST_NAME
const db = require('./config/database')
const recipeRoutes = require('./routes/recipe.routes');
const menuRoutes = require('./routes/menu.routes');
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

// Connect to DB
db.connect();

app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
