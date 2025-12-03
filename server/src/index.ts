import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/auth.routes";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// API
app.use("/api", authRoutes);

// Раздача собранного фронта (client/dist)
const distPath = path.join(__dirname, "../../client/dist");
app.use(express.static(distPath));

// SPA fallback — все не-API запросы отдать index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});

