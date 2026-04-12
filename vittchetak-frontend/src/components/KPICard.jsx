import { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * KPICard — Key Performance Indicator card
 * Props: {
 *   label: string,
 *   value: string | number,
 *   delta?: string,
 *   deltaType?: 'positive' | 'negative' | 'neutral',
 *   sparklineData?: number[],  // 0-100 values for bars
 *   highlighted?: boolean      // green gradient variant
 * }
 */
export default function KPICard({
  label,
  value,
  delta,
  deltaType = 'neutral',
  sparklineData = [],
  highlighted = false,
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const isNumeric = typeof value === 'number';
  const animatedRef = useRef(false);

  useEffect(() => {
    if (!isNumeric || animatedRef.current) return;
    animatedRef.current = true;
    let start = 0;
    const end = value;
    const duration = 1000;
    const step = (end / duration) * 16;
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, isNumeric]);

  const deltaColor =
    deltaType === 'positive'
      ? 'text-[#006e2d] bg-[#72fe8f]/30'
      : deltaType === 'negative'
      ? 'text-[#ba1a1a] bg-[#ffdad6]/50'
      : 'text-white bg-white/20';

  const bars = sparklineData.length > 0 ? sparklineData : [40, 55, 45, 70, 60, 90];

  if (highlighted) {
    return (
      <div className="bg-gradient-to-br from-[#006e2d] to-[#1db954] p-6 rounded-xl shadow-xl shadow-[#006e2d]/10 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-white/70 uppercase tracking-widest">{label}</span>
            {delta && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${deltaColor}`}>
                {delta}
              </span>
            )}
          </div>
          <div className="text-4xl font-extrabold tracking-tighter text-white">
            {isNumeric ? displayValue.toLocaleString() : value}
          </div>
        </div>
        {sparklineData.length > 0 ? (
          <div className="mt-4 flex items-end gap-0.5 h-8">
            {bars.map((h, i) => (
              <div
                key={i}
                className="bg-white/30 w-full rounded-t-sm transition-all"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 bg-white/20 h-1.5 rounded-full overflow-hidden">
              <div className="bg-white h-full" style={{ width: '88%' }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  const barColor =
    deltaType === 'negative'
      ? 'bg-[#ba1a1a]/20'
      : deltaType === 'positive'
      ? 'bg-[#466656]/20'
      : 'bg-[#006e2d]/20';

  const barActiveColor =
    deltaType === 'negative' ? 'bg-[#ba1a1a]/60' : deltaType === 'positive' ? 'bg-[#466656]/60' : 'bg-[#006e2d]/60';

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-[#bccbb9]/15 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          <span className="text-xs font-bold text-[#3d4a3d] uppercase tracking-widest">{label}</span>
          {delta && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                deltaType === 'positive'
                  ? 'text-[#006e2d] bg-[#72fe8f]/30'
                  : deltaType === 'negative'
                  ? 'text-[#ba1a1a] bg-[#ffdad6]/30'
                  : 'text-[#006e2d] bg-[#72fe8f]/30'
              }`}
            >
              {delta}
            </span>
          )}
        </div>
        <div className="text-4xl font-extrabold tracking-tighter text-[#131e17]">
          {isNumeric ? displayValue.toLocaleString() : value}
        </div>
      </div>
      {/* Sparkline */}
      <div className="mt-4 h-8 w-full bg-[#e4f1e5] rounded flex items-end overflow-hidden">
        <div className="w-full h-full flex items-end gap-0.5 px-1">
          {bars.map((h, i) => (
            <div
              key={i}
              className={`w-full rounded-t-sm transition-all ${i === bars.length - 1 ? barActiveColor : barColor}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
