import { Check } from "lucide-react";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";

type ChecklistStep = {
  label: string;
  done: boolean;
};

/**
 * "Быстрый старт" — редизайн 2026-09 (Claude Design канвас, "в духе Stan
 * Store"). Все 3 шага считаются из данных, которые страница и так уже
 * загружает (accounts + шаблоны) — никакого нового бэкенд-поля/эндпоинта
 * под это не заводили.
 */
export function OnboardingChecklist({
  hasAccount,
  hasTemplate,
  hasActiveTemplate,
}: {
  hasAccount: boolean;
  hasTemplate: boolean;
  hasActiveTemplate: boolean;
}) {
  const steps: ChecklistStep[] = [
    { label: "Подключите Instagram", done: hasAccount },
    { label: "Создайте первый шаблон", done: hasTemplate },
    { label: "Включите его", done: hasActiveTemplate },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  // Весь чек-лист пройден — прятать карточку не стали: "100%" с зелёной
  // галочкой на всех трёх шагах сам по себе читается как "всё готово",
  // отдельное пустое состояние тут не нужно.
  return (
    <Card padding={5}>
      <div className="mb-3 flex items-center justify-between">
        <Text weight="medium">Быстрый старт</Text>
        <Text color="accent" type="supporting" weight="medium">
          {doneCount} из {steps.length}
        </Text>
      </div>

      {/* ProgressBar не принимает className — обёртка снаружи для отступа */}
      <div className="mb-4">
        <ProgressBar
          label="Прогресс онбординга"
          isLabelHidden
          value={doneCount}
          max={steps.length}
          variant="success"
        />
      </div>

      <div className="flex flex-col gap-3">
        {steps.map((step) => (
          <div key={step.label} className="flex items-center gap-3">
            <div
              className={
                step.done
                  ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success text-on-success"
                  : "h-5 w-5 shrink-0 rounded-full border-2 border-strong"
              }
            >
              {step.done && <Check size={12} strokeWidth={3} />}
            </div>
            <Text
              type="supporting"
              color={step.done ? "secondary" : "primary"}
              weight={step.done ? "normal" : "medium"}
              className={step.done ? "line-through" : undefined}
            >
              {step.label}
            </Text>
          </div>
        ))}
      </div>
    </Card>
  );
}
