const StepsEditor = ({ steps, setSteps }: { steps: string[]; setSteps: (s: string[]) => void }) => {
  const updateStep = (i: number, value: string) => {
    const copy = [...steps];
    copy[i] = value;
    setSteps(copy);
  };
  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <input
          key={i}
          className="input"
          value={step}
          onChange={(e) => updateStep(i, e.target.value)}
          placeholder={`Шаг ${i + 1}`}
        />
      ))}
      <button className="btn btn-secondary" onClick={() => setSteps([...steps, ""])}>+ Добавить шаг</button>
    </div>
  );
};
export default StepsEditor;
