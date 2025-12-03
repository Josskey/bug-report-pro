import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma;

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const registerUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "Пользователь уже существует" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, hasProAccess: false } // ✅ добавляем поле
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

    // ✅ можно включить hasProAccess в токен, но необязательно
    const token = jwt.sign(
      { id: user.id, email: user.email },
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



