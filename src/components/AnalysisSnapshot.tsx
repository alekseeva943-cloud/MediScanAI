// src/components/AnalysisSnapshot.tsx
import React from 'react';
import { AnalysisSnapshot } from '../ai/types';
import { Card } from './UI';
import { Activity, ShieldAlert, Pill, CheckCircle2 } from 'lucide-react';

export const AnalysisSnapshotView = ({ snapshot }: { snapshot: AnalysisSnapshot }) => {
  return (
    <Card className="p-5 border-teal-100 bg-teal-50/20 mb-4">
      <div className="flex items-center gap-2 mb-4 text-teal-700">
        <Activity size={18} />
        <h3 className="font-bold text-sm">Сводка последнего анализа</h3>
      </div>
      
      <p className="text-sm text-slate-600 mb-4 leading-relaxed">{snapshot.summary}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <ShieldAlert size={14} className="text-amber-500 mt-1 shrink-0" />
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Риски</span>
              <ul className="text-xs space-y-1 mt-1 text-slate-600">
                {snapshot.risks.slice(0, 3).map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Pill size={14} className="text-blue-500 mt-1 shrink-0" />
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Лекарства</span>
              <ul className="text-xs space-y-1 mt-1 text-slate-600">
                {snapshot.medications.slice(0, 3).map((m, i) => <li key={i}>• {m.name}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-teal-100 flex justify-between items-center">
        <div className="flex items-center gap-1.5 text-[10px] text-teal-600 font-semibold">
          <CheckCircle2 size={12} />
          <span>Актуально на {new Date(snapshot.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    </Card>
  );
};
