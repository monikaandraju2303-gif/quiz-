import React from 'react';
import { LucideIcon, BookOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = BookOpen,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  return (
    <div className="py-12 px-6 rounded-2xl border-2 border-dashed border-stone-200 text-center bg-white/60 max-w-lg mx-auto my-6">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center mx-auto mb-4 shadow-2xs">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-stone-900 mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto mb-6 leading-relaxed">
        {description}
      </p>

      {(actionText || secondaryActionText) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionText && onAction && (
            <button
              onClick={onAction}
              className="px-4 py-2 bg-[#1B2A4A] text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-[#15223c] shadow-xs transition-colors"
            >
              {actionText}
            </button>
          )}
          {secondaryActionText && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="px-4 py-2 bg-stone-100 text-stone-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-stone-200 transition-colors"
            >
              {secondaryActionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
