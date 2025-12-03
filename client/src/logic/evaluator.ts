import { blacklist } from "./blacklist";

type BugInput = {
  title: string;
  description: string;
  environment: string;
  priority: number;
  steps: string[];
  actualResult: string;
  expectedResult: string;
  severity: number;
};

export const evaluateBug = (input: BugInput) => {
  const { title, steps, severity } = input;

  let score = 100;
  const penalties: string[] = [];

  if (title.length < 10) {
    score -= 20;
    penalties.push("Слишком короткий заголовок");
  }

  if (steps.length < 2) {
    score -= 15;
    penalties.push("Недостаточно шагов воспроизведения");
  }

  const duplicateSteps = steps.filter(
    (s, i, arr) => arr.indexOf(s) !== i && s.trim() !== ""
  );
  if (duplicateSteps.length > 0) {
    score -= 10;
    penalties.push("Повторяющиеся шаги воспроизведения");
  }

  if (blacklist.some((word) => title.toLowerCase().includes(word))) {
    score -= 25;
    penalties.push("Заголовок содержит запрещённые слова");
  }

  if (severity === 0) {
    score -= 5;
    penalties.push("Не указана серьёзность бага");
  }

  score -= severity * 5;

  return {
    ...input,
    score,
    penalties,
  };
};


