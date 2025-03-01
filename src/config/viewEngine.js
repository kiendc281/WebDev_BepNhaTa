const path = require('path');
const express = require('express');

const configviewEngine = (app) => {
    app.set('views', path.join('./src', 'views'))
    app.set('view engine', 'ejs')

    // config static file
    app.use(express.static(path.join('./src', 'public')));
}

module.exports = configviewEngine;