import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const registerUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "Пользователь уже существует" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, hasProAccess: false }
    });

    res.json({
      message: "Регистрация успешна",
      user: { id: user.id, email: user.email, hasProAccess: user.hasProAccess }
    });
  } catch (err) {
    console.error("Ошибка регистрации:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Неверный email или пароль" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Неверный email или пароль" });

    // ⚡ Добавляем hasProAccess в токен
    const token = jwt.sign(
      { id: user.id, email: user.email, hasProAccess: user.hasProAccess },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Вход выполнен",
      token,
      user: { id: user.id, email: user.email, hasProAccess: user.hasProAccess }
    });
  } catch (err) {
    console.error("Ошибка входа:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

// 🔥 Новый контроллер для активации Pro
export const activatePro = async (req: Request, res: Response) => {
  const { userId } = req.body; // или бери из токена

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { hasProAccess: true }
    });

    res.json({
      message: "Pro активирован",
      user: { id: updated.id, email: updated.email, hasProAccess: updated.hasProAccess }
    });
  } catch (err) {
    console.error("Ошибка активации Pro:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};




