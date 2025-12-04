import { Router } from "express";
import { registerUser, loginUser, activatePro } from "../controllers/auth.controller";
import { authGuard } from "../middleware/authGuard";
import { prisma } from "../prisma/client";

const router = Router();

// Регистрация и вход
router.post("/register", registerUser);
router.post("/login", loginUser);

// Проверка токена / получение текущего пользователя с Pro‑доступом
router.get("/me", authGuard, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Нет доступа" });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        hasProAccess: true,
      },
    });

    if (!dbUser) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    // ⚡ возвращаем объект user, чтобы фронт сразу видел hasProAccess
    res.json({ user: dbUser });
  } catch (err) {
    console.error("Ошибка /api/me:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// 🔥 Новый роут для активации Pro (берёт id из токена через authGuard)
router.post("/activate-pro", authGuard, activatePro);

export default router;




