import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, ShieldAlert, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { AIResponse } from '../types';
import { cn } from '../lib/utils';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  defaultExpanded?: boolean;
}

const ExpandableSection = ({ title, children, icon, defaultExpanded = false }: SectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden bg-white/50">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</span>
        </div>
        {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 pb-3 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const MedicalAnalysis = ({ data }: { data: AIResponse }) => {
  const dangerColors: Record<string, string> = {
    low: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    medium: 'text-amber-600 bg-amber-50 border-amber-200',
    high: 'text-red-600 bg-red-50 border-red-200',
  };

  const levelColor = dangerColors[data.danger_level || 'low'] || dangerColors.low;

  return (
    <div className="space-y-4 mt-3">
      <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border", levelColor)}>
        {data.danger_level === 'high' && <ShieldAlert size={14} />}
        {data.danger_level === 'medium' && <AlertCircle size={14} />}
        {data.danger_level === 'low' && <CheckCircle2 size={14} />}
        {data.danger_level === 'high' ? 'Высокий риск' : data.danger_level === 'medium' ? 'Средний риск' : 'Низкий риск'}
      </div>

      <p className="text-slate-700 leading-relaxed font-medium">
        {data.summary}
      </p>

      <div className="space-y-2">
        {data.possible_risks.length > 0 && (
          <ExpandableSection title="Критические риски" icon={<ShieldAlert size={14} className="text-red-400" />} defaultExpanded={data.danger_level === 'high'}>
            <ul className="grid gap-2 mt-2">
              {data.possible_risks.map((risk, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-600 bg-red-50/20 p-2 rounded-lg border border-red-100/50">
                  <span className="text-red-400">•</span> {risk}
                </li>
              ))}
            </ul>
          </ExpandableSection>
        )}

        {data.recommendations.length > 0 && (
          <ExpandableSection title="Рекомендации" icon={<Info size={14} className="text-blue-400" />} defaultExpanded={true}>
            <ul className="grid gap-2 mt-2">
              {data.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-600 bg-blue-50/20 p-2 rounded-lg border border-blue-100/50">
                  <span className="text-blue-500">✓</span> {rec}
                </li>
              ))}
            </ul>
          </ExpandableSection>
        )}

        {data.suggested_actions && data.suggested_actions.length > 0 && (
          <ExpandableSection title="Следующие шаги" icon={<CheckCircle2 size={14} className="text-teal-400" />}>
             <ul className="grid gap-2 mt-2">
              {data.suggested_actions.map((act, i) => (
                <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
                  {act}
                </li>
              ))}
            </ul>
          </ExpandableSection>
        )}
      </div>

      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-[11px] text-slate-400 italic">
        <Info size={14} className="shrink-0 mt-0.5" />
        {data.medical_warning}
      </div>
    </div>
  );
};
