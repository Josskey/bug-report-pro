import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { getMe } from "../api"; // ✅ используем api.ts

const Layout = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");

  const hasProAccess = useAppStore((s) => s.hasProAccess);
  const setProAccess = useAppStore((s) => s.setProAccess);
  const loadMode = useAppStore((s) => s.loadMode);
  const mode = useAppStore((s) => s.mode);

  useEffect(() => {
    loadMode();

    (async () => {
      const meData = await getMe();
      if (meData?.email) {
        setUserEmail(meData.email);
        localStorage.setItem("userEmail", meData.email);

        // ✅ обновляем Pro‑статус через Zustand
        setProAccess(meData.email, meData.hasProAccess);
      } else {
        // если токен невалиден или сервер вернул ошибку — сбрасываем состояние
        setUserEmail("");
        localStorage.removeItem("userEmail");
        setProAccess("", false);
      }
    })();
  }, [setProAccess, loadMode]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    setUserEmail("");
    setProAccess("", false); // сбросить Pro‑статус при выходе
    navigate("/login");
  };

  const handleBuyPro = () => {
    if (!userEmail) {
      alert("Сначала войдите в аккаунт");
      return;
    }

    window.location.href =
      "https://yoomoney.ru/transfer/quickpay?requestId=353632393636373635365f38333333353566356433613762363331643539383530353831393761396261323261343137343664";
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow px-6 py-4">
        {/* Верхняя строка — навигация и кнопки */}
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold text-brand-700">📚 PractickCard</h1>
          <nav className="flex gap-3 text-sm items-center">
            <NavLink to="/home" className="btn btn-sm btn-secondary">Главная</NavLink>
            <NavLink to="/history" className="btn btn-sm btn-secondary">История</NavLink>

            <span className="text-blue-600 font-semibold">
              {mode === "timed" ? "⏱ Таймер" : "🔔 Обычный"}
            </span>

            {!hasProAccess ? (
              <button onClick={handleBuyPro} className="btn btn-sm btn-primary">
                Купить Pro
              </button>
            ) : (
              <span className="text-green-600 font-semibold">Pro активирован</span>
            )}

            <button onClick={handleLogout} className="btn btn-sm text-red-500">
              Выйти
            </button>
          </nav>
        </div>

        {/* Нижняя строка — email и доп.инфо */}
        <div className="flex justify-end text-xs text-gray-500">
          {userEmail && <span>Вы вошли как: {userEmail}</span>}
        </div>
      </header>

      <main className="px-6 py-8 max-w-3xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;








