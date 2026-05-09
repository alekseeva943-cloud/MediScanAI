// src/components/MedicalAnalysis.tsx

import {
  AlertTriangle,
  Activity,
  ShieldAlert,
  Stethoscope,
  Pill,
  ClipboardList,
  Brain,
  ChevronRight
} from 'lucide-react';

import {
  motion
} from 'motion/react';

interface MedicationItem {

  name: string;

  action?: string;

  contraindications?: string[];
}

interface MedicalAnalysisProps {

  data: {

    summary?: string;

    probableDiagnoses?: string[];

    reasoning?: string[];

    risks?: string[];

    recommendations?: string[];

    medications?: MedicationItem[];

    suggested_actions?: string[];

    quick_replies?: string[];

    danger_level?:
      | 'low'
      | 'medium'
      | 'high';
  };
}

const Section = ({
  icon,
  title,
  children
}: any) => (

  <div className="space-y-3">

    <div className="flex items-center gap-2">

      <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">

        {icon}

      </div>

      <h3 className="text-sm font-bold text-slate-800">
        {title}
      </h3>

    </div>

    <div className="space-y-2">

      {children}

    </div>

  </div>
);

export const MedicalAnalysis = ({
  data
}: MedicalAnalysisProps) => {

  const dangerLevel =
    data?.danger_level || 'low';

  const dangerStyles = {

    low: {
      badge:
        'bg-emerald-50 text-emerald-700 border-emerald-200',
      label:
        'Низкий риск'
    },

    medium: {
      badge:
        'bg-amber-50 text-amber-700 border-amber-200',
      label:
        'Средний риск'
    },

    high: {
      badge:
        'bg-red-50 text-red-700 border-red-200',
      label:
        'Высокий риск'
    }
  };

  const currentStyle =
    dangerStyles[dangerLevel];

  return (

    <motion.div

      initial={{
        opacity: 0,
        y: 10
      }}

      animate={{
        opacity: 1,
        y: 0
      }}

      className="space-y-6"
    >

      {/* HEADER */}

      <div className="flex items-start justify-between gap-3">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white flex items-center justify-center shadow-md">

            <Stethoscope size={20} />

          </div>

          <div>

            <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">
              Предварительный анализ
            </div>

            <div className="text-lg font-bold text-slate-900">
              Медицинская оценка
            </div>

          </div>

        </div>

        <div className={`
          px-3 py-1.5 rounded-full border text-xs font-bold
          ${currentStyle.badge}
        `}>

          {currentStyle.label}

        </div>

      </div>

      {/* SUMMARY */}

      {data.summary && (

        <div className="rounded-3xl bg-slate-50 border border-slate-100 p-5">

          <div className="flex items-center gap-2 mb-3">

            <Activity
              size={16}
              className="text-teal-600"
            />

            <span className="text-sm font-bold text-slate-800">
              Что может происходить
            </span>

          </div>

          <p className="text-sm leading-7 text-slate-700 whitespace-pre-wrap">
            {data.summary}
          </p>

        </div>
      )}

      {/* DIAGNOSES */}

      {data.probableDiagnoses &&
        data.probableDiagnoses.length > 0 && (

          <Section

            icon={
              <Brain size={16} />
            }

            title="Вероятные состояния"
          >

            {data.probableDiagnoses.map(
              (item, i) => (

                <div

                  key={i}

                  className="flex items-start gap-3 p-3 rounded-2xl border border-slate-100 bg-white shadow-sm"
                >

                  <ChevronRight
                    size={16}
                    className="text-teal-600 mt-0.5 shrink-0"
                  />

                  <div className="text-sm text-slate-700 leading-6">
                    {item}
                  </div>

                </div>
              )
            )}

          </Section>
        )}

      {/* REASONING */}

      {data.reasoning &&
        data.reasoning.length > 0 && (

          <Section

            icon={
              <ClipboardList size={16} />
            }

            title="Почему AI предполагает это"
          >

            {data.reasoning.map(
              (item, i) => (

                <div

                  key={i}

                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-700 leading-6"
                >

                  {item}

                </div>
              )
            )}

          </Section>
        )}

      {/* RISKS */}

      {data.risks &&
        data.risks.length > 0 && (

          <Section

            icon={
              <AlertTriangle size={16} />
            }

            title="На что обратить внимание"
          >

            {data.risks.map(
              (item, i) => (

                <div

                  key={i}

                  className="flex gap-3 p-4 rounded-2xl border border-amber-100 bg-amber-50"
                >

                  <ShieldAlert
                    size={16}
                    className="text-amber-600 mt-0.5 shrink-0"
                  />

                  <div className="text-sm text-amber-800 leading-6">
                    {item}
                  </div>

                </div>
              )
            )}

          </Section>
        )}

      {/* RECOMMENDATIONS */}

      {data.recommendations &&
        data.recommendations.length > 0 && (

          <Section

            icon={
              <Activity size={16} />
            }

            title="Что можно сделать сейчас"
          >

            {data.recommendations.map(
              (item, i) => (

                <div

                  key={i}

                  className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-900 leading-6"
                >

                  {item}

                </div>
              )
            )}

          </Section>
        )}

      {/* MEDICATIONS */}

      {data.medications &&
        data.medications.length > 0 && (

          <Section

            icon={
              <Pill size={16} />
            }

            title="Препараты и средства"
          >

            {data.medications.map(
              (med, i) => (

                <div

                  key={i}

                  className="rounded-3xl border border-slate-100 bg-white shadow-sm p-5 space-y-3"
                >

                  <div className="font-bold text-slate-900">
                    {med.name}
                  </div>

                  {med.action && (

                    <div className="text-sm text-slate-700 leading-6">

                      <span className="font-semibold">
                        Действие:
                      </span>{" "}

                      {med.action}

                    </div>
                  )}

                  {med.contraindications &&
                    med.contraindications.length > 0 && (

                      <div className="space-y-2">

                        <div className="text-xs uppercase tracking-widest font-bold text-red-500">
                          Противопоказания
                        </div>

                        {med.contraindications.map(
                          (c, idx) => (

                            <div

                              key={idx}

                              className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3"
                            >

                              {c}

                            </div>
                          )
                        )}

                      </div>
                    )}

                </div>
              )
            )}

          </Section>
        )}

      {/* ACTIONS */}

      {data.suggested_actions &&
        data.suggested_actions.length > 0 && (

          <Section

            icon={
              <Stethoscope size={16} />
            }

            title="Что делать дальше"
          >

            {data.suggested_actions.map(
              (item, i) => (

                <div

                  key={i}

                  className="flex gap-3 p-4 rounded-2xl bg-teal-50 border border-teal-100"
                >

                  <ChevronRight
                    size={16}
                    className="text-teal-700 mt-0.5 shrink-0"
                  />

                  <div className="text-sm text-teal-900 leading-6">
                    {item}
                  </div>

                </div>
              )
            )}

          </Section>
        )}

    </motion.div>
  );
};