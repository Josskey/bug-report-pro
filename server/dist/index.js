"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// API
app.use("/api", auth_routes_1.default);
// Раздача собранного фронта (client/dist)
const distPath = path_1.default.join(__dirname, "../client/dist");
app.use(express_1.default.static(distPath));
// SPA fallback — все не-API запросы отдать index.html
app.get("*", (req, res) => {
    res.sendFile(path_1.default.join(distPath, "index.html"));
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});
