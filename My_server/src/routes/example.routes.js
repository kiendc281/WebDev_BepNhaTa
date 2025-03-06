const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');

// Test route
router.get('/', (req, res) => {
    res.send('Hello World');
});

// Account routes
router.get('/accounts', accountController.getAllAccounts);
router.get('/accounts/:id', accountController.getAccountById);
router.post('/accounts', accountController.createAccount);
router.patch('/accounts/:id', accountController.updateAccount);
router.delete('/accounts/:id', accountController.deleteAccount);

module.exports = router;

