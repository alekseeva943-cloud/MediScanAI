// src/components/PatientProfilePanel.tsx

// Панель профиля пациента.
//
// Нужна для:
// - просмотра AI state,
// - отладки profile,
// - понимания reasoning AI.
//
// Позже можно превратить
// в полноценную medical card.

import {
  X,
  Brain,
  Activity,
  AlertTriangle
} from "lucide-react";

import {
  motion,
  AnimatePresence
} from "motion/react";

interface Props {

  isOpen: boolean;

  onClose: () => void;

  profile: any;
}

const Section = ({
  title,
  children
}: any) => (

  <div className="space-y-2">

    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
      {title}
    </h3>

    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
      {children}
    </div>

  </div>
);

const ArrayBlock = ({
  items
}: any) => {

  // -----------------------------------
  // SAFE NORMALIZE
  // -----------------------------------

  const safeItems =

    Array.isArray(items)

      ? items

          .map((item) => {

            // -----------------------------
            // STRING
            // -----------------------------

            if (
              typeof item === "string"
            ) {

              return item;
            }

            // -----------------------------
            // NUMBER
            // -----------------------------

            if (
              typeof item === "number"
            ) {

              return String(item);
            }

            // -----------------------------
            // OBJECT
            // -----------------------------

            if (
              item
              &&
              typeof item === "object"
            ) {

              // symptom
              if (item.symptom) {
                return item.symptom;
              }

              // name
              if (item.name) {
                return item.name;
              }

              // title
              if (item.title) {
                return item.title;
              }

              // fallback
              return JSON.stringify(item);
            }

            return null;
          })

          .filter(Boolean)

      : [];

  // -----------------------------------
  // EMPTY
  // -----------------------------------

  if (
    safeItems.length === 0
  ) {

    return (

      <span className="text-slate-400 text-sm">
        Нет данных
      </span>
    );
  }

  // -----------------------------------
  // RENDER
  // -----------------------------------

  return (

    <div className="flex flex-wrap gap-2">

      {safeItems.map(
        (
          item: string,
          i: number
        ) => (

          <div

            key={i}

            className="px-2 py-1 rounded-full bg-white border border-slate-200 text-xs text-slate-700"
          >
            {item}
          </div>
        )
      )}

    </div>
  );
};

export const PatientProfilePanel = ({
  isOpen,
  onClose,
  profile
}: Props) => {

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
                  {profile?.mainComplaint || "Нет данных"}
                </div>

              </Section>

              {/* PAIN */}

              <Section title="Боль">

                <div className="space-y-2 text-sm">

                  <div>
                    <span className="text-slate-400">
                      Локализация:
                    </span>{" "}

                    {profile?.pain?.location || "—"}
                  </div>

                  <div>
                    <span className="text-slate-400">
                      Характер:
                    </span>{" "}

                    {profile?.pain?.character || "—"}
                  </div>

                  <div>
                    <span className="text-slate-400">
                      Длительность:
                    </span>{" "}

                    {profile?.pain?.duration || "—"}
                  </div>

                </div>

              </Section>

              {/* SYMPTOMS */}

              <Section title="Симптомы">

                <ArrayBlock
                  items={profile?.symptoms}
                />

              </Section>

              {/* NEGATIVE */}

              <Section title="Отрицательные симптомы">

                <ArrayBlock
                  items={profile?.negativeFindings}
                />

              </Section>

              {/* TRAUMA */}

              <Section title="Травма">

                <div className="space-y-2 text-sm">

                  <div>

                    <span className="text-slate-400">
                      Наличие:
                    </span>{" "}

                    {profile?.trauma?.exists
                      ? "Да"
                      : "Нет"}

                  </div>

                  <div>

                    <span className="text-slate-400">
                      Механизм:
                    </span>{" "}

                    {profile?.trauma?.mechanism || "—"}

                  </div>

                </div>

              </Section>

              {/* LIMITATIONS */}

              <Section title="Ограничения">

                <ArrayBlock
                  items={
                    profile?.functionalLimitations
                  }
                />

              </Section>

              {/* TRIGGERS */}

              <Section title="Триггеры">

                <ArrayBlock
                  items={
                    profile?.possibleTriggers
                  }
                />

              </Section>

              {/* RED FLAGS */}

              <Section title="Red Flags">

                <ArrayBlock
                  items={profile?.redFlags}
                />

              </Section>

              {/* RESOLVED */}

              <Section title="Закрытые темы">

                <ArrayBlock
                  items={
                    profile?.resolvedTopics
                  }
                />

              </Section>

              {/* MISSING */}

              <Section title="Чего не хватает">

                <ArrayBlock
                  items={
                    profile?.missingTopics
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