import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAppStore } from "./store/useAppStore";

import LoginPage from "./routes/LoginPage";
import RegisterPage from "./routes/RegisterPage";
import Layout from "./components/Layout";
import Home from "./routes/Home";
import ReportForm from "./routes/ReportForm";
import HistoryView from "./routes/HistoryView";
import ProfileForm from "./routes/ProfileForm";
import TaskList from "./routes/TaskList";
import PaymentForm from "./routes/PaymentForm";
import SettingsForm from "./routes/SettingsForm";
import LoginForm from "./routes/LoginForm"; // ✅ Добавлено

// 🔒 Авто‑логаут по таймауту
const SessionWatcher = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const clearHistory = useAppStore((s) => s.clearHistory);

  useEffect(() => {
    let lastActivityTime = Date.now();

    const updateActivity = () => {
      lastActivityTime = Date.now();
    };

    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("click", updateActivity);
    window.addEventListener("scroll", updateActivity);

    const interval = setInterval(() => {
      const inactive = Date.now() - lastActivityTime > 15 * 60 * 1000;
      const isOnReportForm = location.pathname === "/form";

      if (inactive && !isOnReportForm) {
        // очистка сессии
        clearHistory();
        localStorage.removeItem("token");
        localStorage.removeItem("session");
        navigate("/login");
      }
    }, 30 * 1000); // проверка каждые 30 секунд

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("scroll", updateActivity);
    };
  }, [navigate, location, clearHistory]);

  return <>{children}</>;
};

const App = () => (
  <BrowserRouter>
    <SessionWatcher>
      <Routes>
        {/* 🔐 Публичные маршруты */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 🧪 Тестовая зона */}
        <Route path="/login-test" element={<LoginForm />} />

        {/* 🔒 Защищённые маршруты */}
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/form" element={<ReportForm />} />
          <Route path="/history" element={<HistoryView />} />
          <Route path="/profile" element={<ProfileForm />} />
          <Route path="/tasks" element={<TaskList />} />
          <Route path="/payment" element={<PaymentForm />} />
          <Route path="/settings" element={<SettingsForm />} />
        </Route>

        {/* 🔁 Ловим все неизвестные маршруты */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </SessionWatcher>
  </BrowserRouter>
);

export default App;




