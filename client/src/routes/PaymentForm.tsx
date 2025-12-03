import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";

const luhnCheck = (num: string) => {
  const arr = num.replace(/\s+/g, "").split("").reverse().map(Number);
  const sum = arr.reduce((acc, d, i) => acc + (i % 2 ? ((d *= 2) > 9 ? d - 9 : d) : d), 0);
  return sum % 10 === 0;
};

const PaymentForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode ?? "normal";

  const startTimer = useAppStore((s) => s.startTimer);
  const stopTimer = useAppStore((s) => s.stopTimer);
  const getElapsedTime = useAppStore((s) => s.getElapsedTime);
  const hasProAccess = useAppStore((s) => s.hasProAccess);

  const keepTimerOnNavigateRef = useRef(false);
  const [elapsed, setElapsed] = useState(0);

  const [card, setCard] = useState("");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState(""); // MM/YY
  const [cvv, setCvv] = useState("");
  const [amount, setAmount] = useState("1000");
  const [currency, setCurrency] = useState<"USD" | "EUR" | "RUB">("RUB");
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState("");

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

  const formatCard = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const validate = () => {
    const e: string[] = [];
    const digits = card.replace(/\s/g, "");

    // Базовые проверки
    if (digits.length < 16 || !luhnCheck(digits)) e.push("Номер карты некорректен");
    if (!/^[A-Za-zА-Яа-яЁё\s'-]{2,}$/.test(name)) e.push("Имя владельца некорректно");
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) e.push("Срок действия должен быть в формате MM/YY");
    if (!/^\d{3,4}$/.test(cvv)) e.push("CVV должен быть 3-4 цифры");
    if (!amount || isNaN(Number(amount))) e.push("Сумма некорректна");

    // Усиленные проверки для Pro (timed)
    if (mode === "timed" && hasProAccess) {
      // Срок действия не в прошлом
      const [mm, yy] = expiry.split("/");
      if (mm && yy) {
        const expDate = new Date(Number("20" + yy), Number(mm) - 1, 1);
        const now = new Date();
        expDate.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        if (expDate < now) e.push("Срок действия карты истёк");
      }

      // Сумма
      const amountNum = Number(amount);
      if (amountNum <= 0) e.push("Сумма должна быть больше нуля");
      if (!Number.isInteger(amountNum) && currency === "RUB") e.push("Для RUB сумма должна быть целым числом");
      if (amountNum > 1000000) e.push("Сумма слишком большая");

      // Имя владельца
      const hasCyrillic = /[А-Яа-яЁё]/.test(name);
      if (currency === "RUB" && !hasCyrillic) e.push("Для валюты RUB имя должно быть на кириллице");
      if ((currency === "USD" || currency === "EUR") && hasCyrillic) e.push("Для USD/EUR имя должно быть латиницей");
      if (name.toUpperCase().includes(currency)) e.push("Имя владельца не должно содержать название валюты");
      if (name.trim().length > 50) e.push("Имя владельца слишком длинное");
      if (/['";]/.test(name)) e.push("Имя содержит недопустимые символы");

      // CVV edge cases
      if (currency === "RUB" && cvv.length !== 3) e.push("Для RUB CVV должен быть ровно 3 цифры");
      if ((currency === "USD" || currency === "EUR") && (cvv.length < 3 || cvv.length > 4)) {
        e.push("Для USD/EUR CVV должен быть 3–4 цифры");
      }

      // Номер карты
      if (/^0+$/.test(digits)) e.push("Номер карты не может состоять из одних нулей");
    }

    return e;
  };

  const handlePay = async () => {
    setSuccess("");
    const e = validate();
    setErrors(e);
    if (e.length > 0) return;

    await new Promise((r) => setTimeout(r, 700));
    setSuccess("Оплата прошла успешно");
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
        title: "Оплата",
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
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        {mode === "timed" && hasProAccess && (
          <div className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded shadow mb-3 w-fit">
            ⏱ Время: {elapsed}s
          </div>
        )}

        <h1 className="text-xl font-bold mb-2">Оплата</h1>
        <p className="text-sm text-gray-600 mb-4">
          Введите данные карты. Найдите все возможные баги и UX-края.
        </p>

        <div className="grid gap-4">
          <div>
            <label className="label">Номер карты</label>
            <input
              className="input"
              value={card}
              onChange={(e) => setCard(formatCard(e.target.value))}
              placeholder="4242 4242 4242 4242"
              inputMode="numeric"
              maxLength={19}
            />
          </div>

          <div>
            <label className="label">Имя владельца</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="IVAN IVANOV"
              maxLength={60}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">MM/YY</label>
              <input
                className="input"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="12/27"
                inputMode="numeric"
                maxLength={5}
              />
            </div>
            <div>
              <label className="label">CVV</label>
              <input
                className="input"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="123"
                inputMode="numeric"
                maxLength={4}
              />
            </div>
            <div>
              <label className="label">Сумма</label>
              <input
                className="input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
                inputMode="numeric"
                maxLength={10}
              />
            </div>
          </div>

          <div>
            <label className="label">Валюта</label>
            <select
              className="input"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
            >
              <option value="RUB">RUB</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>

          {errors.length > 0 && (
            <div className="text-red-500 text-sm" aria-live="assertive">
              {errors.map((x, i) => <div key={i}>• {x}</div>)}
            </div>
          )}

          {success && (
            <div className="text-green-600 text-sm" aria-live="polite">
              {success}
            </div>
          )}

          <button className="btn btn-primary" onClick={handlePay}>
            Оплатить
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

export default PaymentForm;





