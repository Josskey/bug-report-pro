import { Router } from "express";
import { registerUser, loginUser } from "../controllers/auth.controller";
import { authGuard } from "../middleware/authGuard";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// Проверка токена / получение текущего пользователя
router.get("/me", authGuard, (req, res) => {
  res.json({ user: (req as any).user });
});

export default router;


