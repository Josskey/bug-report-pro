"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const authGuard_1 = require("../middleware/authGuard");
const router = (0, express_1.Router)();
router.post("/register", auth_controller_1.registerUser);
router.post("/login", auth_controller_1.loginUser);
// Проверка токена / получение текущего пользователя
router.get("/me", authGuard_1.authGuard, (req, res) => {
    res.json({ user: req.user });
});
exports.default = router;
