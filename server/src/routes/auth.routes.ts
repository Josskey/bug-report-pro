import { Router } from "express";
import { registerUser, loginUser } from "../controllers/auth.controller";
import { authGuard } from "../middleware/authGuard";
import { prisma } from "../prisma/client"; // ✅ убедись, что путь к клиенту правильный

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// ✅ Проверка токена / получение текущего пользователя с Pro‑доступом
router.get("/me", authGuard, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Нет доступа" });

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        hasProAccess: true // ✅ добавляем это поле
      }
    });

    if (!dbUser) return res.status(404).json({ error: "Пользователь не найден" });

    res.json({ user: dbUser });
  } catch (err) {
    console.error("Ошибка /api/me:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

export default router;


