require('dotenv').config();
const express = require('express'); // Importing express  
const path = require("path");
const configviewEngine = require('./config/viewEngine')
const webRoutes = require('./routes/web')

const app = express(); // Creating an Express app  
const port = process.env.PORT || 3000; // Setting a port number 
const hostname = process.env.HOST_NAME

// config template engine, config static file
configviewEngine(app)

// Khai báo route
app.use('/', webRoutes)

app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`); // Logging the server status  
});  