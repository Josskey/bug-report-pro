import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// API
app.use("/api", authRoutes);

// ⚡ Убрали раздачу client/dist и SPA fallback,
// потому что фронт деплоится отдельно на Netlify

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});

