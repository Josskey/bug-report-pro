import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode ?? "timed";

  const startTimer = useAppStore((s) => s.startTimer);
  const stopTimer = useAppStore((s) => s.stopTimer);
  const getElapsedTime = useAppStore((s) => s.getElapsedTime);
  const loadStartTime = useAppStore((s) => s.loadStartTime);
  const loadProAccess = useAppStore((s) => s.loadProAccess);
  const hasProAccess = useAppStore((s) => s.hasProAccess);

  const keepTimerOnNavigateRef = useRef(false);
  const [elapsed, setElapsed] = useState(0);

  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState("");
  const [capsOn, setCapsOn] = useState(false);

  // Фокус и восстановление прошлой сессии
  useEffect(() => {
    emailRef.current?.focus();
    try {
      const raw = localStorage.getItem("session");
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.email === "string" && s.email.length > 0) {
          setEmail(s.email);
          setRemember(Boolean(s.remember));
        }
      }
    } catch {}
  }, []);

  // Подтягиваем Pro‑доступ по email
  useEffect(() => {
    if (email) {
      loadProAccess(email);
    }
  }, [email, loadProAccess]);

  // Таймер в Pro‑режиме (timed)
  useEffect(() => {
    if (mode === "timed" && hasProAccess) {
      loadStartTime();
      startTimer();
      const interval = setInterval(() => setElapsed(getElapsedTime()), 1000);

      const beforeUnload = () => sessionStorage.setItem("reloading", "true");
      window.addEventListener("beforeunload", beforeUnload);

      const onPopState = () => {
        keepTimerOnNavigateRef.current = false;
        stopTimer();
      };
      window.addEventListener("popstate", onPopState);

      return () => {
        clearInterval(interval);
        window.removeEventListener("beforeunload", beforeUnload);
        window.removeEventListener("popstate", onPopState);

        const isReloading = sessionStorage.getItem("reloading") === "true";
        sessionStorage.removeItem("reloading");

        if (!isReloading && !keepTimerOnNavigateRef.current) {
          stopTimer();
        }
      };
    }
  }, [mode, hasProAccess, startTimer, getElapsedTime, stopTimer, loadStartTime]);

  const validate = () => {
    const errs: string[] = [];

    // Email
    if (email.trim() === "") errs.push("Email не может быть пустым");
    if (!emailRegex.test(email)) errs.push("Неверный формат email");
    if (email.length > 100) errs.push("Email слишком длинный (максимум 100 символов)");
    if (/['";]/.test(email)) errs.push("Email содержит недопустимые спецсимволы");
    if (/--|\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\b/i.test(email)) {
      errs.push("Обнаружены потенциально опасные последовательности в email");
    }

    // Пароль
    if (password.length < 8) errs.push("Пароль должен быть не менее 8 символов");
    if (password.length > 64) errs.push("Пароль слишком длинный (максимум 64 символа)");
    if (/\s/.test(password)) errs.push("Пароль не должен содержать пробелы");
    if (/^[а-яА-Я]+$/.test(password)) errs.push("Пароль не должен быть на кириллице");

    // Усиленные проверки для Pro (timed)
    if (mode === "timed" && hasProAccess) {
      if (password.toLowerCase().includes(email.toLowerCase())) {
        errs.push("Пароль не должен совпадать с email");
      }
      if (email.endsWith(".museum") || email.endsWith(".travel")) {
        errs.push("Редкие домены не поддерживаются");
      }
      if (!email.endsWith("@company.com")) {
        errs.push("Для корпоративного входа используйте email @company.com");
      }
      if (password.length >= 12 && !/[A-Z]/.test(password)) {
        errs.push("Длинный пароль должен содержать хотя бы одну заглавную букву");
      }
      if (password.length >= 12 && !/[0-9]/.test(password)) {
        errs.push("Длинный пароль должен содержать хотя бы одну цифру");
      }
      if (/^[A-Z]+$/.test(password)) {
        errs.push("Пароль состоит только из заглавных букв — возможно включён CapsLock");
      }
      if (/[^a-zA-Z0-9!@#$%^&*]/.test(password)) {
        errs.push("Пароль содержит недопустимые символы");
      }
    }

    return errs;
  };

  const fakeAuth = async () => {
    await new Promise((r) => setTimeout(r, 800));
    if (email.toLowerCase() === "admin@demo.com") throw new Error("Пользователь заблокирован");
    if (password === "password123") return { token: "fake-token", role: "user" };
    if (email.includes("+")) throw new Error("Email-алиасы запрещены в этой системе");
    return { token: "fake-token", role: "user" };
  };

  const handleLogin = async () => {
    setSuccess("");
    const v = validate();
    setErrors(v);
    if (v.length > 0) return;

    setLoading(true);
    try {
      const res = await fakeAuth();
      localStorage.setItem("token", res.token);
      localStorage.setItem("session", JSON.stringify({ email, remember, ...res }));
      setSuccess("Вход выполнен");
      // После входа сразу подтянем Pro‑доступ
      loadProAccess(email);
    } catch (e: any) {
      setErrors([e.message || "Ошибка входа"]);
    } finally {
      setLoading(false);
    }
  };

  const handleExit = () => {
    keepTimerOnNavigateRef.current = false;
    stopTimer();
    navigate("/home");
  };

  const handleEvaluate = () => {
    keepTimerOnNavigateRef.current = true;
    navigate("/form", {
      state: {
        title: "Форма входа",
        mode,
        redirectTo: "/history",
      },
    });
  };

  // Заглушка для Pro‑режима
  if (mode === "timed" && !hasProAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-6 bg-white rounded shadow text-center">
          <h1 className="text-xl font-bold mb-4">⏱ Режим по таймеру</h1>
          <p className="text-gray-600 mb-4">
            Доступ к этому режиму доступен только после покупки Pro-версии.
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/buy")}>
            Купить доступ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div role="form" aria-labelledby="login-title" className="w-full max-w-md p-6 bg-white rounded shadow">
        {mode === "timed" && hasProAccess && (
          <div className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded shadow mb-3 w-fit">
            ⏱ Время: {elapsed}s
          </div>
        )}

        <h1 id="login-title" className="text-xl font-bold mb-2">Форма входа</h1>
        <p className="text-sm text-gray-600 mb-4">Введите данные для авторизации</p>

        <div className="grid gap-4">
          <div>
            <label className="label" htmlFor="login-email">Email</label>
            <input
              ref={emailRef}
              id="login-email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              aria-invalid={errors.some(e => e.toLowerCase().includes("email"))}
              aria-describedby="login-errors"
              maxLength={120}
            />
          </div>

          <div>
            <label className="label" htmlFor="login-password">Пароль</label>
            <input
              id="login-password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => setCapsOn(e.getModifierState("CapsLock"))}
              placeholder="********"
              aria-invalid={errors.some(e => e.toLowerCase().includes("пароль"))}
              maxLength={80}
            />
            {capsOn && (
              <div className="text-xs text-amber-600 mt-1">
                Похоже, включён CapsLock — это может привести к ошибке ввода.
              </div>
            )}
            {password.length > 32 && (
              <div className="text-xs text-gray-500 mt-1">
                Длинные пароли рекомендуется делать смешанными: буквы, цифры и спецсимволы.
              </div>
            )}
          </div>

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Запомнить меня
          </label>

          {errors.length > 0 && (
            <div id="login-errors" className="text-red-500 text-sm" aria-live="assertive">
              {errors.map((e, i) => <div key={i}>• {e}</div>)}
            </div>
          )}

          {success && (
            <div className="text-green-600 text-sm" aria-live="polite">
              {success}
            </div>
          )}

          <button className="btn btn-primary mt-2" onClick={handleLogin} disabled={loading}>
            {loading ? "Входим..." : "Войти"}
          </button>

          <div className="flex gap-2 mt-2">
            <button className="btn btn-secondary" onClick={handleEvaluate}>Оценить баг</button>
            <button className="btn" onClick={handleExit}>Выйти</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;


         












