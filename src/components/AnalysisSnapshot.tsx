// src/components/AnalysisSnapshot.tsx

import React from 'react';

import {
  Activity,
  ShieldAlert,
  Pill,
  CheckCircle2,
  Brain,
  ChevronRight
} from 'lucide-react';

import { Card } from './UI';

interface MedicationItem {

  name: string;

  action?: string;

  contraindications?: string[];
}

interface AnalysisSnapshot {

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

  timestamp?: number;
}

export const AnalysisSnapshotView = ({
  snapshot
}: {
  snapshot: AnalysisSnapshot
}) => {

  if (!snapshot) {
    return null;
  }

  const dangerStyles = {

    low: {
      bg:
        'bg-emerald-50 border-emerald-100 text-emerald-700',
      label:
        'Низкий риск'
    },

    medium: {
      bg:
        'bg-amber-50 border-amber-100 text-amber-700',
      label:
        'Средний риск'
    },

    high: {
      bg:
        'bg-red-50 border-red-100 text-red-700',
      label:
        'Высокий риск'
    }
  };

  const currentDanger =

    dangerStyles[
      snapshot.danger_level || 'low'
    ];

  return (

    <Card className="p-5 border-teal-100 bg-teal-50/20 mb-4 rounded-[28px] shadow-sm">

      {/* HEADER */}

      <div className="flex items-start justify-between gap-3 mb-5">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white flex items-center justify-center shadow-md">

            <Activity size={20} />

          </div>

          <div>

            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
              Последний анализ
            </div>

            <h3 className="font-bold text-slate-900 text-base">
              Предварительная медицинская оценка
            </h3>

          </div>

        </div>

        <div className={`
          px-3 py-1.5 rounded-full border text-xs font-bold
          ${currentDanger.bg}
        `}>

          {currentDanger.label}

        </div>

      </div>

      {/* SUMMARY */}

      {snapshot.summary && (

        <div className="rounded-3xl bg-white border border-slate-100 p-5 mb-5 shadow-sm">

          <div className="flex items-center gap-2 mb-3">

            <Brain
              size={16}
              className="text-teal-600"
            />

            <span className="text-sm font-bold text-slate-800">
              Краткая сводка
            </span>

          </div>

          <p className="text-sm text-slate-700 leading-7 whitespace-pre-wrap">

            {snapshot.summary}

          </p>

        </div>
      )}

      {/* CONTENT */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* RISKS */}

        <div className="rounded-3xl bg-white border border-slate-100 p-5 shadow-sm space-y-4">

          <div className="flex items-center gap-2">

            <ShieldAlert
              size={16}
              className="text-amber-600"
            />

            <span className="text-sm font-bold text-slate-800">
              Риски и красные флаги
            </span>

          </div>

          <div className="space-y-2">

            {(snapshot.risks || [])
              .slice(0, 4)
              .map((risk, i) => (

                <div

                  key={i}

                  className="flex gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-100"
                >

                  <ChevronRight
                    size={14}
                    className="text-amber-700 mt-0.5 shrink-0"
                  />

                  <div className="text-xs text-amber-900 leading-6">

                    {risk}

                  </div>

                </div>
              ))}

            {(!snapshot.risks ||
              snapshot.risks.length === 0) && (

              <div className="text-xs text-slate-500">
                Серьёзных рисков не выявлено.
              </div>
            )}

          </div>

        </div>

        {/* MEDICATIONS */}

        <div className="rounded-3xl bg-white border border-slate-100 p-5 shadow-sm space-y-4">

          <div className="flex items-center gap-2">

            <Pill
              size={16}
              className="text-blue-600"
            />

            <span className="text-sm font-bold text-slate-800">
              Средства и препараты
            </span>

          </div>

          <div className="space-y-3">

            {(snapshot.medications || [])
              .slice(0, 4)
              .map((med, i) => (

                <div

                  key={i}

                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >

                  <div className="font-semibold text-sm text-slate-900">

                    {med.name}

                  </div>

                  {med.action && (

                    <div className="text-xs text-slate-600 mt-2 leading-5">

                      {med.action}

                    </div>
                  )}

                </div>
              ))}

            {(!snapshot.medications ||
              snapshot.medications.length === 0) && (

              <div className="text-xs text-slate-500">
                Рекомендации по препаратам пока отсутствуют.
              </div>
            )}

          </div>

        </div>

      </div>

      {/* FOOTER */}

      <div className="mt-5 pt-5 border-t border-teal-100 flex justify-between items-center">

        <div className="flex items-center gap-2 text-[11px] text-teal-700 font-semibold">

          <CheckCircle2 size={13} />

          <span>

            Анализ обновлён{" "}

            {new Date(
              snapshot.timestamp || Date.now()
            ).toLocaleTimeString()}

          </span>

        </div>

      </div>

    </Card>
  );
};