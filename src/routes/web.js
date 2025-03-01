const express = require('express')
const route = express.Router();
const {getHomepage, getabc, gethoitaodi} = require('../controllers/homeController')

route.get('/', getHomepage)
route.get('/abc', getabc)
route.get('/hoitaodi', gethoitaodi)
// các route lấy xử lý từ controller
module.exports = route;
