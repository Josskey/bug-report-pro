import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../components/Card";
import StepsEditor from "../components/StepsEditor";
import { useAppStore } from "../store/useAppStore";
import { evaluateBug } from "../logic/evaluator";

const CARD_ID_MAP: Record<string, string> = {
  "Форма входа": "login-form",
  "Профиль пользователя": "profile-form",
  "Список задач": "task-list",
  "Оплата": "payment-form",
  "Настройки": "settings-form",
};

const ReportForm = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const initialTitle = location.state?.title || "";
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState("");
  const [environment, setEnvironment] = useState("");
  const [priority, setPriority] = useState(2);
  const [steps, setSteps] = useState([""]);
  const [actualResult, setActualResult] = useState("");
  const [expectedResult, setExpectedResult] = useState("");

  const addToHistory = useAppStore((s) => s.addToHistory);
  const markCardComplete = useAppStore((s) => s.markCardComplete);

  const handleSubmit = () => {
    const result = evaluateBug({
      title,
      description,
      environment,
      priority,
      steps,
      actualResult,
      expectedResult,
      severity: priority,
    });

    const safeScore = Number.isFinite(result.score) ? result.score : 0;
    const safeSeverity = Number.isFinite(result.severity) ? result.severity : 0;
    const safePenalties = Array.isArray(result.penalties) ? result.penalties : [];

    addToHistory({
      id: Date.now().toString(),
      title,
      description,
      environment,
      priority,
      steps,
      actualResult,
      expectedResult,
      score: safeScore,
      severity: safeSeverity,
      penalties: safePenalties,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toLocaleString(),
    });

    // ✅ универсальная отметка завершения по заголовку
    const cardId = CARD_ID_MAP[title];
    if (cardId) {
      markCardComplete(cardId);
    }

    const redirectTo = location.state?.redirectTo ?? "/history";
    navigate(redirectTo);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-3xl p-6 bg-white rounded shadow">
        <h1 className="text-xl font-bold mb-2">📝 Баг-репорт: {title || "Новый баг"}</h1>
        <p className="text-sm text-gray-600 mb-4">Заполните все поля для полноценной оценки</p>

        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Заголовок</label>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="[UI] Кнопка не работает..."
              />
            </div>
            <div>
              <label className="label">Приоритет</label>
              <input
                type="range"
                min={0}
                max={4}
                value={priority}
                onChange={(e) => setPriority(+e.target.value)}
              />
              <div className="text-sm text-gray-500 mt-1">Уровень: {priority}</div>
            </div>
            <div className="md:col-span-2">
              <label className="label">Описание</label>
              <textarea
                className="input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание проблемы..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Окружение</label>
              <input
                className="input"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                placeholder="Chrome 119, Windows 11, Desktop"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="label">Шаги воспроизведения</label>
            <StepsEditor steps={steps} setSteps={setSteps} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <div>
              <label className="label">Фактический результат</label>
              <textarea
                className="input"
                rows={2}
                value={actualResult}
                onChange={(e) => setActualResult(e.target.value)}
                placeholder="Что произошло на самом деле..."
              />
            </div>
            <div>
              <label className="label">Ожидаемый результат</label>
              <textarea
                className="input"
                rows={2}
                value={expectedResult}
                onChange={(e) => setExpectedResult(e.target.value)}
                placeholder="Что должно было произойти..."
              />
            </div>
          </div>

          <button className="btn btn-primary mt-6" onClick={handleSubmit}>
            ✅ Оценить баг-репорт
          </button>
        </Card>
      </div>
    </div>
  );
};

export default ReportForm;










