import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";

const nameRegex = /^[A-Za-zА-Яа-яЁё\s'-]{2,}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ProfileForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode ?? "normal";

  const startTimer = useAppStore((s) => s.startTimer);
  const stopTimer = useAppStore((s) => s.stopTimer);
  const getElapsedTime = useAppStore((s) => s.getElapsedTime);
  const hasProAccess = useAppStore((s) => s.hasProAccess);

  const keepTimerOnNavigateRef = useRef(false);
  const [elapsed, setElapsed] = useState(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [about, setAbout] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("profile");
    if (raw) {
      const p = JSON.parse(raw);
      setName(p.name ?? "");
      setEmail(p.email ?? "");
      setAbout(p.about ?? "");
      setPhone(p.phone ?? "");
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

  const validate = () => {
    const e: Record<string, string> = {};

    // Базовые проверки
    if (!nameRegex.test(name)) e.name = "Имя должно быть не короче 2 символов и без цифр";
    if (name.trim() === "") e.name = "Имя не может быть пустым";
    if (name.length > 50) e.name = "Имя слишком длинное (максимум 50 символов)";

    if (!emailRegex.test(email)) e.email = "Неверный email";
    if (email.trim() === "") e.email = "Email не может быть пустым";
    if (email.length > 100) e.email = "Email слишком длинный (максимум 100 символов)";
    if (/['";]/.test(email)) e.email = "Email содержит недопустимые спецсимволы";

    if (!/^\+?\d[\d\s()-]{7,}$/.test(phone)) e.phone = "Телефон указан некорректно";

    // Усиленные проверки для Pro в режиме timed
    if (mode === "timed" && hasProAccess) {
      // Бизнес‑логика
      if (about.trim().length < 10) e.about = "Описание должно быть информативнее (минимум 10 символов)";
      if (email.toLowerCase().includes(name.trim().toLowerCase()) && name.trim().length > 0) {
        e.email = "Email не должен содержать имя пользователя";
      }
      if (phone.startsWith("+0")) e.phone = "Код страны не может начинаться с 0";

      // UX‑краевые сценарии
      if (about.length > 200) e.about = "Описание слишком длинное (максимум 200 символов)";
      if (!/[A-ZА-Я]/.test(name)) e.name = "Имя должно содержать хотя бы одну заглавную букву";

      // Edge cases
      if (/^[\s'-]+$/.test(name)) e.name = "Некорректное имя пользователя";
      if (/--|\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\b/i.test(email)) {
        e.email = "Email содержит потенциально опасные последовательности";
      }
      if (!/^\+?[1-9]\d{0,2}/.test(phone)) e.phone = "Некорректный код страны";
    }

    return e;
  };

  const applyPhoneMask = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    let out = digits;
    if (digits.length >= 1) out = `+${digits[0]} ${digits.slice(1)}`;
    if (digits.length >= 4) out = `+${digits[0]} (${digits.slice(1,4)}) ${digits.slice(4)}`;
    if (digits.length >= 7) out = `+${digits[0]} (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
    if (digits.length >= 9) out = `+${digits[0]} (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7,9)}-${digits.slice(9,11)}`;
    return out;
  };

  const handleSave = () => {
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    const profile = { name: name.trim(), email: email.trim(), phone: phone.trim(), about: about.trim() };
    localStorage.setItem("profile", JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
        title: "Профиль пользователя",
        mode,
        redirectTo: "/history",
      },
    });
  };

  // Заглушка для Pro-режима
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
      <div aria-labelledby="profile-title" className="w-full max-w-md p-6 bg-white rounded shadow">
        {mode === "timed" && hasProAccess && (
          <div className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded shadow mb-3 w-fit">
            ⏱ Время: {elapsed}s
          </div>
        )}

        <h1 id="profile-title" className="text-xl font-bold mb-2">Профиль пользователя</h1>
        <p className="text-sm text-gray-600 mb-4">Редактируйте и проверяйте логику формы</p>

        <div className="grid gap-4">
          <div>
            <label className="label" htmlFor="pf-name">Имя</label>
            <input
              id="pf-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!errors.name}
              maxLength={60}
            />
            {errors.name && <div className="text-red-500 text-sm">{errors.name}</div>}
          </div>

          <div>
            <label className="label" htmlFor="pf-email">Email</label>
            <input
              id="pf-email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
              maxLength={120}
            />
            {errors.email && <div className="text-red-500 text-sm">{errors.email}</div>}
          </div>

          <div>
            <label className="label" htmlFor="pf-about">О себе</label>
            <textarea
              id="pf-about"
              className="input"
              rows={3}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              aria-invalid={!!errors.about}
              placeholder="Краткая информация..."
              maxLength={250}
            />
            {errors.about && <div className="text-red-500 text-sm">{errors.about}</div>}
            {about.length > 180 && (
              <div className="text-xs text-gray-500 mt-1">
                Подсказка: сделайте описание кратким и информативным (до 200 символов).
              </div>
            )}
          </div>

          <div>
            <label className="label" htmlFor="pf-phone">Телефон</label>
            <input
              id="pf-phone"
              className="input"
              value={phone}
              onChange={(e) => setPhone(applyPhoneMask(e.target.value))}
              aria-invalid={!!errors.phone}
              placeholder="+7 (___) ___-__-__"
              maxLength={20}
            />
            {errors.phone && <div className="text-red-500 text-sm">{errors.phone}</div>}
          </div>

          {saved && <div className="text-green-600 text-sm">Профиль сохранён</div>}

          <div className="flex gap-2 mt-2">
            <button className="btn btn-primary" onClick={handleSave}>
              Сохранить
            </button>
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

export default ProfileForm;










