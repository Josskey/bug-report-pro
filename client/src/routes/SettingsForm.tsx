import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";

type Settings = {
  theme: "light" | "dark";
  notifications: boolean;
  compactMode: boolean;
  language: "ru" | "en";
};

const SettingsForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode ?? "normal";

  const startTimer = useAppStore((s) => s.startTimer);
  const stopTimer = useAppStore((s) => s.stopTimer);
  const getElapsedTime = useAppStore((s) => s.getElapsedTime);
  const hasProAccess = useAppStore((s) => s.hasProAccess);

  const keepTimerOnNavigateRef = useRef(false);
  const [elapsed, setElapsed] = useState(0);

  const [s, setS] = useState<Settings>({
    theme: "light",
    notifications: true,
    compactMode: false,
    language: "ru",
  });
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("settings");
    if (raw) {
      try {
        const parsed: Settings = JSON.parse(raw);
        setS(parsed);
      } catch {
        // игнорируем ошибку парсинга
      }
    }
  }, []);

  useEffect(() => {
    if (mode === "timed" && hasProAccess) {
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
  }, [mode, hasProAccess, startTimer, getElapsedTime, stopTimer]);

  const validate = (cfg: Settings) => {
    const e: string[] = [];
    const w: string[] = [];

    if (!["light", "dark"].includes(cfg.theme)) e.push("Неверная тема");
    if (!["ru", "en"].includes(cfg.language)) e.push("Неверный язык интерфейса");

    if (mode === "timed" && hasProAccess) {
      if (cfg.compactMode && cfg.theme === "dark") {
        w.push("Компактный режим в тёмной теме может ухудшить читабельность");
      }
      if (!cfg.notifications) {
        w.push("Вы отключили уведомления — можете пропустить важные события");
      }

      const browserLang = (navigator.language || "en").slice(0, 2) as "ru" | "en";
      if (cfg.language !== browserLang) {
        w.push(`Язык интерфейса (${cfg.language}) не совпадает с локалью браузера (${browserLang})`);
      }

      if (cfg.language === "en" && cfg.compactMode && !cfg.notifications) {
        e.push("Для английского интерфейса нельзя одновременно CompactMode и отключённые уведомления");
      }

      if (cfg.theme === "dark" && cfg.language === "ru" && !cfg.notifications) {
        w.push("В тёмной теме на русском отключение уведомлений может привести к пропуску системных сообщений");
      }
    }

    setWarning(w.length ? w.join(" • ") : null);
    return e;
  };

  const save = () => {
    const errs = validate(s);
    setErrors(errs);
    if (errs.length > 0) return;

    localStorage.setItem("settings", JSON.stringify(s));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const toggle = (key: keyof Settings, value: any) => {
    const next = { ...s, [key]: value } as Settings;
    if (mode === "timed" && hasProAccess) {
      validate(next);
    }
    setS(next);
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
        title: "Настройки",
        mode,
        redirectTo: "/history",
      },
    });
  };

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
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        {mode === "timed" && hasProAccess && (
          <div className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded shadow mb-3 w-fit">
            ⏱ Время: {elapsed}s
          </div>
        )}

        <h1 className="text-xl font-bold mb-2">Настройки</h1>
        <p className="text-sm text-gray-600 mb-4">
          Проверьте конфликты, сохранение и UX-поведение
        </p>

        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <span>Тема</span>
            <select
              className="input"
              value={s.theme}
              onChange={(e) => toggle("theme", e.target.value as any)}
            >
              <option value="light">Светлая</option>
              <option value="dark">Тёмная</option>
            </select>
          </div>

          <label className="flex items-center justify-between">
            <span>Уведомления</span>
            <input
              type="checkbox"
              checked={s.notifications}
              onChange={(e) => toggle("notifications", e.target.checked)}
            />
          </label>

          <label className="flex items-center justify-between">
            <span>Компактный режим</span>
            <input
              type="checkbox"
              checked={s.compactMode}
              onChange={(e) => toggle("compactMode", e.target.checked)}
            />
          </label>

          <div className="flex items-center justify-between">
            <span>Язык интерфейса</span>
            <select
              className="input"
              value={s.language}
              onChange={(e) => toggle("language", e.target.value as any)}
            >
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>

          {errors.length > 0 && (
            <div className="text-red-500 text-sm" aria-live="assertive">
              {errors.map((x, i) => <div key={i}>• {x}</div>)}
            </div>
          )}

          {warning && (
            <div className="text-amber-600 text-sm">
              • {warning}
            </div>
          )}

          {saved && <div className="text-green-600 text-sm" aria-live="polite">Сохранено</div>}

          <button className="btn btn-primary" onClick={save}>
            Сохранить настройки
          </button>

          <div className="flex gap-2 mt-2">
            <button className="btn btn-secondary" onClick={handleEvaluate}>
              Оценить баг
            </button>
            <button className="btn" onClick={handleExit}>
              Выйти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsForm;







