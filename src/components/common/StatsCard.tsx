import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorScheme?: 'navy' | 'blue' | 'emerald' | 'amber' | 'terracotta';
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = 'navy',
  trend,
}) => {
  const schemeStyles = {
    navy: {
      border: 'border-stone-200/90',
      iconBg: 'bg-slate-100 text-[#1B2A4A]',
    },
    blue: {
      border: 'border-blue-200/60',
      iconBg: 'bg-blue-50 text-blue-700',
    },
    emerald: {
      border: 'border-emerald-200/60',
      iconBg: 'bg-emerald-50 text-emerald-700',
    },
    amber: {
      border: 'border-amber-200/60',
      iconBg: 'bg-amber-50 text-amber-700',
    },
    terracotta: {
      border: 'border-orange-200/60',
      iconBg: 'bg-orange-50 text-[#C85A32]',
    },
  };

  const style = schemeStyles[colorScheme];

  return (
    <div className={`p-5 rounded-2xl bg-white border ${style.border} shadow-2xs hover:shadow-xs transition-all`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {value}
          </h3>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${style.iconBg} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
          {subtitle && <span className="text-stone-500 truncate">{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold shrink-0 ${
                trend.isPositive ? 'text-emerald-600' : 'text-stone-500'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
