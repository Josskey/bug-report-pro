import type { BugReport } from "../store/useAppStore";

const ReportCard = ({ report }: { report: BugReport }) => {
  const severityColors = ["gray", "green", "yellow", "orange", "red"];
  const severityLabels = ["Нет", "Низкий", "Средний", "Высокий", "Критический"];

  return (
    <div className="section mb-4 border-l-4 pl-4 border-brand-500">
      <div className="flex justify-between items-center mb-2">
        <div className="font-bold text-brand-700">{report.title}</div>
        <span className={`text-xs px-2 py-1 rounded bg-${severityColors[report.severity]}-600 text-white`}>
          {severityLabels[report.severity]}
        </span>
      </div>
      <div className="text-sm text-gray-500 mb-2">
        Оценка: <strong>{report.score}</strong> · {new Date(report.createdAt).toLocaleString()}
      </div>
      <ul className="list-disc pl-4 text-sm text-gray-600">
        {report.penalties.map((p, i) => <li key={i}>{p}</li>)}
      </ul>
    </div>
  );
};

export default ReportCard;
