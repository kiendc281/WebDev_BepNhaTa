require('dotenv').config();
const express = require('express');
const path = require("path");
const accountRoutes = require('./routes/account.routes');
const recipeRoutes = require('./routes/recipe.routes');
const menuRoutes = require('./routes/menu.routes');
const app = express();
const port = process.env.PORT || 3000;
const hostname = process.env.HOST_NAME;
const db = require('./config/database');
const cors = require('cors');

// Kiểm tra JWT_SECRET
if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    process.exit(1);
}

// config cors
app.use(cors());
app.use(express.json());

// Route gốc
app.get('/', (req, res) => {
    res.json({ 
        message: 'Welcome to BepNhaTa API',
        endpoints: {
            recipes: '/api/recipes',
            accounts: '/api/accounts',
            menus: '/api/menus' 
        }
    });
});

// Khai báo route
app.use('/api', accountRoutes);
app.use('/api', recipeRoutes);
app.use('/api', menuRoutes);
// Error handling
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Connect to DB
db.connect()
    .then(() => {
        app.listen(port, hostname, () => {
            console.log(`Server running at http://${hostname}:${port}/`);
            console.log('Database connected successfully');
        });
    })
    .catch((err) => {
        console.error('Failed to connect to database:', err);
        process.exit(1);
    });