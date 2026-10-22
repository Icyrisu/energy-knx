import React from 'react';
import { Loader2, Power } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PendantLampCardProps {
  tag: string;
  label: string;
  circuitLabel: string;
  isOn: boolean;
  isLoading: boolean;
  onToggle: (tag: string, nextState: boolean) => void;
}

export const PendantLampCard: React.FC<PendantLampCardProps> = ({
  tag,
  label,
  circuitLabel,
  isOn,
  isLoading,
  onToggle,
}) => {
  return (
    <div
      onClick={() => {
        if (!isLoading) onToggle(tag, !isOn);
      }}
      className={cn(
        'group relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-150 cursor-pointer select-none overflow-hidden min-h-[220px]',
        isOn
          ? 'bg-white dark:bg-[#141519] border-2 border-[#aef31e] shadow-sm'
          : 'bg-white dark:bg-[#141519] border border-slate-200/80 dark:border-[#27272a] hover:border-slate-300 dark:hover:border-zinc-700'
      )}
    >
      {/* Header: Room Name & Circuit Label */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {label}
          </h4>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {circuitLabel}
          </span>
        </div>

        {/* State Badge - Solid Style */}
        <span
          className={cn(
            'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider font-mono transition-colors shadow-2xs',
            isOn
              ? 'bg-[#aef31e] text-black'
              : 'bg-slate-100 dark:bg-[#202127] text-slate-500 dark:text-slate-400'
          )}
        >
          {isOn ? 'ON' : 'OFF'}
        </span>
      </div>

      {/* Center: Pendant Lamp Illustration in Solid Electric Lime #aef31e */}
      <div className="flex flex-col items-center justify-center my-4 relative z-10">
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-20 h-20 transition-transform duration-150 group-hover:scale-105"
        >
          {/* Ceiling Suspension Cord */}
          <line
            x1="32"
            y1="2"
            x2="32"
            y2="18"
            stroke={isOn ? '#aef31e' : '#64748b'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Socket Mount */}
          <rect
            x="29.5"
            y="18"
            width="5"
            height="4"
            rx="1"
            fill={isOn ? '#aef31e' : '#64748b'}
          />

          {/* Lamp Shade Dome */}
          <path
            d="M18 36C18 26 24 21 32 21C40 21 46 26 46 36H18Z"
            fill={isOn ? '#aef31e' : '#334155'}
          />

          {/* Bottom Diffuser Rim */}
          <ellipse
            cx="32"
            cy="36"
            rx="14"
            ry="2.5"
            fill={isOn ? '#d4f968' : '#1e293b'}
          />

          {/* Radiating Light Rays Shining Downward */}
          <g
            stroke={isOn ? '#aef31e' : '#334155'}
            strokeWidth="2.5"
            strokeLinecap="round"
            className="transition-opacity duration-150"
            style={{ opacity: isOn ? 1 : 0.15 }}
          >
            {/* Ray 1 (left wide) */}
            <line x1="20" y1="42" x2="15" y2="52" />
            {/* Ray 2 (left mid) */}
            <line x1="26" y1="44" x2="23" y2="55" />
            {/* Ray 3 (center) */}
            <line x1="32" y1="44" x2="32" y2="57" />
            {/* Ray 4 (right mid) */}
            <line x1="38" y1="44" x2="41" y2="55" />
            {/* Ray 5 (right wide) */}
            <line x1="44" y1="42" x2="49" y2="52" />
          </g>
        </svg>
      </div>

      {/* Footer: Quick Click Action Button */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#27272a] relative z-10">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {isOn ? 'Illuminated' : 'Turned off'}
        </span>

        <button
          type="button"
          disabled={isLoading}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(tag, !isOn);
          }}
          className={cn(
            'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs',
            isOn
              ? 'bg-[#aef31e] text-black hover:bg-[#bbf63e]'
              : 'bg-slate-100 dark:bg-[#202127] text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#2a2b32]'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Power className="w-3.5 h-3.5" />
          )}
          {isOn ? 'Turn Off' : 'Turn On'}
        </button>
      </div>
    </div>
  );
};
