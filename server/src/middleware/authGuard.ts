import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

interface DecodedToken extends JwtPayload {
  id: number;
  email: string;
}

export const authGuard = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) return res.status(401).json({ error: "Нет токена" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    if (!decoded.id) {
      return res.status(401).json({ error: "Некорректный токен: нет id" });
    }

    // ⚡ кладём только нужные поля
    (req as any).user = { id: decoded.id, email: decoded.email };

    next();
  } catch (err) {
    console.error("Ошибка проверки токена:", err);
    res.status(401).json({ error: "Неверный токен" });
  }
};

