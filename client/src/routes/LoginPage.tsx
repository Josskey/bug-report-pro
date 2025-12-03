import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppStore } from "../store/useAppStore"; // ✅ подключаем Zustand

export default function LoginPage() {
  const navigate = useNavigate();
  const setProAccess = useAppStore((s) => s.setProAccess);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Введите email и пароль");
      return;
    }

    try {
      const API = import.meta.env.VITE_API_URL;
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (res.ok) {
        // сохраняем токен
        localStorage.setItem("token", data.token);

        // подтягиваем данные пользователя
        const meRes = await fetch(`${API}/api/me`, {
          headers: { Authorization: `Bearer ${data.token}` }
        });
        const meData = await meRes.json();

        if (meRes.ok) {
          // сохраняем сессию
          localStorage.setItem("session", JSON.stringify(meData));

          // обновляем Pro‑статус в Zustand
          setProAccess(meData.email, meData.hasProAccess === true);
        }

        navigate("/home");
      } else {
        setError(data.error || "Ошибка входа");
      }
    } catch {
      setError("Ошибка подключения к серверу");
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: "40px auto" }}>
      <h2 style={{ marginBottom: 16 }}>Вход</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Пароль"
          style={{ display: "block", width: "100%", marginBottom: 12, padding: 8 }}
        />
        <button type="submit" style={{ width: "100%", padding: 10 }}>
          Войти
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

      <div style={{ marginTop: 16, textAlign: "center" }}>
        <Link to="/register">Нет аккаунта? Зарегистрироваться</Link>
      </div>
    </div>
  );
}



