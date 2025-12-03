import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";

type Task = {
  title: string;
  priority: number;
  due: string;
  done: boolean;
};

const TasksList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode ?? "normal";

  const startTimer = useAppStore((s) => s.startTimer);
  const stopTimer = useAppStore((s) => s.stopTimer);
  const getElapsedTime = useAppStore((s) => s.getElapsedTime);
  const hasProAccess = useAppStore((s) => s.hasProAccess);

  const keepTimerOnNavigateRef = useRef(false);
  const [elapsed, setElapsed] = useState(0);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(2);
  const [due, setDue] = useState("");
  const [error, setError] = useState("");

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

  const addTask = () => {
    const t = title.trim();

    // Базовые проверки
    if (t === "") {
      setError("Задача не может быть пустой");
      return;
    }
    if (t.length < 3) {
      setError("Задача должна быть не короче 3 символов");
      return;
    }

    // Усиленные проверки для Pro (timed)
    if (mode === "timed" && hasProAccess) {
      if (tasks.some(task => task.title.toLowerCase() === t.toLowerCase())) {
        setError("Такая задача уже существует");
        return;
      }
      if (priority < 0 || priority > 4) {
        setError("Приоритет должен быть от 0 до 4");
        return;
      }
      if (t.length > 100) {
        setError("Название задачи слишком длинное (максимум 100 символов)");
        return;
      }
      if (/['";]/.test(t)) {
        setError("Название задачи содержит недопустимые символы");
        return;
      }
      if (/--|\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\b/i.test(t)) {
        setError("Название задачи содержит потенциально опасные последовательности");
        return;
      }
      if (due) {
        const dueDate = new Date(due);
        const now = new Date();
        dueDate.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        if (dueDate < now) {
          setError("Срок задачи не может быть в прошлом");
          return;
        }
      }
    }

    const newTask: Task = { title: t, priority, due, done: false };
    setTasks((prev) => [...prev, newTask]);
    setTitle("");
    setDue("");
    setError("");
  };

  const toggleDone = (index: number) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, done: !t.done } : t))
    );
  };

  const removeTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const sorted = useMemo(() => {
    const s = [...tasks].sort((a, b) => Number(a.done) - Number(b.done));
    s.sort((a, b) => b.priority - a.priority);
    return s;
  }, [tasks]);

  const isOverdue = (task: Task) => {
    if (!task.due) return false;
    const dueDate = new Date(task.due);
    const today = new Date();
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return !task.done && dueDate < today;
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
        title: "Список задач",
        mode,
        redirectTo: "/history",
      },
    });
  };

  // Заглушка для Pro-режима
  if (mode === "timed" && !hasProAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-6 bg-white rounded shadow textcenter">
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

        <h1 className="text-xl font-bold mb-2">Список задач</h1>
        <p className="text-sm text-gray-600 mb-4">
          Добавляйте задачи, приоритеты и сроки — найдите логику и UX-баги
        </p>

        <div className="grid gap-3">
          <div>
            <label className="label">Название</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Проверить форму входа"
              maxLength={120}
              aria-invalid={!!error}
            />
            {title.length > 80 && (
              <div className="text-xs text-gray-500 mt-1">
                Подсказка: сократите название до 100 символов.
              </div>
            )}
          </div>
          <div>
            <label className="label">Приоритет: {priority}</label>
            <input
              type="range"
              min={0}
              max={4}
              value={priority}
              onChange={(e) => setPriority(+e.target.value)}
              aria-valuemin={0}
              aria-valuemax={4}
              aria-valuenow={priority}
            />
          </div>
          <div>
            <label className="label">Срок (необязательно)</label>
            <input
              type="date"
              className="input"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </div>

          {error && <div className="text-red-500 text-sm" aria-live="assertive">{error}</div>}

          <button className="btn btn-primary" onClick={addTask}>
            Добавить
          </button>
        </div>

        <ul className="divide-y divide-gray-200 mt-6 text-sm text-gray-700">
          {sorted.map((task, index) => (
            <li key={index} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleDone(index)}
                  aria-label={`Отметить выполненной задачу ${task.title}`}
                />
                <span className={task.done ? "line-through text-gray-500" : ""}>
                  {task.title}
                </span>
                <span className="px-2 py-1 text-xs rounded bg-gray-100">
                  P{task.priority}
                </span>
                {task.due && (
                  <span className={`text-xs ${isOverdue(task) ? "text-red-600" : "text-gray-500"}`}>
                    до {task.due}
                    {task.done && new Date(task.due) > new Date() && (
                      <span className="ml-2 text-green-600">(выполнено досрочно)</span>
                    )}
                    {isOverdue(task) && !task.done && (
                      <span className="ml-2 text-red-600">(просрочено)</span>
                    )}
                  </span>
                )}
              </div>
              <button
                className="text-red-500 text-sm"
                onClick={() => removeTask(index)}
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>

        <div className="flex gap-2 mt-4">
          <button className="btn btn-secondary" onClick={handleEvaluate}>
            Оценить баг
          </button>
          <button className="btn" onClick={handleExit}>
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
};

export default TasksList;










