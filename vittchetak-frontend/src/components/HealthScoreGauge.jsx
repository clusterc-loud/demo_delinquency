import { useEffect, useRef } from 'react';

/**
 * HealthScoreGauge — SVG arc gauge
 * Props: { score: number (0-100), size?: number, label?: string }
 */
export default function HealthScoreGauge({ score = 0, size = 192, label = 'Health Score' }) {
  const circleRef = useRef(null);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  
  const getColor = (s) => {
    if (s < 40) return '#ba1a1a';
    if (s < 60) return '#f59e0b';
    return '#006e2d';
  };

  const color = getColor(score);
  const offset = circumference - (score / 100) * circumference;

  useEffect(() => {
    if (!circleRef.current) return;
    // Animate from full-offset to target
    circleRef.current.style.strokeDashoffset = circumference;
    const timer = setTimeout(() => {
      if (circleRef.current) {
        circleRef.current.style.transition = 'stroke-dashoffset 1s ease-out';
        circleRef.current.style.strokeDashoffset = offset;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [score, circumference, offset]);

  return (
    <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
      <svg
        className="w-full h-full transform -rotate-90"
        viewBox="0 0 100 100"
      >
        {/* Track */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="#e4f1e5"
          strokeWidth="8"
        />
        {/* Progress */}
        <circle
          ref={circleRef}
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-black font-headline leading-none"
          style={{ fontSize: size / 4, color: '#131e17' }}
        >
          {score}
        </span>
        <span
          className="font-bold uppercase tracking-widest text-center"
          style={{ fontSize: size / 16, color }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
