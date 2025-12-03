import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAppStore } from "../store/useAppStore";

type Material = {
  id: string;
  title: string;
  description: string;
  file: string;
  addedAt: string;
};

const Home = () => {
  const navigate = useNavigate();

  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const loadMode = useAppStore((s) => s.loadMode);

  const isCardUnlocked = useAppStore((s) => s.isCardUnlocked);
  const hasProAccess = useAppStore((s) => s.hasProAccess);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadMode();

    if (mode === "theory") {
      fetch("/materials.json")
        .then((res) => res.json())
        .then(setMaterials)
        .catch(() => setError(true));
    }
  }, [mode, loadMode]);

  const checkUnlocked = (id: string) => {
    if (mode === "timed" && hasProAccess) {
      return id === "login-form" || isCardUnlocked(id);
    }
    return false;
  };

  return (
    <div>
      <h1 className="title mb-2">
        {mode === "theory" ? "📘 Теоретические материалы" : "🧪 Тестовые объекты"}
      </h1>
      <p className="subtitle mb-4">
        {mode === "theory"
          ? "Ознакомьтесь с методичками и презентациями"
          : "Выберите компонент для тестирования"}
      </p>

      <div className="mb-6">
        <label className="label mb-1">Режим обучения</label>
        <select
          className="input"
          value={mode}
          onChange={(e) =>
            setMode(e.target.value as "timed" | "theory")
          }
        >
          <option value="theory">Теоретический режим</option>
          <option value="timed">Режим с таймером</option>
        </select>
      </div>

      {mode === "timed" && (
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              id: "login-form",
              title: "Форма входа",
              description: "Проверка авторизации пользователя с разными типами данных",
              route: "/login-test",
            },
            {
              id: "profile-form",
              title: "Профиль пользователя",
              description: "Редактирование и отображение информации о пользователе",
              route: "/profile",
            },
            {
              id: "task-list",
              title: "Список задач",
              description: "Добавление, удаление и фильтрация задач",
              route: "/tasks",
            },
            {
              id: "payment-form",
              title: "Форма оплаты",
              description: "Проверка авторизации пользователя с разными типами данных",
              route: "/payment",
            },
            {
              id: "settings-form",
              title: "Настройки",
              description: "Проверка авторизации пользователя с разными типами данных",
              route: "/settings",
            },
          ].map((obj) => {
            const unlocked = checkUnlocked(obj.id);

            return (
              <div
                key={obj.route}
                className="bg-white shadow-md rounded-lg p-4 border hover:border-blue-500 transition"
              >
                <div className="font-bold text-blue-700 mb-1">{obj.title}</div>
                <div className="text-sm text-gray-600 mb-4">{obj.description}</div>

                {unlocked ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate(obj.route, { state: { mode } })}
                  >
                    🔍 Перейти к компоненту
                  </button>
                ) : (
                  <div className="text-red-500 text-sm font-semibold">
                    🚫 ЗАКРЫТО. Пройдите предыдущую карточку
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {mode === "theory" && (
        <>
          {error ? (
            <div className="text-red-500 font-semibold mt-4">
              ⚠ Не удалось загрузить список материалов. Проверь путь: /materials.json
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {materials.map((m) => (
                <div
                  key={m.id}
                  className="bg-white shadow-md rounded-lg p-4 border hover:border-blue-500 transition"
                >
                  <div className="font-bold text-blue-700 mb-1">{m.title}</div>
                  <div className="text-sm text-gray-600 mb-2">{m.description}</div>
                  <div className="text-xs text-gray-400 mb-4">📅 {m.addedAt}</div>
                  <a
                    href={m.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    📄 Открыть материал
                  </a>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;







