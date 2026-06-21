import { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

/**
 * Preset swatches from the Catppuccin palette (https://catppuccin.com/palette).
 * Two variants (Latte and Mocha), each with the same 10 distinct rainbow accents
 * in spectrum order, so most users can pick a pleasant colour with one tap. Power
 * users who want an exact colour still get the native colour picker below.
 * Order: red, maroon, peach, yellow, green, teal, sky, blue, mauve, pink.
 */
export const CATPPUCCIN_PALETTE: { variant: string; colors: string[] }[] = [
  {
    variant: 'Latte',
    colors: ['#d20f39', '#e64553', '#fe640b', '#df8e1d', '#40a02b', '#179299', '#04a5e5', '#1e66f5', '#8839ef', '#ea76cb'],
  },
  {
    variant: 'Mocha',
    colors: ['#f38ba8', '#eba0ac', '#fab387', '#f9e2af', '#a6e3a1', '#94e2d5', '#89dceb', '#89b4fa', '#cba6f7', '#f5c2e7'],
  },
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
        <div className="space-y-1.5">
          {CATPPUCCIN_PALETTE.map(({ variant, colors }) => (
            <div key={variant}>
              <div className="grid grid-cols-10 gap-1.5">
                {colors.map((c) => {
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
                      title={`${variant} · ${c}`}
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
            </div>
          ))}
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
