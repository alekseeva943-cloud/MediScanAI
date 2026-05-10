// src/components/PatientProfilePanel.tsx

// Панель профиля пациента.
//
// Безопасный рендер profile-данных.
//
// Что исправлено:
//
// - убран опасный прямой рендер объектов
// - добавлен universal safe renderer
// - React больше не падает на object
// - добавлена безопасная обработка массивов
// - добавлена базовая типизация
// - UI теперь устойчив к нестабильному GPT output

import {
  X,
  Brain,
  Activity
} from "lucide-react";

import {
  motion,
  AnimatePresence
} from "motion/react";

// -----------------------------------
// TYPES
// -----------------------------------

interface Props {

  isOpen: boolean;

  onClose: () => void;

  profile: unknown;
}

type SafeObject = Record<
  string,
  unknown
>;

// -----------------------------------
// SAFE VALUE RENDER
// -----------------------------------

const renderValue = (
  value: unknown
): string => {

  // NULL / UNDEFINED

  if (
    value === null
    ||
    value === undefined
  ) {

    return "—";
  }

  // STRING

  if (
    typeof value === "string"
  ) {

    return value;
  }

  // NUMBER

  if (
    typeof value === "number"
  ) {

    return String(value);
  }

  // BOOLEAN

  if (
    typeof value === "boolean"
  ) {

    return value
      ? "Да"
      : "Нет";
  }

  // ARRAY

  if (
    Array.isArray(value)
  ) {

    return value
      .map((item) => renderValue(item))
      .join(", ");
  }

  // OBJECT

  if (
    typeof value === "object"
  ) {

    const obj = value as SafeObject;

    // symptom + anatomy

    if (
      obj.symptom
      &&
      obj.anatomy
    ) {

      return `${obj.symptom} (${obj.anatomy})`;
    }

    // type + location

    if (
      obj.type
      &&
      obj.location
    ) {

      return `${obj.type} (${obj.location})`;
    }

    // symptom only

    if (
      obj.symptom
    ) {

      return String(obj.symptom);
    }

    // location only

    if (
      obj.location
    ) {

      return String(obj.location);
    }

    // type only

    if (
      obj.type
    ) {

      return String(obj.type);
    }

    // name

    if (
      obj.name
    ) {

      return String(obj.name);
    }

    // fallback

    return JSON.stringify(obj);
  }

  return String(value);
};

// -----------------------------------
// SECTION
// -----------------------------------

interface SectionProps {

  title: string;

  children: React.ReactNode;
}

const Section = ({
  title,
  children
}: SectionProps) => (

  <div className="space-y-2">

    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
      {title}
    </h3>

    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
      {children}
    </div>

  </div>
);

// -----------------------------------
// ARRAY BLOCK
// -----------------------------------

interface ArrayBlockProps {

  items: unknown;
}

const ArrayBlock = ({
  items
}: ArrayBlockProps) => {

  const safeItems = Array.isArray(items)
    ? items
    : [];

  // EMPTY

  if (safeItems.length === 0) {

    return (
      <span className="text-slate-400 text-sm">
        Нет данных
      </span>
    );
  }

  // RENDER

  return (

    <div className="flex flex-wrap gap-2">

      {safeItems.map(
        (
          item,
          i
        ) => (

          <div

            key={`${renderValue(item)}-${i}`}

            className="px-2 py-1 rounded-full bg-white border border-slate-200 text-xs text-slate-700"
          >

            {renderValue(item)}

          </div>
        )
      )}

    </div>
  );
};

// -----------------------------------
// COMPONENT
// -----------------------------------

