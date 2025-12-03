import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { login, getMe } from "../api"; // ✅ используем api.ts

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
      // вызываем login из api.ts
      await login(email, password);

      // подтягиваем данные пользователя
      const meData = await getMe();
      if (meData?.email) {
        localStorage.setItem("session", JSON.stringify(meData));
        localStorage.setItem("userEmail", meData.email);

        // обновляем Pro‑статус в Zustand
        setProAccess(meData.email, meData.hasProAccess);
      }

      navigate("/home");
    } catch (err: any) {
      setError(err.message || "Ошибка входа");
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





