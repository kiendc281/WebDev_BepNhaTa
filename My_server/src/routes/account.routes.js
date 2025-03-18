const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");

// Test route
router.get("/", (req, res) => {
  res.send("Hello World");
});

// Account Management Routes
router.get("/accounts", accountController.getAllAccounts);
router.get("/accounts/:id", accountController.getAccountById);
router.post("/accounts", accountController.createAccount);
router.patch("/accounts/:id", accountController.updateAccount);
router.patch("/accounts/:id/password", accountController.updatePassword);
router.delete("/accounts/:id", accountController.deleteAccount);

// Auth Routes
router.post("/auth/register", accountController.register);
router.post("/auth/login", accountController.login);

module.exports = router;