export const PatientProfilePanel = ({
  isOpen,
  onClose,
  profile
}: Props) => {

  const safeProfile = (
    typeof profile === "object"
    &&
    profile !== null
  )
    ? profile as SafeObject
    : {};

  const pain = (
    typeof safeProfile.pain === "object"
    &&
    safeProfile.pain !== null
  )
    ? safeProfile.pain as SafeObject
    : {};

  const trauma = (
    typeof safeProfile.trauma === "object"
    &&
    safeProfile.trauma !== null
  )
    ? safeProfile.trauma as SafeObject
    : {};

  return (

    <AnimatePresence>

      {isOpen && (

        <>

          {/* BACKDROP */}

          <motion.div

            initial={{
              opacity: 0
            }}

            animate={{
              opacity: 1
            }}

            exit={{
              opacity: 0
            }}

            onClick={onClose}

            className="absolute inset-0 bg-black/40 z-40"
          />

          {/* PANEL */}

          <motion.div

            initial={{
              x: 420
            }}

            animate={{
              x: 0
            }}

            exit={{
              x: 420
            }}

            transition={{
              type: "spring",
              damping: 24
            }}

            className="absolute top-0 right-0 w-[420px] h-full bg-white z-50 shadow-2xl border-l border-slate-200 flex flex-col"
          >

            {/* HEADER */}

            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center">

                  <Brain
                    size={18}
                    className="text-teal-600"
                  />

                </div>

                <div>

                  <h2 className="font-bold text-slate-800">
                    Профиль пациента
                  </h2>

                  <p className="text-xs text-slate-400">
                    AI Clinical State
                  </p>

                </div>

              </div>

              <button

                onClick={onClose}

                className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center"
              >

                <X size={18} />

              </button>

            </div>

            {/* CONTENT */}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* MAIN */}

              <Section title="Главная жалоба">

                <div className="text-sm text-slate-700">
                  {renderValue(
                    safeProfile.mainComplaint
                  )}
                </div>

              </Section>

              {/* PAIN */}

              <Section title="Боль">

                <div className="space-y-2 text-sm">

                  <div>

                    <span className="text-slate-400">
                      Локализация:
                    </span>{" "}

                    {renderValue(
                      pain.location
                    )}

                  </div>

                  <div>

                    <span className="text-slate-400">
                      Характер:
                    </span>{" "}

                    {renderValue(
                      pain.character
                    )}

                  </div>

                  <div>

                    <span className="text-slate-400">
                      Длительность:
                    </span>{" "}

                    {renderValue(
                      pain.duration
                    )}

                  </div>

                </div>

              </Section>

              {/* SYMPTOMS */}

              <Section title="Симптомы">

                <ArrayBlock
                  items={safeProfile.symptoms}
                />

              </Section>

              {/* NEGATIVE */}

              <Section title="Отрицательные симптомы">

                <ArrayBlock
                  items={safeProfile.negativeFindings}
                />

              </Section>

              {/* TRAUMA */}

              <Section title="Травма">

                <div className="space-y-2 text-sm">

                  <div>

                    <span className="text-slate-400">
                      Наличие:
                    </span>{" "}

                    {renderValue(
                      trauma.exists
                    )}

                  </div>

                  <div>

                    <span className="text-slate-400">
                      Механизм:
                    </span>{" "}

                    {renderValue(
                      trauma.mechanism
                    )}

                  </div>

                </div>

              </Section>

              {/* LIMITATIONS */}

              <Section title="Ограничения">

                <ArrayBlock
                  items={
                    safeProfile.functionalLimitations
                  }
                />

              </Section>

              {/* TRIGGERS */}

              <Section title="Триггеры">

                <ArrayBlock
                  items={
                    safeProfile.possibleTriggers
                  }
                />

              </Section>

              {/* RED FLAGS */}

              <Section title="Red Flags">

                <ArrayBlock
                  items={safeProfile.redFlags}
                />

              </Section>

              {/* RESOLVED */}

              <Section title="Закрытые темы">

                <ArrayBlock
                  items={
                    safeProfile.resolvedTopics
                  }
                />

              </Section>

              {/* MISSING */}

              <Section title="Чего не хватает">

                <ArrayBlock
                  items={
                    safeProfile.missingTopics
                  }
                />

              </Section>

            </div>

            {/* FOOTER */}

            <div className="p-4 border-t border-slate-100 bg-slate-50">

              <div className="flex items-center gap-2 text-xs text-slate-500">

                <Activity size={14} />

                Profile обновляется в realtime

              </div>

            </div>

          </motion.div>

        </>
      )}

    </AnimatePresence>
  );
};