const ScoreRing = ({ score }: { score: number }) => (
  <div className="text-center">
    <div className="text-4xl font-bold text-brand-600">{score}</div>
    <div className="text-sm text-gray-500">Итоговая оценка</div>
  </div>
);
export default ScoreRing;
