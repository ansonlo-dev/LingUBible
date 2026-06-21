import { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

/**
 * Common preset colours so most users can pick a colour with one tap instead of
 * fiddling with the exact hex picker. Chosen to be visually distinct and to read
 * well with the dynamic light/dark text colour. Power users who want an exact
 * colour still get the native colour picker below the presets.
 */
export const PRESET_COLORS: string[] = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#78716c', // stone
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  /** Positioning / layout classes for the trigger wrapper. */
  className?: string;
  /** Classes for the Palette trigger icon. */
  iconClassName?: string;
}

export function ColorPicker({ value, onChange, className, iconClassName }: ColorPickerProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = (value || '').toLowerCase();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn('cursor-pointer', className)}
          title={t('timetable.opt.customColor')}
          onClick={(e) => e.stopPropagation()}
        >
          <Palette className={cn('h-4 w-4', iconClassName)} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-3"
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {t('timetable.opt.presetColors')}
        </p>
        <div className="grid grid-cols-8 gap-1.5">
          {PRESET_COLORS.map((c) => {
            const selected = c.toLowerCase() === current;
            return (
              <button
                key={c}
                type="button"
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border border-black/10 transition-transform hover:scale-110',
                  selected && 'ring-2 ring-foreground ring-offset-1 ring-offset-popover',
                )}
                style={{ backgroundColor: c }}
                title={c}
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
              >
                {selected && <Check className="h-3.5 w-3.5 text-white drop-shadow" />}
              </button>
            );
          })}
        </div>
        <label className="mt-3 flex cursor-pointer items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
          <span
            className="h-6 w-6 shrink-0 rounded-full border border-black/10"
            style={{ backgroundColor: value }}
          />
          <span className="flex-1">{t('timetable.opt.customColor')}</span>
          <span className="font-mono uppercase">{current}</span>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute h-0 w-0 opacity-0"
          />
        </label>
      </PopoverContent>
    </Popover>
  );
}
