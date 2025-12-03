const SeverityBadge = ({ level }: { level: number }) => {
  const colors = ["gray", "green", "yellow", "orange", "red"];
  const labels = ["Нет", "Низкий", "Средний", "Высокий", "Критический"];
  return (
    <span className={`px-2 py-1 rounded text-white bg-${colors[level]}-600 text-xs`}>
      {labels[level]}
    </span>
  );
};
export default SeverityBadge;
