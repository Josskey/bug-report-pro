"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = exports.prisma = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const globalForPrisma = global;
exports.prisma = globalForPrisma.prisma ?? new client_1.PrismaClient();
if (!globalForPrisma.prisma)
    globalForPrisma.prisma = exports.prisma;
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const registerUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const existing = await exports.prisma.user.findUnique({ where: { email } });
        if (existing)
            return res.status(400).json({ error: "Пользователь уже существует" });
        const hashed = await bcrypt_1.default.hash(password, 10);
        const user = await exports.prisma.user.create({
            data: { email, password: hashed }
        });
        res.json({ message: "Регистрация успешна", user: { id: user.id, email: user.email } });
    }
    catch (err) {
        res.status(500).json({ error: "Ошибка сервера" });
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await exports.prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(400).json({ error: "Неверный email или пароль" });
        const valid = await bcrypt_1.default.compare(password, user.password);
        if (!valid)
            return res.status(400).json({ error: "Неверный email или пароль" });
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });
        res.json({ message: "Вход выполнен", token });
    }
    catch (err) {
        res.status(500).json({ error: "Ошибка сервера" });
    }
};
exports.loginUser = loginUser;
