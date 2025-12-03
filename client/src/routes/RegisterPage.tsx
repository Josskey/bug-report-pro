import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppStore } from "../store/useAppStore"; // ✅ подключаем Zustand

export default function RegisterPage() {
  const navigate = useNavigate();
  const setProAccess = useAppStore((s) => s.setProAccess);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Введите email и пароль");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }
    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }

    try {
      const API = import.meta.env.VITE_API_URL;
      const res = await fetch(`${API}/api/register`, {
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

        if (meRes.ok && meData?.user?.email) {
          const userEmail = meData.user.email;
          const pro = meData.hasProAccess === true;

          // сохраняем сессию
          localStorage.setItem("session", JSON.stringify(meData));
          localStorage.setItem("userEmail", userEmail);

          // обновляем Pro‑статус в Zustand
          setProAccess(userEmail, pro);
        }

        setSuccess("Регистрация успешна!");
        setTimeout(() => navigate("/home"), 800);
      } else {
        setError(data.error || "Ошибка регистрации");
      }
    } catch {
      setError("Ошибка подключения к серверу");
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: "40px auto" }}>
      <h2 style={{ marginBottom: 16 }}>Регистрация</h2>

      <form onSubmit={handleRegister}>
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
          style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
        />
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="Повторите пароль"
          style={{ display: "block", width: "100%", marginBottom: 12, padding: 8 }}
        />
        <button type="submit" style={{ width: "100%", padding: 10 }}>
          Зарегистрироваться
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
      {success && <p style={{ color: "green", marginTop: 10 }}>{success}</p>}

      <div style={{ marginTop: 16, textAlign: "center" }}>
        <Link to="/login">Уже есть аккаунт? Войти</Link>
      </div>
    </div>
  );
}



