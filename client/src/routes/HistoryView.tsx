import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ReportCard from "../components/ReportCard";
import { useAppStore } from "../store/useAppStore";
import roboto from "../fonts/Roboto-Regular.js";

// Регистрация шрифта Roboto без ошибок Типскрипта
jsPDF.API.events.push([
  "addFonts",
  function (this: jsPDF) {
    this.addFileToVFS("Roboto-Regular.ttf", roboto);
    this.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  },
]);

// Мягкий тип отчёта, чтобы исключить ошибки о отсутствующих полях
type BugReportType = {
  id?: string | number;
  title?: string;
  priority?: number | string;
  description?: string;
  environment?: string;
  steps?: string[];
  actualResult?: string;
  expectedResult?: string;
  score?: number;
  timestamp?: string;
};

const HistoryView = () => {
  const history = useAppStore((s) => s.history as BugReportType[]);
  const clear = useAppStore((s) => s.clearHistory);

  const exportPDF = (report: BugReportType) => {
    const doc = new jsPDF();

    doc.setFont("Roboto", "normal");
    doc.setFontSize(14);
    doc.text(`📝 Баг-репорт: ${report.title || "Без названия"}`, 10, 20);

    const safe = (val: unknown): string => {
      if (typeof val === "string") return val.trim() || "-";
      if (typeof val === "number") return Number.isFinite(val) ? String(val) : "-";
      if (val === null || val === undefined) return "-";
      return String(val);
    };

    const steps =
      Array.isArray(report.steps) && report.steps.length > 0
        ? report.steps.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")
        : "-";

    autoTable(doc, {
      startY: 30,
      theme: "grid",
      styles: {
        font: "Roboto",
        fontSize: 12,
        cellPadding: 4,
        valign: "top",
      },
      head: [["Поле", "Значение"]],
      body: [
        ["Приоритет", safe(report.priority)],
        ["Описание", safe(report.description)],
        ["Окружение", safe(report.environment)],
        ["Шаги", steps],
        ["Фактический результат", safe(report.actualResult)],
        ["Ожидаемый результат", safe(report.expectedResult)],
        ["Оценка", safe(report.score)],
        ["Дата", safe(report.timestamp)],
      ],
    });

    doc.save(`bug-report-${report.id ?? "unknown"}.pdf`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="title">📁 История оцененных отчётов</h1>
        {history.length > 0 && (
          <button className="btn btn-secondary" onClick={clear}>
            🗑 Очистить
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-sm text-gray-500">
          История пока пуста. Оцените первый отчёт, чтобы он здесь появился.
        </div>
      ) : (
        history.map((r) => (
          <div key={String(r.id ?? Math.random())} className="mb-6">
            <ReportCard report={r as any} />
            <button
              className="btn btn-secondary mt-2"
              onClick={() => exportPDF(r)}
            >
              📄 Экспорт в PDF
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default HistoryView;











