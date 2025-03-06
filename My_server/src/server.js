require('dotenv').config();
const express = require('express');
const path = require("path");
const exampleRoutes = require('./routes/example.routes');
const app = express(); // Creating an Express app  
const port = process.env.PORT || 3000; // Setting a port number 
const hostname = process.env.HOST_NAME
const db = require('./config/database')
const cors = require('cors');

// config cors
app.use(cors());
app.use(express.json());

// Khai báo route
app.use('/', exampleRoutes);

// Connect to DB
db.connect();

app.listen(port, hostname, () => {
    console.log(`Server listening on port ${port}`);
});