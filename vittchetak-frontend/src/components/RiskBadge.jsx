/**
 * RiskBadge — Priority badge P1-P5
 * Props: { priority: 'P1' | 'P2' | 'P3' | 'P4' | 'P5' }
 */
export default function RiskBadge({ priority }) {
  const cfg = {
    P1: {
      className: 'bg-[#ffdad6] text-[#93000a] pulse-p1',
      label: 'P1 URGENT',
      dot: 'bg-[#ba1a1a]',
    },
    P2: {
      className: 'text-yellow-700 bg-yellow-100',
      label: 'P2 ELEVATED',
      dot: 'bg-yellow-500',
    },
    P3: {
      className: 'text-[#3d4a3d] bg-[#d9e6da]',
      label: 'P3 STANDARD',
      dot: 'bg-[#d9e6da]',
    },
    P4: {
      className: 'text-blue-700 bg-blue-100',
      label: 'P4 MONITOR',
      dot: 'bg-blue-400',
    },
    P5: {
      className: 'text-[#006e2d] bg-[#72fe8f]/30',
      label: 'P5 NORMAL',
      dot: 'bg-[#1db954]',
    },
  };

  const { className, label, dot } = cfg[priority] || cfg.P3;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} ${priority === 'P1' ? 'animate-pulse' : ''}`} />
      {label}
    </div>
  );
}
