import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2, ShieldAlert, Info } from 'lucide-react';
import { AIResponse } from '../types';
import { cn } from '../lib/utils';

export const MedicalAnalysis = ({ data }: { data: AIResponse }) => {
  const dangerColors: Record<string, string> = {
    low: 'text-green-600 bg-green-50 border-green-200',
    medium: 'text-amber-600 bg-amber-50 border-amber-200',
    high: 'text-red-600 bg-red-50 border-red-200',
  };

  const levelColor = dangerColors[data.danger_level || 'low'] || dangerColors.low;

  return (
    <div className="space-y-4 mt-3">
      <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border", levelColor)}>
        {data.danger_level === 'high' && <ShieldAlert size={14} />}
        {data.danger_level === 'medium' && <AlertCircle size={14} />}
        {data.danger_level === 'low' && <CheckCircle2 size={14} />}
        {data.danger_level === 'high' ? 'Высокий риск' : data.danger_level === 'medium' ? 'Средний риск' : 'Низкий риск'}
      </div>

      <p className="text-slate-700 leading-relaxed font-medium">
        {data.summary}
      </p>

      {data.possible_risks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Возможные риски</h4>
          <ul className="grid gap-2">
            {data.possible_risks.map((risk, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-600 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                <span className="text-red-400">•</span> {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Рекомендации</h4>
          <ul className="grid gap-2">
            {data.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-600 bg-blue-50/30 p-2 rounded-lg border border-blue-100/50">
                <span className="text-blue-500">✓</span> {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-start gap-2 p-3 bg-slate-100/50 rounded-xl border border-slate-200 text-xs text-slate-500 italic">
        <Info size={14} className="shrink-0 mt-0.5" />
        {data.medical_warning}
      </div>
    </div>
  );
};
